import { ErrorHandler } from '@vk/errors'
import { logger as rootLogger, makeLogger } from '@vk/logger'
import { bootstrapService } from '@vk/utils/bootstrap'

import { startApiServer } from './api/server.js'

import { config } from '#config'
import { connectToMongo, disconnectFromMongo, VacancyModel } from '#db/index'
import { HhAuthService } from '#services/HhAuthService'
import { HhService } from '#services/HhService'
import { AlertService } from '#services/monitor/AlertService'
import { LogBufferTransport } from '#services/monitor/LogBufferTransport'
import { MetricsService } from '#services/monitor/MetricsService'
import { StorageService } from '#services/StorageService'
import { TelegramService } from '#services/TelegramService'


const logger = makeLogger('app')
const errorHandler = new ErrorHandler(logger)
let intervalId: ReturnType<typeof setInterval> | null = null

// eslint-disable-next-line max-lines-per-function
async function start() {
    logger.info('Starting HH Vacancy Monitor...')

    // Monitor Setup
    const logBuffer = new LogBufferTransport({ size: 100 })

    rootLogger.add(logBuffer)
    const metricsService = new MetricsService()

    await connectToMongo()

    const hhService = new HhService(metricsService)
    const hhAuthService = new HhAuthService()
    const storageService = new StorageService()
    const telegramService = new TelegramService(metricsService, logBuffer)

    const alertService = new AlertService(metricsService, logBuffer, async message => {
        await telegramService.sendAlert(message)
    })

    await storageService.init()
    await telegramService.start()

    // Start API & Health Check
    startApiServer(metricsService, telegramService, hhAuthService)

    const runCheck = async () => {
        try {
            logger.info('Running check cycle...')
            // Run Alert Check
            await alertService.check()

            const vacancies = await hhService.getVacancies()
            let newVacanciesCount = 0
            let skippedCount = 0

            for (const vacancy of vacancies) {
                const isProcessed = await storageService.isProcessed(vacancy.id)

                if (!isProcessed) {
                    newVacanciesCount++
                    await telegramService.sendVacancy(vacancy)
                    await storageService.addProcessed(vacancy.id)

                    // Save to MongoDB
                    try {
                        await VacancyModel.updateOne(
                            { hhId: vacancy.id },
                            {
                                hhId: vacancy.id,
                                name: vacancy.name,
                                employer: vacancy.employer.name,
                                salary: vacancy.salary ? {
                                    from: vacancy.salary.from,
                                    to: vacancy.salary.to,
                                    currency: vacancy.salary.currency,
                                } : undefined,
                                alternateUrl: vacancy.alternate_url,
                                stack: telegramService.classifyVacancy(vacancy), // Reusing public method or logic
                                raw: vacancy,
                            },
                            { upsert: true },
                        )
                    } catch (databaseError) {
                        logger.error('Failed to save vacancy to DB', {
                            error: databaseError, id: vacancy.id,
                        })
                    }

                    // Add small delay to avoid hitting TG rate limits
                    await new Promise(resolve => setTimeout(resolve, 1000))
                } else {
                    skippedCount++
                }
            }

            if (skippedCount === vacancies.length && vacancies.length > 0) {
                logger.info(`All ${ vacancies.length } vacancies were already processed. To re-process, clear Redis keys 'vacancy:processed:*'.`)
            }

            logger.info(`Check cycle completed. Found ${ newVacanciesCount } new vacancies out of ${ vacancies.length }.`)
        } catch (error) {
            logger.error('Error in check cycle', { error })
        }
    }

    // Initial run
    await runCheck()

    if (process.argv.includes('--run-once')) {
        logger.info('Run once completed. Exiting.')
        // eslint-disable-next-line unicorn/no-process-exit
        process.exit(0)
    }

    // Schedule
    const intervalMs = config.POLL_INTERVAL_MINUTES * 60 * 1000

    intervalId = setInterval(runCheck, intervalMs)
}

async function shutdown(signal: string) {
    logger.info(`${ signal } received. Stopping...`)

    if (intervalId) clearInterval(intervalId)

    await disconnectFromMongo()
}

try {
    await bootstrapService({
        start,
        shutdown,
        logger,
        errorHandler,
    })
} catch (error) {
    logger.error('Failed to bootstrap service', { error })
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(1)
}
