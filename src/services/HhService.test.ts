import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { HhService } from './HhService'
import { MetricsService } from './monitor/MetricsService'

vi.mock('axios')
vi.mock('@vk-public/logger', () => ({
    makeLogger: () => ({
        info: vi.fn(),
        error: vi.fn(),
    }),
}))

describe('HhService', () => {
    let service: HhService
    let mockMetrics: MetricsService

    beforeEach(() => {
        mockMetrics = {
            vacanciesProcessed: { inc: vi.fn() },
            hhApiErrors: { inc: vi.fn() },
        } as unknown as MetricsService

        service = new HhService(mockMetrics)
        vi.clearAllMocks()
    })

    it('should return valid vacancies on successful API response', async () => {
        const mockData = {
            items: [
                {
                    id: '123',
                    name: 'Node.js Developer',
                    employer: { name: 'Tech Corp' },
                    alternate_url: 'https://hh.ru/vacancy/123',
                },
            ],
            found: 1,
            pages: 1,
            per_page: 20,
            page: 0,
        };

        (axios.get as any).mockResolvedValue({ data: mockData })

        const result = await service.getVacancies()

        expect(result).toHaveLength(1)
        expect(result[0].id).toBe('123')
        expect(mockMetrics.vacanciesProcessed.inc).toHaveBeenCalledWith({ status: 'fetched' }, 1)
    })

    it('should return empty array and log error on API failure', async () => {
        (axios.get as any).mockRejectedValue(new Error('Network Error'))

        const result = await service.getVacancies()

        expect(result).toEqual([])
        expect(mockMetrics.hhApiErrors.inc).toHaveBeenCalled()
    })

    it('should return empty array and log error on Validation failure', async () => {
         const invalidData = {
            items: [
                {
                    id: '123',
                    // Missing required 'name' and 'employer'
                    alternate_url: 'https://hh.ru/vacancy/123',
                },
            ],
        };

        (axios.get as any).mockResolvedValue({ data: invalidData })

        const result = await service.getVacancies()

        expect(result).toEqual([])
        expect(mockMetrics.hhApiErrors.inc).toHaveBeenCalled()
    })
})
