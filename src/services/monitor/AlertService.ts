import { LogBufferTransport } from './LogBufferTransport.js'
import { MetricsService } from './MetricsService.js'

import { TelegramTemplates } from '#templates/TelegramTemplates'

export class AlertService {
    private lastCheck = Date.now()
    private lastAuthFailures = 0

    constructor(
        private metrics: MetricsService,
        private logs: LogBufferTransport,
        private notifyCallback: (message: string) => Promise<void>,
    ) {}

    public async check(): Promise<void> {
        const now = Date.now()

        // 1. Check Auth Failures
        try {
            const metric = await this.metrics.authFailures.get()
            const currentAuthFailures = metric.values.reduce((accumulator, value) => accumulator + value.value, 0)
            const newFailures = currentAuthFailures - this.lastAuthFailures

            if (newFailures > 10) {
                await this.notifyCallback(TelegramTemplates.alertAuth(newFailures))
            }

            this.lastAuthFailures = currentAuthFailures
        } catch {
            // Ignore metric errors to avoid loops
        }

        // 2. Check Critical Logs (Error level)
        // Only notify if we have > 5 errors in last minute to avoid spam
        const recentErrors = this.logs.getLogs().filter(l =>
            l.level === 'error' &&
            new Date(l.timestamp).getTime() > this.lastCheck,
        )

        if (recentErrors.length >= 5) {
            await this.notifyCallback(TelegramTemplates.alertError(recentErrors.length))
        }

        this.lastCheck = now
    }
}
