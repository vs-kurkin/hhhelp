import { HhVacancy } from '#services/HhService'

export class VacancyClassifier {
    public classify(vacancy: HhVacancy): string {
        const text = (vacancy.name + ' ' + (vacancy.snippet.requirement || '')).toLowerCase()

        if (text.includes('frontend') || text.includes('vue') || text.includes('react') || text.includes('фронтенд')) return 'Frontend'

        if (text.includes('backend') || text.includes('node') || text.includes('python') || text.includes('java') || text.includes('бэкенд')) return 'Backend'

        if (text.includes('fullstack') || text.includes('фулстек')) return 'Fullstack'

        if (text.includes('lead') || text.includes('teamlead') || text.includes('тимлид') || text.includes('senior') || text.includes('сеньор')) return 'Lead/Senior'

        if (text.includes('devops') || text.includes('sre')) return 'DevOps'

        return 'Other'
    }
}
