import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GeminiService } from '#services/GeminiService'

vi.mock('@vk-public/logger', () => ({
    makeLogger: () => ({
        warn: vi.fn(),
        error: vi.fn(),
    }),
}))

vi.mock('#config', () => ({
    config: {
        GEMINI_API_KEY: 'mock-api-key',
        GEMINI_MODEL_NAME: 'gemini-1.5-flash',
    },
}))

// Mock GoogleGenerativeAI class
const mockGenerateContent = vi.fn()
const mockGetGenerativeModel = vi.fn(() => ({
    generateContent: mockGenerateContent,
}))

vi.mock('@google/generative-ai', () => {
    return {
        GoogleGenerativeAI: vi.fn().mockImplementation(function () {
            return {
                getGenerativeModel: mockGetGenerativeModel,
            }
        }),
    }
})

describe('GeminiService', () => {
    let service: GeminiService

    beforeEach(() => {
        service = new GeminiService()
        vi.clearAllMocks()
    })

    it('should generate cover letter successfully', async () => {
        mockGenerateContent.mockResolvedValue({
            response: { text: () => 'Mock Cover Letter' },
        })

        const result = await service.generateCoverLetter('Dev', 'Corp', 'Resume')

        expect(result).toBe('Mock Cover Letter')
        expect(mockGetGenerativeModel).toHaveBeenCalled()
    })

    it('should handle API errors gracefully', async () => {
        mockGenerateContent.mockRejectedValue(new Error('API Error'))

        const result = await service.generateCoverLetter('Dev', 'Corp', 'Resume')

        expect(result).toContain('Не удалось сгенерировать письмо')
    })
})
