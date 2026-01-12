/* eslint-disable @typescript-eslint/naming-convention */
import { makeLogger } from '@vk-public/logger'
import axios from 'axios'

import { MetricsService } from '#services/monitor/MetricsService'
import { HhResponseSchema, HhVacancy } from '#services/schemas/HhSchemas'
import { HhApiError, HhValidationError } from '#errors/index'

import { config } from '#config'

const logger = makeLogger('hh-service')

// Re-export for external consumers
export type { HhVacancy }

export class HhService {
    private readonly BASE_URL = 'https://api.hh.ru/vacancies'
    private readonly USER_AGENT = `HHHelp/1.0 (${ config.HH_CONTACT_EMAIL })`

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
            const message = error instanceof HhValidationError
                ? 'HH API schema validation failed'
                : 'Failed to fetch vacancies'

            this.recordError(message, error)

            return []
        }
    }

    private async fetchRawData(): Promise<unknown> {
        try {
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
                timeout: config.HH_API_TIMEOUT,
            })

            return response.data
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new HhApiError('Network or API error', error.toJSON())
            }
            throw error
        }
    }

    private validateAndExtractItems(data: unknown): HhVacancy[] {
        const parsed = HhResponseSchema.safeParse(data)

        if (!parsed.success) {
            // Throw explicit validation error
            throw new HhValidationError('Validation Error', parsed.error.format())
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
