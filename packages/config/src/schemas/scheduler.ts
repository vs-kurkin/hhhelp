import { z } from 'zod'

export const schedulerSchema = z.object({
    SCHEDULE_AUDIT_SCAN: z.string().default('0 2 * * *'), // Every day at 2 AM
    SCHEDULE_DEVICE_DISCOVERY: z.string().default('0 */6 * * *'), // Every 6 hours
    SCHEDULE_SECURITY_ANALYSIS: z.string().default('0 4 * * *'), // Every day at 4 AM
})
