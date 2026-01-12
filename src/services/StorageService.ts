import { makeLogger } from '@vk-public/logger'

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

    async filterNewVacancies(ids: string[]): Promise<string[]> {
        if (ids.length === 0) return []

        try {
            const pipeline = redis.pipeline()

            for (const id of ids) {
                pipeline.exists(this.prefix + id)
            }

            const results = await pipeline.exec()

            if (!results) {
                throw new Error('Redis pipeline returned null')
            }

            // results is [ [err, count], [err, count], ... ]
            // exists returns 1 if key exists, 0 otherwise
            return ids.filter((_, index) => {
                const [ error, result ] = results[index]

                if (error) {
                    logger.error('Error in redis pipeline', { error })

                    return false // Treat error as processed to avoid spam? Or new? Let's treat as processed to be safe.
                }

                return result === 0
            })
        } catch (error) {
            logger.error('Error filtering new vacancies', { error })

            // If Redis fails, we might return empty to avoid spamming everything
            return []
        }
    }

    async markAsProcessed(ids: string[]): Promise<void> {
        if (ids.length === 0) return

        try {
            const pipeline = redis.pipeline()

            for (const id of ids) {
                pipeline.set(this.prefix + id, '1', 'EX', this.ttlSeconds)
            }

            await pipeline.exec()
        } catch (error) {
            logger.error('Error batch marking vacancies as processed', { error })
        }
    }
}
