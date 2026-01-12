import { UserModel } from '#db'
import { makeLogger } from '@vk-public/logger'
import { MyContext } from '../types.js'
import { NextFunction } from 'grammy'

const logger = makeLogger('user-saver-middleware')

export async function userSaverMiddleware(context: MyContext, next: NextFunction) {
    if (context.from) {
        try {
            await UserModel.updateOne(
                { telegramId: context.from.id },
                {
                    telegramId: context.from.id,
                    username: context.from.username,
                    firstName: context.from.first_name,
                    lastName: context.from.last_name,
                },
                { upsert: true },
            )
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            if (error.code === 11_000) {
                // Ignore duplicate key error (race condition during upsert)
                return next()
            }

            logger.error('Failed to save user', { error: error instanceof Error ? error.message : error })
        }
    }

    await next()
}
