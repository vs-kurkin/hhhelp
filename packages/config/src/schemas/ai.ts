import { z } from 'zod'

export const aiSchema = z.object({
    GEMINI_API_KEY: z.string().optional(),
    GEMINI_MODEL_NAME: z.string().default('gemini-1.5-flash'),
})
