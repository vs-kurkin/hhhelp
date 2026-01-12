import { MyContext } from '../types.js'
import { StateManager } from '../StateManager.js'
import { StatusMessageHelper } from '../utils/StatusMessageHelper.js'
import { VacancyClassifier } from '#services/VacancyClassifier'
import { AnalysisService } from '#services/AnalysisService'
import { TelegramTemplates } from '#templates/TelegramTemplates'
import { InlineKeyboard } from 'grammy'
import { makeLogger } from '@vk-public/logger'
import { HhVacancy } from '#services/HhService'
import { config } from '#config'

const logger = makeLogger('vacancy-handlers')

export class VacancyHandlers {
    constructor(
        private state: StateManager,
        private statusHelper: StatusMessageHelper,
        private classifier: VacancyClassifier,
        private analyzer: AnalysisService
    ) {}

    async handleList(context: MyContext) {
        if (this.state.statusMessageId) {
            try {
                await context.api.deleteMessage(config.TELEGRAM_CHAT_ID_HH, this.state.statusMessageId)
            } catch {
                // ignore
            }

            this.state.statusMessageId = undefined
        }

        if (this.state.unreadVacancies.length === 0) {
            const sent = await context.reply('Нет новых вакансий для отображения.')

            this.state.statusMessageId = sent.message_id

            return
        }

        await this.statusHelper.updateStatusMessage()
    }

    async handleShowStack(context: MyContext) {
        const stack = context.match?.[1]

        logger.info(`Received callback for stack: ${ stack }`)

        if (!stack) {
            logger.warn('Stack is undefined in callback')

            return
        }

        let vacanciesToShow: HhVacancy[] = []

        if (stack === 'All') {
            vacanciesToShow = [ ...this.state.unreadVacancies ]
            this.state.clearVacancies()
        } else {
            vacanciesToShow = this.state.getVacancies(v => this.classifier.classify(v) === stack)
            this.state.filterVacancies(v => this.classifier.classify(v) !== stack)
        }

        if (vacanciesToShow.length === 0) {
            await context.answerCallbackQuery({
                text: TelegramTemplates.emptyList, show_alert: true,
            })

            return
        }

        // Send vacancies
        for (const vacancy of vacanciesToShow) {
            try {
                const message = this.formatVacancyMessage(vacancy)
                const keyboard = new InlineKeyboard()
                    .text('📨 Откликнуться', `apply_${ vacancy.id }`)
                    .url('🔗 На сайте HH', vacancy.alternate_url)

                await context.reply(message, {

                    parse_mode: 'HTML',

                    link_preview_options: { is_disabled: true },

                    reply_markup: keyboard,
                })
            } catch (error) {
                logger.error('Failed to send vacancy', {
                    vacancyId: vacancy.id, error
                })
            }
        }

        // Update status message
        await this.statusHelper.updateStatusMessage()

        await context.answerCallbackQuery()
    }

    async handleApply(context: MyContext) {
        const vacancyId = context.match?.[1]

        if (!vacancyId) {
            return
        }

        const textLines = context.callbackQuery?.message?.text?.split('\n') ?? []
        const vacancyName = textLines[0]?.trim() ?? 'Unknown Vacancy'
        const employerLine = textLines.find(l => l.includes('🏢'))
        const employerName = employerLine?.replace('🏢', '').trim() ?? 'Company'

        context.session.step = 'waiting_resume'
        context.session.vacancyId = vacancyId
        context.session.vacancyName = vacancyName
        context.session.employerName = employerName


        await context.reply(TelegramTemplates.applyRequest(vacancyName, employerName), { parse_mode: 'HTML' })
        await context.answerCallbackQuery()
    }

    private formatVacancyMessage(vacancy: HhVacancy): string {
        const salary = vacancy.salary ? `${ vacancy.salary.from ?? '?' } - ${ vacancy.salary.to ?? '?' } ${ vacancy.salary.currency }` : 'Зарплата не указана'
        const responsibility = this.cleanText(vacancy.snippet.responsibility ?? '')
        const requirement = this.cleanText(vacancy.snippet.requirement ?? '')
        const analysis = this.analyzer.analyze(vacancy)
        const analysisText = analysis.reasons.length > 0 ? `\n📊 <b>Почему подходит:</b>\n${ analysis.reasons.join('\n') }` : ''

        return TelegramTemplates.vacancyMessage(vacancy, salary, responsibility, requirement, analysisText)
    }

    private cleanText(text: string): string {
        return text.replaceAll('<highlighttext>', '').replaceAll('</highlighttext>', '')
    }
}
