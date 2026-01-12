export const GeminiPrompts = {
    Roles: {
        Writer: `
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
`,
        Screener: `
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
`,
        Coach: `
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
`,
    },
    Tasks: {
        CoverLetter: (vacancyName: string, employerName: string, resumeText: string) => `
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
      `,
        MatchAnalysis: (vacancyText: string, resumeText: string) => `
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

        4. 📊 **Вероятность приглашения**: [0-100]%
      `,
        ResumeAudit: (resumeText: string) => `Проанализируй это резюме:\n\n${ resumeText }`,
    },
}
