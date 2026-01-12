import { z } from 'zod'

export const appSchema = z.object({
    DEFAULT_SECURITY_SCORE: z.coerce.number().default(100),
    LOG_LEVEL: z.enum([
        'debug', 'info', 'warn', 'error',
    ]).default('info'),
    NODE_ENV: z.enum([
        'development', 'production', 'test',
    ]).default('development'),
    SERVICE_HOST: z.string().default('localhost'),
    SERVICE_NAME: z.string().default('localhost'),
    SERVICE_PORT: z.coerce.number(),
    HEALTH_PORT: z.coerce.number().default(9000),
    SERVICE_PUBLIC_URL: z.string().default('https://127.0.0.1:9000'),
})
