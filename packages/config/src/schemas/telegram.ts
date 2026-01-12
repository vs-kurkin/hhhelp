import { z } from 'zod'

export const telegramSchema = z.object({
    TELEGRAM_BOT_TOKEN: z.string().optional(),
    TELEGRAM_CHAT_ID: z.string().optional(),
    TELEGRAM_PROGRESS_UPDATE_THRESHOLD: z.coerce.number().default(5),
})
