import { z } from 'zod'

export const queueSchema = z.object({
    RABBITMQ_URL: z.url(),

    // Exchanges
    RPC_EXCHANGE: z.string().default('rpc_exchange'),
    COMMANDS_EXCHANGE: z.string().default('commands_exchange'),
    ANALYSIS_EXCHANGE: z.string().default('analysis_events'),
    EVENTS_EXCHANGE: z.string().default('events_exchange'),
    AUDIT_EVENTS_EXCHANGE: z.string().default('audit_events'),
    SCAN_EVENTS_EXCHANGE: z.string().default('scan_events'),
    IDS_ALERTS_EXCHANGE: z.string().default('ids.alerts'),

    // Queues
    SCAN_COMMANDS_QUEUE: z.string().default('scan_commands'),
    MIKROTIK_RPC_QUEUE: z.string().default('mikrotik_rpc_queue'),
    MIKROTIK_COMMANDS_QUEUE: z.string().default('mikrotik_commands_queue'),
    TELEGRAM_BOT_EVENTS_QUEUE: z.string().default('telegram_bot_events'),
    TELEGRAM_NOTIFICATIONS_QUEUE: z.string().default('telegram-notifications'),
    COMMAND_RESPONSE_QUEUE: z.string().default('command.response.queue'),

    // Routing Keys
    AI_THREAT_ROUTING_KEY: z.string().default('analysis.event.threat_detected.#'),
    SCAN_START_ROUTING_KEY: z.string().default('scan.start'),
    SCAN_PROGRESS_ROUTING_KEY: z.string().default('scan.progress'),
    SCAN_COMPLETE_ROUTING_KEY: z.string().default('scan.complete'),
    AUDIT_PERFORM_ROUTING_KEY: z.string().default('audit.perform'),
    NEW_DEVICE_ROUTING_KEY: z.string().default('new_device_detected'),
    COMMAND_RESULT_ROUTING_KEY: z.string().default('command_result'),
    SCAN_PROGRESS_UPDATE_ROUTING_KEY: z.string().default('scan_progress'),
    COMMAND_EVENT_ROUTING_KEY: z.string().default('command.event.*'),
    MIKROTIK_RPC_ROUTING_KEY: z.string().default('mikrotik.rpc.*'),
    MIKROTIK_COMMAND_ROUTING_KEY: z.string().default('mikrotik.command.*'),
    IDS_ALERT_ROUTING_KEY: z.string().default('security.ids.alert'),
})
