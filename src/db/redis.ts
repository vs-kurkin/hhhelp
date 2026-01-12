import { makeLogger } from '@vk-public/logger'
import Redis from 'ioredis'

import { config } from '#config'

const logger = makeLogger('redis')

// @ts-expect-error - ioredis types issue with config
export const redis = new Redis(config.REDIS_URI, {
    maxRetriesPerRequest: null,
    retryStrategy(times: number) {
        const delay = Math.min(times * 50, 2000)

        return delay
    },
})

redis.on('connect', () => logger.info('Connected to Redis'))
redis.on('error', (error: Error) => logger.error('Redis error', { error }))
