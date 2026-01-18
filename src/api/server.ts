/* eslint-disable sonarjs/cors, unicorn/prevent-abbreviations, max-lines-per-function, unicorn/no-array-callback-reference, unicorn/no-array-sort, max-statements */
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { createHttpHealthCheck } from '@vk-public/health'
import { makeLogger } from '@vk-public/logger'
import cors from 'cors'
import express, { type Express } from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { register } from 'prom-client'

import { config } from '#config'
import { VacancyModel } from '#db'
import { UserModel } from '#db'
import { createMetricsMiddleware, telegramAuthMiddleware } from '#middleware'
import { HhAuthService } from '#services/HhAuthService'
import { MetricsService } from '#services/monitor/MetricsService'
import { TelegramService } from '#services/TelegramService'


const logger = makeLogger('api-server')
// eslint-disable-next-line @typescript-eslint/naming-convention
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const getTelegramUserId = (req: express.Request): number | undefined => {
    if (process.env.NODE_ENV === 'development' && req.headers['x-debug-user-id']) {
        return Number(req.headers['x-debug-user-id'])
    }

    const initData = req.headers['x-telegram-init-data'] as string
    if (!initData) return undefined
    try {
        const params = new URLSearchParams(initData)
        const userJson = params.get('user')
        if (!userJson) return undefined
        const user = JSON.parse(userJson)
        return user.id
    } catch {
        return undefined
    }
}

