import { z } from 'zod'

export const HhVacancySchema = z.object({
    id: z.string(),
    name: z.string(),
    salary: z.object({
        from: z.number().nullable().optional(),
        to: z.number().nullable().optional(),
        currency: z.string().nullable().optional(),
    }).nullable().optional(),
    employer: z.object({
        name: z.string(),
    }),
    alternate_url: z.string(),
    snippet: z.object({
        requirement: z.string().nullable().optional(),
        responsibility: z.string().nullable().optional(),
    }).optional(),
})

export const HhResponseSchema = z.object({
    items: z.array(HhVacancySchema),
    found: z.number(),
    pages: z.number(),
    per_page: z.number(),
    page: z.number(),
})

export type HhVacancy = z.infer<typeof HhVacancySchema>
