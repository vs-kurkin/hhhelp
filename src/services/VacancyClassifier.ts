import { HhVacancy } from '#services/HhService'
import { config } from '#config'
import { makeLogger } from '@vk-public/logger'

const logger = makeLogger('vacancy-classifier')

export class VacancyClassifier {
    private filters: Record<string, string[]> = {
        Frontend: ['frontend', 'vue', 'react', 'angular', 'фронтенд', 'js', 'typescript'],
        Backend: ['backend', 'node', 'python', 'java', 'go', 'golang', 'php', 'бэкенд'],
        Fullstack: ['fullstack', 'фулстек'],
        'Lead/Senior': ['lead', 'teamlead', 'тимлид', 'senior', 'сеньор', 'architect', 'cto'],
        DevOps: ['devops', 'sre', 'ci/cd', 'kubernetes', 'docker'],
    }

    constructor() {
        this.loadCustomFilters()
    }

    public classify(vacancy: HhVacancy): string {
        const text = (vacancy.name + ' ' + (vacancy.snippet.requirement || '')).toLowerCase()

        // 1. Check custom/merged filters
        for (const [category, keywords] of Object.entries(this.filters)) {
            if (this.matchesAny(text, keywords)) {
                return category
            }
        }

        return 'Other'
    }

    private matchesAny(text: string, keywords: string[]): boolean {
        return keywords.some(keyword => {
            // Escape special regex characters
            const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            // Match whole word or valid substring boundaries
            const regex = new RegExp(`(^|[^a-zA-Z0-9а-яА-Я])${ escaped }([^a-zA-Z0-9а-яА-Я]|$)`, 'i')

            return regex.test(text)
        })
    }

    private loadCustomFilters() {
        try {
            const custom = JSON.parse(config.HH_SMART_FILTERS) as Record<string, string[]>

            // Merge custom filters: put custom FIRST to ensure priority in iteration
            this.filters = { ...custom, ...this.filters }

            logger.info('Loaded smart filters', { categories: Object.keys(this.filters) })
        } catch (error) {
            logger.warn('Failed to parse HH_SMART_FILTERS, using defaults', { error })
        }
    }
}