export function createApiApp(metricsService?: MetricsService, telegramService?: TelegramService, hhAuthService?: HhAuthService): Express {
    const app = express()

    // Trust Proxy (Traefik)
    app.set('trust proxy', 1)

    // Security Headers
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: [
                    '\'self\'', 'https://telegram.org', 'https://*.telegram.org',
                ],
                scriptSrc: [
                    '\'self\'', 'https://telegram.org', 'https://*.telegram.org', '\'unsafe-inline\'',
                ],
                imgSrc: [
                    '\'self\'', 'data:', 'https:',
                ],
                connectSrc: [
                    '\'self\'', 'https://api.telegram.org',
                ],
            },
        },
    }))

    // Rate Limiting
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        standardHeaders: true,
        legacyHeaders: false,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    app.use('/api', limiter as any)

    app.use(cors())
    app.use(express.json())

    // Metrics (Default are collected in MetricsService constructor)
    if (metricsService) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        app.use(createMetricsMiddleware(metricsService) as any)
    }

    // Health Check
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    app.use(createHttpHealthCheck({}) as any)

    app.get('/metrics', async (_req, response) => {
        try {
            if (metricsService) {
                response.set('Content-Type', metricsService.register.contentType)
                response.end(await metricsService.register.metrics())
            } else {
                response.set('Content-Type', register.contentType)
                response.end(await register.metrics())
            }
        } catch (error) {
            response.status(500).send(error)
        }
    })

    // HH OAuth Routes (Public, no middleware needed for callback, login needs userId)
    app.get('/api/auth/hh/login', (req, res) => {
        const userId = req.query.userId as string

        if (!userId || !hhAuthService) {
             res.status(400).send('Missing userId or service unavailable')

             return
        }
        
        const url = hhAuthService.getAuthUrl(userId)

        res.redirect(url)
    })

    app.get('/api/auth/hh/callback', async (req, res) => {
        const code = req.query.code as string
        const userId = req.query.state as string
        
        if (!code || !userId || !hhAuthService) {
             res.status(400).send('Invalid request')

             return
        }

        try {
            const tokens = await hhAuthService.exchangeCode(code)
            const userInfo = await hhAuthService.getUserInfo(tokens.access_token)
            let resumes = []

            try {
                resumes = await hhAuthService.getResumes(tokens.access_token)
            } catch (resumeError) {
                logger.error('Failed to fetch resumes during callback', { error: resumeError })
            }
            
            await UserModel.updateOne(
                { telegramId: Number(userId) },
                {
                    hhAuth: {
                        accessToken: tokens.access_token,
                        refreshToken: tokens.refresh_token,
                        expiresAt: Date.now() + (tokens.expires_in * 1000),
                        hhUserId: userInfo.id,
                        email: userInfo.email,
                    },
                    hhResumes: resumes
                },
                { upsert: true } // Should exist, but safety first
            )
            
            // Return success page that closes window
            res.send(`
                <html>
                <body>
                    <h1>Authorization Successful!</h1>
                    <p>You can close this window now.</p>
                    <script>
                        setTimeout(() => {
                             // Try to close if opened via window.open
                             window.close();
                             // Try to notify opener
                             if (window.opener) {
                                 window.opener.postMessage('hh_auth_success', '*');
                             }
                        }, 1000);
                    </script>
                </body>
                </html>
            `)
        } catch (error) {
            logger.error('HH Callback failed', { error })
            res.status(500).send('Authorization failed')
        }
    })

    // Secure API Routes with Telegram Auth
    // Note: We apply auth to all /api routes except if we need public ones
    // We skip /api/auth/* because callback is public and login handles its own security via state
    // But login should be initiated from app...
    
    // Applying middleware to everything ELSE under /api
    app.use('/api', (req, res, next) => {
        if (req.path.startsWith('/auth/hh')) {
            return next()
        }

        telegramAuthMiddleware(req, res, next)
    })

    // Authenticated HH Status Route
    app.get('/api/user/me', async (req, res) => {
        const userId = getTelegramUserId(req)

        if (!userId) return res.status(401).send()

        const dbUser = await UserModel.findOne({ telegramId: userId })

        res.json({
            telegramId: userId,
            isConnected: !!dbUser?.hhAuth?.accessToken,
            hhProfile: dbUser?.hhAuth?.email ? { email: dbUser.hhAuth.email } : null,
        })
    })

    // API Routes
    app.post('/api/vacancies/:id/apply', async (req, response) => {
        try {
            const vacancyId = req.params.id
            const userId = getTelegramUserId(req)

            if (!userId) {
                response.status(401).json({ error: 'Unauthorized' })

                return
            }

            if (!telegramService) {
                 response.status(503).json({ error: 'Telegram service unavailable' })

                 return
            }

            const success = await telegramService.triggerApplyFromWeb(userId, vacancyId)
            
            if (success) {
                response.json({ success: true })
            } else {
                response.status(404).json({ error: 'Vacancy not found or processing failed' })
            }

        } catch (error) {
            logger.error('Apply failed', { error })
            response.status(500).json({ error: 'Internal Server Error' })
        }
    })

    app.get('/api/vacancies', async (req, response) => {
        try {
            const page = Number(req.query.page) || 1
            const limit = Number(req.query.limit) || 20
            const stack = req.query.stack as string
            const search = req.query.search as string
            const onlyFavorites = req.query.favorites === 'true'

            const userId = getTelegramUserId(req)
            let userFavorites: string[] = []
            let userHidden: string[] = []

            if (userId) {
                const user = await UserModel.findOne({ telegramId: userId }, { favorites: 1, hiddenVacancies: 1 })
                userFavorites = user?.favorites || []
                userHidden = user?.hiddenVacancies || []
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const query: any = {}

            if (userHidden.length > 0) {
                query.hhId = { $nin: userHidden }
            }

            if (onlyFavorites) {
                if (userFavorites.length === 0) {
                    response.json({
                        data: [],
                        meta: {
                            total: 0, page, limit, pages: 0,
                        },
                    })

                    return
                }
                // Merge with existing hhId query if any
                if (query.hhId) {
                     query.hhId.$in = userFavorites
                } else {
                     query.hhId = { $in: userFavorites }
                }
            }

            if (stack && stack !== 'All') {
                query.stack = stack
            }

            if (search) {
                query.$or = [
                    {
                        name: {
                            $regex: search, $options: 'i',
                        },
                    },
                    {
                        employer: {
                            $regex: search, $options: 'i',
                        },
                    },
                ]
            }

            const total = await VacancyModel.countDocuments(query)

            const vacancies = await VacancyModel.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)

            const mappedVacancies = vacancies.map(v => ({
                ...v.toObject(),
                isFavorite: userFavorites.includes(v.hhId),
            }))

            response.json({
                data: mappedVacancies,
                meta: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit),
                },
            })
        } catch (error) {
            logger.error('Failed to fetch vacancies', { error })
            response.status(500).json({ error: 'Internal Server Error' })
        }
    })

    app.post('/api/favorites/:id', async (req, res) => {
        const userId = getTelegramUserId(req)

        if (!userId) return res.status(401).json({ error: 'Unauthorized' })

        try {
            await UserModel.updateOne(
                { telegramId: userId },
                { $addToSet: { favorites: req.params.id } },
                { upsert: true },
            )
            res.json({ success: true })
        } catch (error) {
            logger.error('Failed to add favorite', { error })
            res.status(500).json({ error: 'Internal Server Error' })
        }
    })

    app.delete('/api/favorites/:id', async (req, res) => {
        const userId = getTelegramUserId(req)

        if (!userId) return res.status(401).json({ error: 'Unauthorized' })

        try {
            await UserModel.updateOne(
                { telegramId: userId },
                { $pull: { favorites: req.params.id } },
            )
            res.json({ success: true })
        } catch (error) {
            logger.error('Failed to remove favorite', { error })
            res.status(500).json({ error: 'Internal Server Error' })
        }
    })

    app.post('/api/vacancies/:id/hide', async (req, res) => {
        const userId = getTelegramUserId(req)

        if (!userId) return res.status(401).json({ error: 'Unauthorized' })

        try {
            await UserModel.updateOne(
                { telegramId: userId },
                { $addToSet: { hiddenVacancies: req.params.id } },
                { upsert: true },
            )
            res.json({ success: true })
        } catch (error) {
            logger.error('Failed to hide vacancy', { error })
            res.status(500).json({ error: 'Internal Server Error' })
        }
    })

    app.delete('/api/vacancies/:id/hide', async (req, res) => {
        const userId = getTelegramUserId(req)

        if (!userId) return res.status(401).json({ error: 'Unauthorized' })

        try {
            await UserModel.updateOne(
                { telegramId: userId },
                { $pull: { hiddenVacancies: req.params.id } },
            )
            res.json({ success: true })
        } catch (error) {
            logger.error('Failed to unhide vacancy', { error })
            res.status(500).json({ error: 'Internal Server Error' })
        }
    })

    // Serve Frontend
    const viewPath = path.resolve(process.cwd(), 'public')

    app.use(express.static(viewPath))

    // Fallback for SPA
    app.use((req, res, next) => {
        if (req.method !== 'GET') return next()
        
        if (req.path.startsWith('/api') || req.path.startsWith('/health') || req.path.startsWith('/metrics')) {
            return next()
        }

        res.sendFile(path.join(viewPath, 'index.html'))
    })

    return app
}

export function startApiServer(metricsService?: MetricsService, telegramService?: TelegramService, hhAuthService?: HhAuthService): void {
    const app = createApiApp(metricsService, telegramService, hhAuthService)
    const port = config.HEALTH_PORT

    app.listen(port, '0.0.0.0', () => {
        logger.info(`API Server listening on port ${ port }`)
    })
}
