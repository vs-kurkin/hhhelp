import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai'
import { makeLogger } from '@vk/logger'

import { config } from '#config'

const logger = makeLogger('gemini-service')

export class GeminiService {
    private genAI: GoogleGenerativeAI

    constructor() {
        if (!config.GEMINI_API_KEY) {
            logger.warn('GEMINI_API_KEY is not set. AI features will be disabled.')
        }

        this.genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY || '')
    }

    async generateCoverLetter(vacancyName: string, employerName: string, resumeText: string): Promise<string> {
        if (!config.GEMINI_API_KEY) return 'AI functionality is not configured.'

        try {
            // Role: Job Description Writer (2025) - Adapted for Cover Letters
            // We use the persona of an expert writer to create compelling content.
            const systemInstruction = `
# Role
Job Description Writer (2025)

# Persona
You write professional content that attracts top talent and employers. You are an expert copywriter.

# Task
Create clear, inclusive, and attractive cover letters based on candidate data.

# Constraints
- Tone: Professional yet exciting.
- Style: Concise, action-oriented.
- Language: Russian.
`
            const model = this.getModel(systemInstruction)

            // Optimized prompt: concise instructions
            const prompt = `
        ЗАДАЧА: Напиши короткое (до 150 слов) сопроводительное письмо (Cover Letter) для отклика.
        
        ВАКАНСИЯ:
        Позиция: ${ vacancyName }
        Компания: ${ employerName }
        
        КАНДИДАТ (Резюме/Профиль):
        ${ resumeText }
        
        ТРЕБОВАНИЯ К ПИСЬМУ:
        - Без приветствий типа "Доброго времени суток".
        - Сразу объясни, чем опыт кандидата полезен именно этой компании.
        - Упомяни конкретные навыки из профиля.
        - Призыв к действию в конце.
      `

            const result = await model.generateContent(prompt)
            const response = result.response

            return response.text()
        } catch (error) {
            logger.error('Error generating cover letter with Gemini', { error })

            return 'Не удалось сгенерировать письмо. Попробуйте позже или напишите его вручную.'
        }
    }

    async analyzeMatch(vacancyText: string, resumeText: string): Promise<string> {
        if (!config.GEMINI_API_KEY) return ''

        try {
            // Role: AI Resume Screener & Analyzer (from /role)
            const systemInstruction = `
# Role
AI Resume Screener & Analyzer

# Persona
You are an objective, data-driven evaluator of talent.

# Task
Analyze resumes against job descriptions and provide detailed feedback.

# Constraints
- Scoring: 0-100 scale.
- Analysis: Match hard skills, soft skills, experience depth.
- Detection: Flag inconsistencies or AI-generated resumes.
- Output: Structured report in Russian language.
`
            const model = this.getModel(systemInstruction)

            const prompt = `
        ЗАДАЧА: Оцени совместимость резюме с вакансией.
        
        ВАКАНСИЯ:
        ${ vacancyText }
        
        РЕЗЮМЕ:
        ${ resumeText }
        
        ВЫВОД (Строго следуй структуре):
        1. ✅ **Чем подходит** (Сильные стороны):
           - [Конкретные совпадения навыков и опыта]
        
        2. ❌ **Не совпадает** (Чего нет / Риски):
           - [Критические требования, которых нет в резюме]
           - [Несоответствие уровня/стека]

        3. 🧩 **Степень соответствия**: [Низкая / Средняя / Высокая / Идеальная]
           - [Краткое пояснение одним предложением]

        4. 📊 **Вероятность приглашения**: [0-100]%`

            const result = await model.generateContent(prompt)
            const response = result.response

            return response.text()
        } catch (error) {
            logger.error('Error analyzing match', { error })

            return ''
        }
    }

    async analyzeResume(resumeText: string): Promise<string> {
        if (!config.GEMINI_API_KEY) return 'AI functionality is disabled.'

        try {
            const systemInstruction = `
# Role
Career Coach & Resume Auditor

# Persona
You provide constructive, harsh but fair feedback on resumes.

# Task
Audit the resume and suggest improvements.

# Output
Russian language. Structure:
1. Summary (Общее впечатление)
2. Strengths (Сильные стороны)
3. Weaknesses (Слабые стороны)
4. Recommendations (Что улучшить)
`
            const model = this.getModel(systemInstruction)
            const prompt = `Проанализируй это резюме:\n\n${ resumeText }`

            const result = await model.generateContent(prompt)

            return result.response.text()
        } catch (error) {
            logger.error('Error analyzing resume', { error })

            return 'Ошибка анализа резюме.'
        }
    }

    private getModel(systemInstruction: string): GenerativeModel {
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
