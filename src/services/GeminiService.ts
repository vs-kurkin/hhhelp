import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai'
import { makeLogger } from '@vk-public/logger'

import { GeminiPrompts } from './prompts/GeminiPrompts.js'

import { config } from '#config'

const logger = makeLogger('gemini-service')

export class GeminiService {
    private genAI: GoogleGenerativeAI | null = null

    constructor() {
        if (config.GEMINI_API_KEY) {
            this.genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY)
        } else {
            logger.warn('GEMINI_API_KEY is not set. AI features will be disabled.')
        }
    }

    async generateCoverLetter(vacancyName: string, employerName: string, resumeText: string): Promise<string> {
        if (!this.genAI) return 'AI functionality is not configured.'

        try {
            const model = this.getModel(GeminiPrompts.Roles.Writer)
            const prompt = GeminiPrompts.Tasks.CoverLetter(vacancyName, employerName, resumeText)
            const result = await model.generateContent(prompt)

            return result.response.text()
        } catch (error) {
            logger.error('Error generating cover letter with Gemini', { error })

            return 'Не удалось сгенерировать письмо. Попробуйте позже или напишите его вручную.'
        }
    }

    async analyzeMatch(vacancyText: string, resumeText: string): Promise<string> {
        if (!this.genAI) return ''

        try {
            const model = this.getModel(GeminiPrompts.Roles.Screener)
            const prompt = GeminiPrompts.Tasks.MatchAnalysis(vacancyText, resumeText)
            const result = await model.generateContent(prompt)

            return result.response.text()
        } catch (error) {
            logger.error('Error analyzing match', { error })

            return ''
        }
    }

    async analyzeResume(resumeText: string): Promise<string> {
        if (!this.genAI) return 'AI functionality is disabled.'

        try {
            const model = this.getModel(GeminiPrompts.Roles.Coach)
            const prompt = GeminiPrompts.Tasks.ResumeAudit(resumeText)
            const result = await model.generateContent(prompt)

            return result.response.text()
        } catch (error) {
            logger.error('Error analyzing resume', { error })

            return 'Ошибка анализа резюме.'
        }
    }

    private getModel(systemInstruction: string): GenerativeModel {
        if (!this.genAI) {
            throw new Error('Gemini API not initialized')
        }

        return this.genAI.getGenerativeModel({
            model: config.GEMINI_MODEL_NAME,
            systemInstruction,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1000,
                candidateCount: 1,
            },
        })
    }
}
