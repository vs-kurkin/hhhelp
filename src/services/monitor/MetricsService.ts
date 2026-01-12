import client from 'prom-client'

export class MetricsService {
    public readonly register: client.Registry

    public readonly authFailures: client.Counter
    public readonly vacanciesProcessed: client.Counter
    public readonly httpRequestDuration: client.Histogram
    public readonly telegramApiErrors: client.Counter
    public readonly hhApiErrors: client.Counter
    public readonly activeAnalysisRequests: client.Gauge

    constructor() {
        this.register = new client.Registry()
        // Default metrics (CPU, Memory, Event Loop)
        client.collectDefaultMetrics({
            register: this.register, prefix: 'hh_monitor_',
        })

        this.authFailures = new client.Counter({
            name: 'hh_monitor_auth_failures_total',
            help: 'Total number of authentication failures',
            labelNames: [
                'ip', 'reason',
            ],
            registers: [ this.register ],
        })

        this.vacanciesProcessed = new client.Counter({
            name: 'hh_monitor_vacancies_processed_total',
            help: 'Total number of vacancies processed',
            labelNames: [ 'status' ], // e.g. 'filtered', 'sent', 'error'
            registers: [ this.register ],
        })

        this.httpRequestDuration = new client.Histogram({

            name: 'hh_monitor_http_request_duration_seconds',

            help: 'Duration of HTTP requests in seconds',

            labelNames: [
                'method', 'route', 'statusCode',
            ],

            buckets: [
                0.1, 0.5, 1, 2, 5,
            ],

            registers: [ this.register ],

        })

        this.telegramApiErrors = new client.Counter({
            name: 'hh_monitor_telegram_api_errors_total',
            help: 'Total number of Telegram API errors',
            registers: [ this.register ],
        })

        this.hhApiErrors = new client.Counter({
            name: 'hh_monitor_hh_api_errors_total',
            help: 'Total number of HH.ru API errors',
            registers: [ this.register ],
        })

        this.activeAnalysisRequests = new client.Gauge({
            name: 'hh_monitor_active_analysis_requests',
            help: 'Number of active AI analysis requests',
            registers: [ this.register ],
        })
    }

    public async getMetrics(): Promise<string> {
        return this.register.metrics()
    }
}
