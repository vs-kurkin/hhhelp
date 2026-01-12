import { ErrorHandler } from '@vk-public/errors'
import { logger as rootLogger, makeLogger } from '@vk-public/logger'
import { bootstrapService } from '@vk-public/utils/bootstrap'

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
            if (vacancies.length === 0) {
                logger.info('No vacancies fetched from HH.')

                return
            }

            // Batch filter
            const vacancyIds = vacancies.map(v => v.id)
            const newVacancyIds = await storageService.filterNewVacancies(vacancyIds)
            const newVacancies = vacancies.filter(v => newVacancyIds.includes(v.id))

            if (newVacancies.length === 0) {
                logger.info(`All ${ vacancies.length } vacancies were already processed.`)

                return
            }

            // 1. Send to Telegram (Batch) - Update in-memory state and UI
            await telegramService.sendVacanciesBatch(newVacancies)

            // 2. Mark as processed in Redis (Batch)
            await storageService.markAsProcessed(newVacancyIds)

            // 3. Save to MongoDB (Batch)
            try {
                const bulkOps = newVacancies.map(vacancy => ({
                    updateOne: {
                        filter: { hhId: vacancy.id },
                        update: {
                            hhId: vacancy.id,
                            name: vacancy.name,
                            employer: vacancy.employer.name,
                            salary: vacancy.salary ? {
                                from: vacancy.salary.from,
                                to: vacancy.salary.to,
                                currency: vacancy.salary.currency,
                            } : undefined,
                            alternateUrl: vacancy.alternate_url,
                            stack: telegramService.classifyVacancy(vacancy),
                            raw: vacancy,
                        },
                        upsert: true,
                    },
                }))

                await VacancyModel.bulkWrite(bulkOps)
                logger.info(`Saved ${ newVacancies.length } vacancies to MongoDB`)
            } catch (databaseError) {
                logger.error('Failed to save vacancies to DB', {
                    error: databaseError, count: newVacancies.length,
                })
            }

            logger.info(`Check cycle completed. Found ${ newVacancies.length } new vacancies out of ${ vacancies.length }.`)
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
