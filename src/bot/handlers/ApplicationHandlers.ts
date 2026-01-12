import { MyContext } from '../types.js'
import { GeminiService } from '#services/GeminiService'
import { DocumentService } from '#services/DocumentService'
import { TelegramTemplates } from '#templates/TelegramTemplates'
import { BotErrorHandler } from '../utils/ErrorHandler.js'
import { UserModel } from '#db'
import { InlineKeyboard } from 'grammy'
import { makeLogger } from '@vk-public/logger'

const logger = makeLogger('application-handlers')

export class ApplicationHandlers {
    constructor(
        private gemini: GeminiService,
        private docService: DocumentService
    ) {}

    async handleResume(context: MyContext) {
        if (!context.msg?.document || !context.chat) {
            return
        }

        const document = context.msg.document
        const isPdf = document.mime_type === 'application/pdf'
        const isTxt = document.mime_type === 'text/plain' || document.file_name?.endsWith('.txt')

        if (!isPdf && !isTxt) {
            await context.reply(TelegramTemplates.errorFileFormat)

            return
        }

        // Global Resume Analysis
        if (context.session.step === 'idle') {
            await this.handleGlobalResumeAnalysis(context, document, isPdf)

            return
        }

        if (context.session.step !== 'waiting_resume') {
            return
        }

        context.session.resumeFileId = document.file_id
        const statusMessage = await context.reply(TelegramTemplates.resumeLoadAndAnalyze)

        try {
            const file = await context.api.getFile(document.file_id)
            const extractedText = await this.docService.extractText(file.file_path || '', isPdf)

            if (!extractedText) {
                await context.api.editMessageText(context.chat.id, statusMessage.message_id, TelegramTemplates.errorExtractText)

                return
            }

            context.session.resumeText = extractedText

            await context.api.editMessageText(context.chat.id, statusMessage.message_id, '🤖 Gemini анализирует совместимость...')
            const analysis = await this.gemini.analyzeMatch(`${ context.session.vacancyName } at ${ context.session.employerName }`, context.session.resumeText)

            if (!analysis) {
                await context.api.editMessageText(context.chat.id, statusMessage.message_id, TelegramTemplates.errorAiConfig)

                return
            }

            context.session.step = 'waiting_cover'
            const keyboard = new InlineKeyboard().text('✍️ Сгенерировать сопроводительное', 'generate_cover')


            await context.api.editMessageText(context.chat.id, statusMessage.message_id, TelegramTemplates.analysisSuccess(analysis), { parse_mode: 'HTML' })

            await context.reply(TelegramTemplates.analysisComplete, { reply_markup: keyboard })
        } catch (error) {
            await BotErrorHandler.handleError(context, error, 'Ошибка при обработке резюме')

            try {
                await context.api.editMessageText(context.chat.id, statusMessage.message_id, `❌ Ошибка при обработке резюме. `)
            } catch { /* ignore */ }
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async handleGlobalResumeAnalysis(context: MyContext, document: any, isPdf: boolean) {
        if (!context.chat) return

        const statusMessage = await context.reply('⏳ Загружаю и анализирую ваше резюме (глобальный режим)...')

        try {
            const file = await context.api.getFile(document.file_id)
            const text = await this.docService.extractText(file.file_path || '', isPdf)

            if (!text) {
                await context.api.editMessageText(context.chat.id, statusMessage.message_id, '❌ Не удалось извлечь текст из файла.')

                return
            }

            // Save resume to User Profile
            if (context.from) {
                await UserModel.updateOne(
                    { telegramId: context.from.id },
                    { resumeText: text },
                )
            }

            await context.api.editMessageText(context.chat.id, statusMessage.message_id, '🤖 Gemini анализирует ваше резюме...')

            const analysis = await this.gemini.analyzeResume(text)

            // Save analysis report
            if (context.from && analysis) {
                await UserModel.updateOne(
                    { telegramId: context.from.id },
                    {
                        $push: {
                            analysisReports: {
                                date: new Date(),
                                content: analysis,
                            },
                        },
                    },
                )
            }

            await context.api.editMessageText(context.chat.id, statusMessage.message_id, `📊 *Анализ Резюме:*

${ analysis }`, { parse_mode: 'Markdown' })
        } catch (error) {
            await BotErrorHandler.handleError(context, error, 'Ошибка анализа резюме')

            try {
                 await context.api.editMessageText(context.chat.id, statusMessage.message_id, `❌ Ошибка анализа. `)
            } catch { /* ignore */ }
        }
    }

    async handleGenerateCover(context: MyContext) {
        if (context.session.step !== 'waiting_cover') {
            return
        }

        await context.reply(TelegramTemplates.generatingCover)
        const resumeSource = context.session.resumeText ?? ''

        context.session.coverLetter = await this.gemini.generateCoverLetter(context.session.vacancyName ?? 'Vacancy', context.session.employerName ?? 'Company', resumeSource)
        context.session.step = 'confirm'
        await this.sendConfirmation(context)
        await context.answerCallbackQuery()
    }

    async handleTextMessage(context: MyContext) {
        if (context.session.step === 'waiting_resume') {
            await this.handleTextResume(context)
        } else if (context.session.step === 'waiting_cover') {
            await this.handleManualCover(context)
        }
    }

    async handleTextResume(context: MyContext) {
        if (!context.msg?.text || !context.chat) return

        const text = context.msg.text

        context.session.resumeText = text.slice(0, 20_000)
        context.session.resumeFileId = undefined

        const statusMessage = await context.reply(TelegramTemplates.resumeAnalyzeText)

        try {
            const analysis = await this.gemini.analyzeMatch(`${ context.session.vacancyName } at ${ context.session.employerName }`, context.session.resumeText)

            if (!analysis) {
                await context.api.editMessageText(context.chat.id, statusMessage.message_id, TelegramTemplates.errorAiConfig)

                return
            }

            context.session.step = 'waiting_cover'
            const keyboard = new InlineKeyboard().text('✍️ Сгенерировать сопроводительное', 'generate_cover')


            await context.api.editMessageText(context.chat.id, statusMessage.message_id, TelegramTemplates.analysisSuccess(analysis), { parse_mode: 'HTML' })

            await context.reply(TelegramTemplates.analysisComplete, { reply_markup: keyboard })
        } catch (error) {
            await BotErrorHandler.handleError(context, error, 'Ошибка обработки текста резюме')

            try {
                await context.api.editMessageText(context.chat.id, statusMessage.message_id, `❌ Ошибка обработки текста. `)
            } catch { /* ignore */ }
        }
    }

    async handleManualCover(context: MyContext) {
        if (context.session.step !== 'waiting_cover') {
            return
        }

        if (!context.msg?.text) {
            return
        }

        context.session.coverLetter = context.msg.text
        context.session.step = 'confirm'
        await this.sendConfirmation(context)
    }

    async handleSendApp(context: MyContext) {
        if (context.session.step !== 'confirm') {
            return
        }

        logger.info(`Sending application for vacancy ${ context.session.vacancyId }`, {
            resume: context.session.resumeFileId,
            cover: context.session.coverLetter,
        })

        await context.editMessageText(TelegramTemplates.appSent, { parse_mode: 'HTML' })
        context.session.step = 'idle'
        await context.answerCallbackQuery()
    }

    async handleCancelApp(context: MyContext) {
        await context.editMessageText(TelegramTemplates.appCancelled)
        context.session.step = 'idle'
        await context.answerCallbackQuery()
    }

    private async sendConfirmation(context: MyContext) {
        const keyboard = new InlineKeyboard().text('🚀 Отправить', 'send_app').text('❌ Отмена', 'cancel_app')
        const safeCover = (context.session.coverLetter ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

        await context.reply(TelegramTemplates.confirmation(safeCover), {

            parse_mode: 'HTML',

            reply_markup: keyboard,
        })
    }
}
