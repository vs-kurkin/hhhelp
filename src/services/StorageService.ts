import { makeLogger } from '@vk/logger'

import { redis } from '#db/redis'

const logger = makeLogger('storage-service')

export class StorageService {
    private readonly prefix = 'vacancy:processed:'
    private readonly ttlSeconds = 60 * 60 * 24 * 30 // 30 days

    async init(): Promise<void> {
        // Redis connection is handled in db/redis.ts, but we can verify it here if needed
        logger.info('StorageService initialized (using Redis)')
    }

    async isProcessed(id: string): Promise<boolean> {
        try {
            const exists = await redis.exists(this.prefix + id)

            return exists === 1
        } catch (error) {
            logger.error(`Error checking processed status for ${ id }`, { error })

            // Fallback: assume not processed to ensure we don't miss important updates,
            // OR assume processed to avoid spam if Redis is down.
            // Assuming false (fail-open) but logging error.
            return false
        }
    }

    async addProcessed(id: string): Promise<void> {
        try {
            await redis.set(this.prefix + id, '1', 'EX', this.ttlSeconds)
        } catch (error) {
            logger.error(`Error adding processed status for ${ id }`, { error })
        }
    }
}
