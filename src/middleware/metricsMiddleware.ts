import { type NextFunction, type Request, type Response } from 'express'

import { MetricsService } from '#services/monitor/MetricsService'

export const createMetricsMiddleware = (metrics: MetricsService) => {
    return (request: Request, response: Response, next: NextFunction): void => {
        const end = metrics.httpRequestDuration.startTimer()

        response.on('finish', () => {
            end({
                method: request.method,
                route: request.route?.path || request.path,
                statusCode: response.statusCode,
            })
        })

        next()
    }
}