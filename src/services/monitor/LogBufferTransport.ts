import Transport from 'winston-transport'

export interface LogEntry {
    timestamp: string;
    level: string;
    message: string;
    service?: string;

    [key: string]: unknown;
}

export class LogBufferTransport extends Transport {
    private buffer: LogEntry[] = []
    private readonly size: number

    constructor(options: { size: number } & Transport.TransportStreamOptions) {
        super(options)
        this.size = options.size
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    log(info: any, callback: () => void): void {
        setImmediate(() => {
            this.emit('logged', info)
        })

        const entry: LogEntry = {
            timestamp: info.timestamp || new Date().toISOString(),
            level: info.level,
            message: info.message,
            service: info.service,
            ...info,
        }

        // Remove internal winston symbols if possible (optional)

        this.buffer.push(entry)

        if (this.buffer.length > this.size) {
            this.buffer.shift()
        }

        callback()
    }

    getLogs(): LogEntry[] {
        return this.buffer.toReversed() // Newest first
    }

    clear(): void {
        this.buffer = []
    }
}
