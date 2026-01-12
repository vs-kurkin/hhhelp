import { HhVacancy } from '#services/HhService'

interface AnalysisResult {
    score: number;
    reasons: string[];
    roles: string[];
    stack: string[];
}

export class AnalysisService {
    private readonly rules = {
        roles: [
            'Team Lead', 'TeamLead', 'Tech Lead', 'TechLead', 'Architect', 'CTO',
            'Руководитель', 'Лид', 'Lead', 'Head of',
        ],
        stack: [
            'Node.js', 'NodeJS', 'Nest.js', 'NestJS', 'TypeScript', 'TS',
            'Python', 'Django', 'FastAPI', 'Go', 'Golang', 'C++', 'Rust',
        ],
        conditions: [
            'Удаленно', 'Remote', 'Гибрид', 'Hybrid', 'Relocation', 'Релокация',
        ],
    }

    analyze(vacancy: HhVacancy): AnalysisResult {
        const text = `${ vacancy.name } ${ vacancy.snippet?.requirement ?? '' } ${ vacancy.snippet?.responsibility ?? '' }`.toLowerCase()

        const roles = this.findMatches(text, this.rules.roles)
        const stack = this.findMatches(text, this.rules.stack)
        const conditions = this.findMatches(text, this.rules.conditions)

        const reasons: string[] = []

        if (roles.length > 0) reasons.push(`🎯 Роль: ${ roles.join(', ') }`)

        if (stack.length > 0) reasons.push(`🛠 Стек: ${ stack.join(', ') }`)

        if (vacancy.salary) {
            if (vacancy.salary.from && vacancy.salary.from >= 300_000) {
                reasons.push(`💰 Высокая ЗП (>300k)`)
            } else if (vacancy.salary.from && vacancy.salary.from >= 250_000) {
                reasons.push(`💵 Хорошая ЗП (>250k)`)
            }
        }

        if (conditions.length > 0) reasons.push(`🌍 ${ conditions.join(', ') }`)

        return {
            score: roles.length + stack.length,
            reasons,
            roles,
            stack,
        }
    }

    private findMatches(text: string, keywords: string[]): string[] {
        // Unique matches
        const found = new Set<string>()

        for (const keyword of keywords) {
            if (text.includes(keyword.toLowerCase())) {
                // Capitalize for display
                found.add(keyword)
            }
        }

        return [ ...found ]
    }
}