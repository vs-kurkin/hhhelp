import { HTTP_STATUS } from '@vk/utils/constants/http'
import express from 'express'

/**
 * The result of a single health indicator check.
 */
export interface HealthIndicatorResult {
    status: 'UP' | 'DOWN'
    details?: Record<string, unknown>
}

/**
 * A function that checks the health of a specific component.
 * @returns A promise that resolves to a HealthIndicatorResult.
 */
export type HealthIndicator = () => Promise<HealthIndicatorResult>

/**
 * The overall health check result, including the status of all components.
 */
export interface HealthCheckResult {
    status: 'UP' | 'DOWN'
    components: Record<string, HealthIndicatorResult>
}

/**
 * Creates an Express router for the health check endpoint.
 * @param indicators - A map of component names to their health indicator functions.
 */
export function createHttpHealthCheck(indicators: Record<string, HealthIndicator> = {}): express.Router {
    const router = express.Router()

    router.get('/health', async (_, response) => {
        const componentNames = Object.keys(indicators)
        const promises = Object.values(indicators).map(indicator => indicator())
        const results = await Promise.all(promises)

        const components: Record<string, HealthIndicatorResult> = {}
        let overallStatus: 'UP' | 'DOWN' = 'UP'

        for (const [
            index, name
        ] of componentNames.entries()) {
            const result = results[index]

            components[name] = result

            if (result.status === 'DOWN') {
                overallStatus = 'DOWN'
            }
        }

        const healthCheckResult: HealthCheckResult = {
            status: overallStatus,
            components,
        }

        const httpStatus = overallStatus === 'UP' ? HTTP_STATUS.ok : HTTP_STATUS.serviceUnavailable

        response.status(httpStatus).json(healthCheckResult)
    })

    return router
}
