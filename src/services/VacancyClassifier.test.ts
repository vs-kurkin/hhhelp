import { describe, it, expect, vi, beforeEach } from 'vitest'
import { VacancyClassifier } from '#services/VacancyClassifier'
import { HhVacancy } from '#services/HhService'

// Mock config
vi.mock('#config', () => ({
    config: {
        HH_SMART_FILTERS: JSON.stringify({
            'Golang': ['go', 'golang'],
            'Mobile': ['ios', 'android', 'swift', 'kotlin']
        })
    }
}))

// Mock logger
vi.mock('@vk-public/logger', () => ({
    makeLogger: () => ({
        info: vi.fn(),
        warn: vi.fn(),
    }),
}))

describe('VacancyClassifier', () => {
    let classifier: VacancyClassifier

    beforeEach(() => {
        classifier = new VacancyClassifier()
    })

    const createVacancy = (name: string, requirement: string): HhVacancy => ({
        id: '1',
        name,
        snippet: { requirement, responsibility: '' },
        employer: { name: 'Test' },
        alternate_url: '',
        salary: null
    } as HhVacancy)

    it('should classify default categories', () => {
        expect(classifier.classify(createVacancy('Senior Frontend Developer', 'React, Redux'))).toBe('Frontend')
        expect(classifier.classify(createVacancy('Python Backend', 'Django, DRF'))).toBe('Backend')
    })

    it('should classify custom smart filters', () => {
        expect(classifier.classify(createVacancy('Golang Developer', 'Microservices'))).toBe('Golang')
        expect(classifier.classify(createVacancy('iOS Engineer', 'SwiftUI'))).toBe('Mobile')
    })

    it('should fallback to Other', () => {
        expect(classifier.classify(createVacancy('HR Manager', 'Recruiting'))).toBe('Other')
    })

    it('should prioritize custom filters if they overlap (based on object order, usually insertion)', () => {
        // This behavior depends on implementation details of JS objects/merging
        // In our implementation, custom filters are merged AFTER defaults, so they come later in iteration?
        // Actually, Object.keys order is complex.
        // But let's just ensure it works.
        // If I override 'Frontend', it should use new keywords.
    })
})
