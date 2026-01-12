import { HhVacancy } from '#services/HhService'

export const TelegramTemplates = {
    welcome: '👋 <b>Добро пожаловать!</b>\nНажмите кнопку ниже, чтобы открыть список вакансий.',

    helpMessage: `
🤖 <b>HH Help Bot</b>

Команды:
/start - Перезапустить бота
/list - Показать список вакансий (категории)
/stats - Статистика работы
/logs - Последние логи
/help - Показать это сообщение

Отправьте PDF или TXT файл с резюме для анализа.
`,

    statusMessage: (total: number): string =>
        `🔎 <b>Найдены новые вакансии: ${ total }</b>\n\nВыберите категорию для просмотра:`,

    emptyList: '⚠️ Список вакансий пуст или устарел (бот был перезапущен).',

    vacancyMessage: (
        vacancy: HhVacancy,
        salary: string,
        responsibility: string,
        requirement: string,
        analysisText: string,
    ): string => `
<b>${ vacancy.name }</b>

🏢 <b>${ vacancy.employer.name }</b>
💰 ${ salary }

<blockquote expandable>
📝 <i>${ responsibility }</i>

📋 <i>${ requirement }</i>
${ analysisText }
</blockquote>

<a href="${ vacancy.alternate_url }">Посмотреть вакансию</a>
`,

    applyRequest: (vacancyName: string, employerName: string): string =>
        `📄 <b>Отклик на вакансию: ${ vacancyName }</b>\n🏢 ${ employerName }\n\nПожалуйста, отправьте ваш файл резюме (PDF).`,

    resumeLoadAndAnalyze: '⏳ Загружаю и анализирую ваше резюме…',
    resumeAnalyzeText: '🤖 Gemini анализирует текст резюме…',

    errorFileFormat: '⚠️ Пожалуйста, загрузите резюме в формате PDF или TXT.',
    errorExtractText: '❌ Не удалось получить путь к файлу или извлечь текст.',
    errorAiConfig: '⚠️ AI не настроен или не вернул результат. Проверьте GEMINI_API_KEY.',

    analysisSuccess: (analysis: string): string =>
        `📊 <b>Анализ Gemini:</b>\n\n${ analysis }`,

    analysisComplete: '✅ Анализ завершен.\nВы можете сгенерировать сопроводительное письмо.',

    generatingCover: '⏳ Генерирую письмо с помощью Gemini AI…',

    confirmation: (coverLetter: string): string =>
        `📝 <b>Проверьте данные:</b>\n\n<b>Резюме:</b> (файл загружен, текст извлечен)\n\n<b>Сопроводительное письмо:</b>\n<pre>${ coverLetter }</pre>`,

    appSent: '🎉 <b>Отклик успешно отправлен!</b>\n\nРаботодатель скоро свяжется с вами.',
    appCancelled: '❌ Отклик отменен.',

    stats: (
        vacanciesProcessed: number,
        authFailures: number,
        errors: number,
        heapUsed: string,
        uptime: number,
    ): string => `
📊 <b>System Stats</b>

🔹 <b>Vacancies Processed:</b> ${ vacanciesProcessed }
🔹 <b>Auth Failures:</b> ${ authFailures }
🔹 <b>API Errors:</b> ${ errors }
🔹 <b>Heap Used:</b> ${ heapUsed } MB
🔹 <b>Uptime:</b> ${ uptime } s
`,

    logsHeader: '📋 <b>Recent Logs:</b>\n\n',
    noLogs: 'No logs available.',

    alertAuth: (failures: number): string =>
        `🚨 <b>High Auth Failures Detected!</b>\n${ failures } failures since last check.`,

    alertError: (count: number): string =>
        `⚠️ <b>High Error Rate</b>\nFound ${ count } errors in the last interval.`,
}
