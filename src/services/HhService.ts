/* eslint-disable @typescript-eslint/naming-convention */
import { makeLogger } from '@vk-public/logger'
import axios from 'axios'
import { z } from 'zod'

import { MetricsService } from './monitor/MetricsService.js'
import { HhResponseSchema, HhVacancy } from './schemas/HhSchemas.js'

import { config } from '#config'

const logger = makeLogger('hh-service')

export { HhVacancy }

export class HhService {
    constructor(private metrics?: MetricsService) {}

    async getVacancies(): Promise<HhVacancy[]> {
        try {
            logger.info('Fetching vacancies...')
            const response = await axios.get('https://api.hh.ru/vacancies', {
                params: {
                    text: config.HH_SEARCH_TEXT,
                    salary: config.HH_MIN_SALARY,
                    currency_code: 'RUR',
                    area: config.HH_AREA,
                    order_by: 'publication_time',
                    per_page: 100,
                },
                headers: { 'User-Agent': 'HH-Vacancy-Monitor/1.0 (admin@b-vladi.ru)' },
            })

            const parsed = HhResponseSchema.safeParse(response.data)

            if (!parsed.success) {
                logger.error('Invalid HH API response structure', {
                    errors: parsed.error.format(),
                })

                if (this.metrics) {
                    this.metrics.hhApiErrors.inc()
                }

                return []
            }

            const items = parsed.data.items

            logger.info(`Fetched ${ items.length } vacancies`)

            if (this.metrics) {
                this.metrics.vacanciesProcessed.inc({ status: 'fetched' }, items.length)
            }

            return items
        } catch (error) {
            logger.error('Error fetching vacancies', { error })

            if (this.metrics) {
                this.metrics.hhApiErrors.inc()
            }

            return []
        }
    }
}
