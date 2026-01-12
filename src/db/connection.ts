import { makeLogger } from '@vk/logger'
import mongoose from 'mongoose'

import { config } from '#config'

const logger = makeLogger('mongodb')

export async function connectToMongo(): Promise<void> {
    try {
        await mongoose.connect(config.MONGO_URI)
        logger.info('Connected to MongoDB')
    } catch (error) {
        logger.error('Failed to connect to MongoDB', { error })
        throw error
    }
}

export async function disconnectFromMongo(): Promise<void> {
    await mongoose.disconnect()
    logger.info('Disconnected from MongoDB')
}