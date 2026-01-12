import { MyContext } from '../types.js'
import { MetricsService } from '#services/monitor/MetricsService'
import { LogBufferTransport } from '#services/monitor/LogBufferTransport'
import { TelegramTemplates } from '#templates/TelegramTemplates'
import { config } from '#config'
import { InlineKeyboard } from 'grammy'
import { makeLogger } from '@vk/logger'

const logger = makeLogger('system-handlers')

export class SystemHandlers {
    constructor(
        private metrics?: MetricsService,
        private logs?: LogBufferTransport
    ) {}

    async handleStart(context: MyContext) {
        const keyboard = new InlineKeyboard().webApp('📱 Открыть Mini App', config.SERVICE_PUBLIC_URL)

        await context.reply(TelegramTemplates.welcome, {
            reply_markup: keyboard, parse_mode: 'HTML',
        })
    }

    async handleHelp(context: MyContext) {
        await context.reply(TelegramTemplates.helpMessage, { parse_mode: 'HTML' })
    }

    async handleStats(context: MyContext) {
        if (!this.metrics) return context.reply('Metrics service not initialized')

        try {
            const authMetric = await this.metrics.authFailures.get()
            const authFailures = authMetric.values.reduce((accumulator, v) => accumulator + v.value, 0)

            const vacanciesMetric = await this.metrics.vacanciesProcessed.get()
            const vacanciesProcessed = vacanciesMetric.values.reduce((accumulator, v) => accumulator + v.value, 0)

            const tgErrorsMetric = await this.metrics.telegramApiErrors.get()
            const hhErrorsMetric = await this.metrics.hhApiErrors.get()

            const errors = tgErrorsMetric.values.reduce((accumulator, v) => accumulator + v.value, 0) +
                hhErrorsMetric.values.reduce((accumulator, v) => accumulator + v.value, 0)

            // Memory Usage
            const memory = process.memoryUsage()
            const heapUsed = (memory.heapUsed / 1024 / 1024).toFixed(2)

            const message = TelegramTemplates.stats(vacanciesProcessed, authFailures, errors, heapUsed, Math.floor(process.uptime()))

            await context.reply(message, { parse_mode: 'HTML' })
        } catch (error) {
            logger.error('Failed to get stats', { error })
            await context.reply('Failed to retrieve statistics.')
        }
    }

    async handleLogs(context: MyContext) {
        if (!this.logs) return context.reply('Logs service not initialized')

        const logs = this.logs.getLogs().slice(0, 15) // Last 15 logs

        if (logs.length === 0) return context.reply(TelegramTemplates.noLogs)

        const logLines = logs.map(l => {
            let time = '??:??:??'

            if (typeof l.timestamp === 'string') {
                // Try to parse ISO string
                const parts = l.timestamp.split('T')

                time = parts.length > 1 ? parts[1].split('.')[0] : l.timestamp
            }

            let icon = '⚪'

            if (l.level.includes('error')) {
                icon = '🔴'
            } else if (l.level.includes('warn')) {
                icon = '🟠'
            }

            const rawMessage = typeof l.message === 'string' ? l.message : JSON.stringify(l.message)

            // eslint-disable-next-line no-control-regex, sonarjs/no-control-regex
            const ansiRegex = /\u001B\[[0-9;]*m/g

            // Strip ANSI codes and Escape HTML
            const safeMessage = rawMessage
                .replaceAll(ansiRegex, '')
                .replaceAll('&', '&amp;')
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;')

            return `${ icon } <code>${ time }</code>: ${ safeMessage }`
        }).join('\n')

        await context.reply(TelegramTemplates.logsHeader + logLines, { parse_mode: 'HTML' })
    }
}
