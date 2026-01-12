import { makeLogger } from '@vk/logger'
import { Bot, MemorySessionStorage, session } from 'grammy'

import { LogBufferTransport } from './monitor/LogBufferTransport.js'
import { MetricsService } from './monitor/MetricsService.js'

import { config } from '#config'
import { VacancyModel } from '#db'
import { AnalysisService } from '#services/AnalysisService'
import { GeminiService } from '#services/GeminiService'
import { HhVacancy } from '#services/HhService'
import { TelegramTemplates } from '#templates/TelegramTemplates'

// New modular imports
import { MyContext, SessionData, ApiError } from '../bot/types.js'
import { StateManager } from '../bot/StateManager.js'
import { VacancyClassifier } from '#services/VacancyClassifier'
import { DocumentService } from '#services/DocumentService'
import { StatusMessageHelper } from '../bot/utils/StatusMessageHelper.js'
import { authMiddleware } from '../bot/middlewares/AuthMiddleware.js'
import { userSaverMiddleware } from '../bot/middlewares/UserSaverMiddleware.js'

// Handlers
import { SystemHandlers } from '../bot/handlers/SystemHandlers.js'
import { VacancyHandlers } from '../bot/handlers/VacancyHandlers.js'
import { ApplicationHandlers } from '../bot/handlers/ApplicationHandlers.js'

const logger = makeLogger('telegram-service')

export class TelegramService {
    private bot: Bot<MyContext>
    private sessionStorage = new MemorySessionStorage<SessionData>()

    // Modular components
    private stateManager: StateManager
    private vacancyClassifier: VacancyClassifier
    private documentService: DocumentService
    private statusMessageHelper: StatusMessageHelper
    private systemHandlers: SystemHandlers
    private vacancyHandlers: VacancyHandlers
    private applicationHandlers: ApplicationHandlers

    constructor(metrics?: MetricsService, logs?: LogBufferTransport) {
        this.bot = new Bot<MyContext>(config.TELEGRAM_BOT_TOKEN_HH)

        // Initialize Services & Helpers
        this.stateManager = new StateManager()
        this.vacancyClassifier = new VacancyClassifier()
        this.documentService = new DocumentService()
        // Note: StatusMessageHelper needs API, but we might need to initialize it lazily or pass bot.api
        this.statusMessageHelper = new StatusMessageHelper(this.bot.api, this.stateManager, this.vacancyClassifier)

        const analysisService = new AnalysisService()
        const geminiService = new GeminiService()

        // Initialize Handlers
        this.systemHandlers = new SystemHandlers(metrics, logs)
        this.vacancyHandlers = new VacancyHandlers(this.stateManager, this.statusMessageHelper, this.vacancyClassifier, analysisService)
        this.applicationHandlers = new ApplicationHandlers(geminiService, this.documentService)

        this.setupMiddleware()
        this.setupRoutes()
        
        this.bot.catch(error => {
            logger.error('Telegram Bot Error', { error })
        })
    }

    private setupMiddleware() {
        this.bot.use(session({
            initial: (): SessionData => ({ step: 'idle' }),
            storage: this.sessionStorage,
        }))

        this.bot.use(userSaverMiddleware)
        this.bot.use(authMiddleware)
    }

    private setupRoutes() {
        // System
        this.bot.command('start', ctx => this.systemHandlers.handleStart(ctx))
        this.bot.command('help', ctx => this.systemHandlers.handleHelp(ctx))
        this.bot.command('stats', ctx => this.systemHandlers.handleStats(ctx))
        this.bot.command('logs', ctx => this.systemHandlers.handleLogs(ctx))
        
        // Vacancies
        this.bot.command('list', ctx => this.vacancyHandlers.handleList(ctx))
        this.bot.callbackQuery(/^show_stack_(.+)$/, ctx => this.vacancyHandlers.handleShowStack(ctx))
        this.bot.callbackQuery(/^apply_(.+)$/, ctx => this.vacancyHandlers.handleApply(ctx))

        // Application Flow
        this.bot.on('message:document', ctx => this.applicationHandlers.handleResume(ctx))
        this.bot.callbackQuery('generate_cover', ctx => this.applicationHandlers.handleGenerateCover(ctx))
        this.bot.on('message:text', ctx => this.applicationHandlers.handleTextMessage(ctx))
        this.bot.callbackQuery('send_app', ctx => this.applicationHandlers.handleSendApp(ctx))
        this.bot.callbackQuery('cancel_app', ctx => this.applicationHandlers.handleCancelApp(ctx))
    }

    async start(): Promise<void> {
        try {
            await this.bot.api.deleteWebhook({ drop_pending_updates: false })
            logger.info('Webhook deleted')
        } catch (error) {
            logger.warn('Failed to delete webhook (ignoring)', { error })
        }

        this.bot.start().catch((error: unknown) => {
            const apiError = error as ApiError

            if (apiError.error_code === 409) {
                logger.warn('Telegram Bot conflict: another instance is running. Ignoring.')
            } else {
                logger.error('Telegram Bot start failed', { error })
            }
        })
        logger.info('Telegram Service initialized (polling started)')
    }

    async sendVacancy(vacancy: HhVacancy): Promise<void> {
        this.stateManager.addVacancy(vacancy)
        await this.statusMessageHelper.updateStatusMessage()
    }

    async sendAlert(message: string): Promise<void> {
        try {
            await this.bot.api.sendMessage(config.TELEGRAM_CHAT_ID_HH, message, { parse_mode: 'HTML' })
        } catch (error) {
            logger.error('Failed to send alert', { error })
        }
    }

    async triggerApplyFromWeb(userId: number, vacancyId: string): Promise<boolean> {
        try {
            const vacancy = await VacancyModel.findOne({ hhId: vacancyId })

            if (!vacancy) {
                await this.bot.api.sendMessage(userId, '❌ Ошибка: Вакансия не найдена в базе.')

                return false
            }

            // Manually update session
            const sessionKey = userId.toString()
            const sessionData = (await this.sessionStorage.read(sessionKey)) || { step: 'idle' }

            sessionData.step = 'waiting_resume'
            sessionData.vacancyId = vacancy.hhId
            sessionData.vacancyName = vacancy.name
            sessionData.employerName = vacancy.employer

            await this.sessionStorage.write(sessionKey, sessionData)

            await this.bot.api.sendMessage(userId, TelegramTemplates.applyRequest(vacancy.name, vacancy.employer), { parse_mode: 'HTML' })

            return true
        } catch (error) {
            logger.error('Failed to trigger apply from web', {
                error, userId, vacancyId,
            })

            return false
        }
    }

    // Public method for reusing logic in index.ts if needed, though index.ts only calls sendVacancy
    public classifyVacancy(vacancy: HhVacancy): string {
        return this.vacancyClassifier.classify(vacancy)
    }
}