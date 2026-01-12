import { createHmac } from 'node:crypto'

import { makeLogger } from '@vk/logger'
import { NextFunction, Request, Response } from 'express'

import { config } from '#config'

const logger = makeLogger('auth-middleware')

function computeHash(initData: string): { computed: string; hash: string; authDate: number } {
    const urlParameters = new URLSearchParams(initData)
    const hash = urlParameters.get('hash')

    if (!hash) {
        throw new Error('Missing hash')
    }

    urlParameters.delete('hash')

    const parameters: string[] = []

    for (const [
        key, value
    ] of urlParameters.entries()) {
        parameters.push(`${ key }=${ value }`)
    }

    parameters.sort((a, b) => a.localeCompare(b))
    const dataCheckString = parameters.join('\n')

    const secretKey = createHmac('sha256', 'WebAppData').update(config.TELEGRAM_BOT_TOKEN_HH).digest()
    const computed = createHmac('sha256', secretKey).update(dataCheckString).digest('hex')
    const authDate = Number(urlParameters.get('auth_date'))

    return {
        computed, hash, authDate,
    }
}

function isValidHash(initData: string): boolean {
    const {
        computed, hash, authDate,
    } = computeHash(initData)

    if (computed !== hash) {
        return false
    }

    // Validate expiration (24h)
    return (Date.now() / 1000 - authDate) <= 86_400
}

export function telegramAuthMiddleware(request: Request, response: Response, next: NextFunction): void {
    if (request.path === '/health' || request.path === '/metrics') {
        next()

        return
    }

    if (process.env.NODE_ENV === 'development' && request.headers['x-debug-user-id']) {
        next()

        return
    }

    const initData = request.headers['x-telegram-init-data'] as string

    if (!initData) {
        logger.warn('Missing Telegram Init Data', { ip: request.ip })
        response.status(401).json({ error: 'Unauthorized: Missing Init Data' })

        return
    }

    try {
        if (!isValidHash(initData)) {
            throw new Error('Invalid hash or expired')
        }

        next()
    } catch (error) {
        logger.warn('Telegram Auth Failed', {
            error: (error as Error).message, ip: request.ip,
        })
        response.status(401).json({ error: 'Unauthorized: Invalid Init Data' })
    }
}
