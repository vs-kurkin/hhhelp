/* eslint-disable @typescript-eslint/naming-convention */
import { makeLogger } from '@vk-public/logger'
import axios from 'axios'

import { MetricsService } from './monitor/MetricsService.js'
import { HhResponseSchema, HhVacancy } from './schemas/HhSchemas.js'

import { config } from '#config'

const logger = makeLogger('hh-service')

// Re-export for external consumers
export { HhVacancy }

export class HhService {
    private readonly BASE_URL = 'https://api.hh.ru/vacancies'
    private readonly USER_AGENT = 'HHHelp/1.0 (admin@b-vladi.ru)'

    constructor(private readonly metrics?: MetricsService) {}

    /**
     * Orchestrates the fetching, validation, and tracking of vacancies from HeadHunter.
     */
    async getVacancies(): Promise<HhVacancy[]> {
        try {
            logger.info('Initiating vacancy fetch...')

            const rawData = await this.fetchRawData()
            const vacancies = this.validateAndExtractItems(rawData)

            this.trackSuccess(vacancies.length)

            return vacancies
        } catch (error) {
            this.recordError('Failed to fetch or process vacancies', error)

            return []
        }
    }

    private async fetchRawData(): Promise<unknown> {
        const response = await axios.get(this.BASE_URL, {
            params: {
                text: config.HH_SEARCH_TEXT,
                salary: config.HH_MIN_SALARY,
                currency_code: 'RUR',
                area: config.HH_AREA,
                order_by: 'publication_time',
                per_page: 100,
            },
            headers: { 'User-Agent': this.USER_AGENT },
        })

        return response.data
    }

    private validateAndExtractItems(data: unknown): HhVacancy[] {
        const parsed = HhResponseSchema.safeParse(data)

        if (!parsed.success) {
            const validationErrors = parsed.error.format()

            this.recordError('HH API schema validation failed', validationErrors)
            throw new Error('Validation Error')
        }

        return parsed.data.items
    }

    private trackSuccess(count: number): void {
        logger.info(`Successfully processed ${ count } vacancies`)
        this.metrics?.vacanciesProcessed.inc({ status: 'fetched' }, count)
    }

    private recordError(message: string, context?: unknown): void {
        logger.error(message, { context })
        this.metrics?.hhApiErrors.inc()
    }
}
