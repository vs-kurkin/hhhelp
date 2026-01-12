/* eslint-disable unicorn/no-process-exit */
import { type ErrorHandler } from '@vk/errors'
import { type Logger } from '@vk/logger'

interface ServiceLifecycle {
    start: () => Promise<void>
    shutdown: (signal: string) => Promise<void>
    logger: Logger
    errorHandler: ErrorHandler
}

export async function bootstrapService(lifecycle: ServiceLifecycle): Promise<void> {
    const {
        start, shutdown, logger, errorHandler,
    } = lifecycle

    const handleShutdown = async (signal: string): Promise<void> => {
        logger.info(`Received ${ signal }. Shutting down gracefully.`)

        try {
            await shutdown(signal)
            process.exit(0)
        } catch (error) {
            errorHandler.handleError(error as Error, `Error during shutdown with signal ${ signal }.`)
            process.exit(1)
        }
    }

    try {
        await start()
    } catch (error) {
        errorHandler.handleError(error as Error, 'Failed to start service.')
        process.exit(1)
    }

    process.on('SIGINT', () => handleShutdown('SIGINT'))
    process.on('SIGTERM', () => handleShutdown('SIGTERM'))
}
