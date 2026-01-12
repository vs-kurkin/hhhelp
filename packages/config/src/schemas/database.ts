import { z } from 'zod'

export const databaseSchema = z.object({
    MONGO_RETRY_DELAY_MS: z.coerce.number().default(5000),
    MONGO_URI: z.url().default('mongodb://mongodb:27017/net-agent'),
})
