import { MyContext } from '../types.js'
import { config } from '#config'
import { makeLogger } from '@vk/logger'

const logger = makeLogger('bot-error-handler')

export class BotErrorHandler {
    static async handleError(context: MyContext, error: unknown, message: string) {
        logger.error(message, {
            error,
            userId: context.from?.id
        })

        let replyText = `⚠️ ${ message }`

        // Show details for Admin
        const isAdmin = String(context.from?.id) === config.TELEGRAM_CHAT_ID_HH

        if (isAdmin) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            replyText += `\n\n🔍 Error: ${ errorMessage }`
        }

        try {
            if (context.chat) {
                await context.reply(replyText)
            }
        } catch (replyError) {
            logger.error('Failed to send error message to user', { error: replyError })
        }
    }
}
