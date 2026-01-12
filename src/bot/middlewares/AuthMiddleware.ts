import { config } from '#config'
import { UserModel } from '#db'
import { makeLogger } from '@vk-public/logger'
import { MyContext } from '../types.js'
import { NextFunction } from 'grammy'

const logger = makeLogger('auth-middleware')

export async function authMiddleware(context: MyContext, next: NextFunction) {
    if (!context.from) return next()

    // Allow if ID matches config
    if (String(context.from.id) === config.TELEGRAM_CHAT_ID_HH) return next()

    try {
        const user = await UserModel.findOne({ telegramId: context.from.id })

        if (user && user.role === 'admin') return next()
    } catch (error) {
        logger.error('Database error in auth middleware', { error })
        // Use a safe reply if possible, or just return
        try {
             if (context.chat) await context.reply('⚠️ Сервис временно недоступен (ошибка базы данных).')
        } catch { /* ignore */ }
        return
    }

    if (context.chat?.type === 'private') {
        await context.reply('⛔ Доступ запрещен.')
    }
}
