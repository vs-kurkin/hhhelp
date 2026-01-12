import { z } from 'zod'

import { type Camelize } from '#mappers'
import { aiSchema } from '#schemas/ai'
import { appSchema } from '#schemas/app'
import { databaseSchema } from '#schemas/database'
import { mikrotikSchema } from '#schemas/mikrotik'
import { queueSchema } from '#schemas/queue'
import { scannerSchema } from '#schemas/scanner'
import { schedulerSchema } from '#schemas/scheduler'
import { telegramSchema } from '#schemas/telegram'
import { vaultSchema } from '#schemas/vault'

export const configSchema = appSchema
    .extend(databaseSchema.shape)
    .extend(queueSchema.shape)
    .extend(vaultSchema.shape)
    .extend(schedulerSchema.shape)
    .extend(scannerSchema.shape)
    .extend(mikrotikSchema.shape)
    .extend(telegramSchema.shape)
    .extend(aiSchema.shape)

type InferredConfig = z.infer<typeof configSchema>

export type AppConfig = Camelize<InferredConfig>

