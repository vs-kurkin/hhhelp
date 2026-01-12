import { z } from 'zod'

export const mikrotikSchema = z.object({
    MIKROTIK_HOST: z.string(),
    MIKROTIK_PASSWORD: z.string().optional(),
    MIKROTIK_PORT: z.string().transform(Number).default(8728),
    MIKROTIK_USER: z.string(),
})
