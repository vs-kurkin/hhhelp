export { createHttpHealthCheck } from '#functions'
export type { HealthIndicatorResult, HealthIndicator } from '#functions'

import { makeLogger } from '@vk/logger'
import express from 'express'
import { collectDefaultMetrics, register } from 'prom-client'

import { createHttpHealthCheck, type HealthIndicator } from '#functions'

const logger = makeLogger('health-check')

// Enable default metrics collection (CPU, Memory, Event Loop, etc.)
collectDefaultMetrics()

/**
 * Starts a lightweight HTTP server for health checks and metrics.
 * @param indicators - A map of component names to their health indicator functions.
 * @param port - The port to listen on (default: 9000).
 */
export function startHealthCheckServer(
    indicators: Record<string, HealthIndicator> = {},
    port = 9000,
): void {
    const app = express()

    app.disable('x-powered-by')
    const healthCheckRouter = createHttpHealthCheck(indicators)

    app.use(healthCheckRouter)

    // Expose Prometheus metrics
    app.get('/metrics', async (_request, response) => {
        try {
            response.set('Content-Type', register.contentType)
            const metrics = await register.metrics()

            response.end(metrics)
        } catch (error) {
            logger.error('Failed to generate metrics', { error })
            response.status(500).send('Internal Server Error')
        }
    })

    app.listen(port, '0.0.0.0', () => {
        logger.info(`Health check and metrics server listening on port ${ port }`)
    })
}

/**
 * Starts a background watchdog that periodically checks health indicators.
 * If any indicator returns DOWN, the process exits with code 1.
 * @param indicators - A map of component names to their health indicator functions.
 * @param options - Configuration options (interval).
 * @returns The interval timer (can be used to clearInterval).
 */
export function startWatchdog(
    indicators: Record<string, HealthIndicator>,
    options: { intervalMs?: number } = {},
): ReturnType<typeof setInterval> {
    const { intervalMs = 30_000 } = options

    logger.info(`Starting connection watchdog with ${ intervalMs }ms interval...`)

    return setInterval(async () => {
        try {
            const componentNames = Object.keys(indicators)

            for (const name of componentNames) {
                const check = indicators[name]

                try {
                    const result = await check()

                    if (result.status === 'DOWN') {
                        logger.error(`Watchdog: Component '${ name }' is DOWN. Exiting to trigger restart...`, { details: result.details })
                        // eslint-disable-next-line unicorn/no-process-exit
                        process.exit(1)
                    }
                } catch (checkError) {
                    logger.error(`Watchdog: Component '${ name }' check failed. Exiting...`, { error: checkError })
                    // eslint-disable-next-line unicorn/no-process-exit
                    process.exit(1)
                }
            }
        } catch (error) {
            logger.error('Watchdog loop failed', { error })
            // eslint-disable-next-line unicorn/no-process-exit
            process.exit(1)
        }
    }, intervalMs)
}
