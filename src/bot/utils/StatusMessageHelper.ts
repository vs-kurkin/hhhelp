import { Api, RawApi, InlineKeyboard } from 'grammy'
import { config } from '#config'
import { TelegramTemplates } from '#templates/TelegramTemplates'
import { StateManager } from '../StateManager.js'
import { VacancyClassifier } from '#services/VacancyClassifier'
import { makeLogger } from '@vk-public/logger'

const logger = makeLogger('status-helper')

export class StatusMessageHelper {
    constructor(
        private api: Api<RawApi>,
        private state: StateManager,
        private classifier: VacancyClassifier
    ) {}

    async updateStatusMessage() {
        const unreadVacancies = this.state.getVacancies()

        if (unreadVacancies.length === 0) {
            if (this.state.statusMessageId) {
                 try {
                    await this.api.deleteMessage(config.TELEGRAM_CHAT_ID_HH, this.state.statusMessageId)
                    this.state.statusMessageId = undefined
                } catch {
                    // ignore
                }
            }
            return
        }

        const counts = this.countByStack()
        const total = unreadVacancies.length

        const messageText = TelegramTemplates.statusMessage(total)

        const keyboard = new InlineKeyboard()

        // Add Mini App Button
        keyboard.webApp('📱 Вакансии', config.SERVICE_PUBLIC_URL)
        keyboard.row()

        let row = []

        for (const [
            stack,
            count
        ] of Object.entries(counts)) {
            if (count > 0) {
                row.push(InlineKeyboard.text(`${ stack } (${ count })`, `show_stack_${ stack }`))

                if (row.length === 2) {
                    keyboard.row(...row)
                    row = []
                }
            }
        }

        if (row.length > 0) keyboard.row(...row)

        keyboard.row(InlineKeyboard.text(`Показать все (${ total })`, 'show_stack_All'))

        try {
            if (this.state.statusMessageId) {
                await this.api.editMessageText(config.TELEGRAM_CHAT_ID_HH, this.state.statusMessageId, messageText, {

                    parse_mode: 'HTML',

                    reply_markup: keyboard,
                })
            } else {
                const sent = await this.api.sendMessage(config.TELEGRAM_CHAT_ID_HH, messageText, {

                    parse_mode: 'HTML',

                    reply_markup: keyboard,
                })

                this.state.statusMessageId = sent.message_id
            }
        } catch (error: any) {
            // If message not found (deleted manually), send a new one
            if (error.description?.includes('message to edit not found')) {
                this.state.statusMessageId = undefined
                await this.updateStatusMessage()
            } else {
                logger.error('Failed to update status message', { error })
            }
        }
    }

    private countByStack(): Record<string, number> {
        const counts: Record<string, number> = {}

        for (const v of this.state.getVacancies()) {
            const stack = this.classifier.classify(v)
            counts[stack] = (counts[stack] || 0) + 1
        }

        return counts
    }
}
