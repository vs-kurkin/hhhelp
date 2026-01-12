import winston, { createLogger, format, transports } from 'winston'

// Read log level and environment directly from process.env to break circular dependency
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'
const NODE_ENV = process.env.NODE_ENV || 'production'
const LOG_FORMAT = process.env.LOG_FORMAT // New: Allow overriding log format

// Safe stringify helper to handle circular references
const safeStringify = (object: unknown): string => {
    const cache = new Set()

    return JSON.stringify(
        object,
        (_key, value) => {
            if (typeof value === 'object' && value !== null) {
                if (cache.has(value)) {
                    return '[Circular]'
                }

                cache.add(value)
            }

            return value
        },
        2,
    )
}

// Define the base format for JSON logs
const jsonFormat = format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
)

// Define the format for development (human-readable)
const developmentFormat = format.combine(
    format.colorize({ all: true }),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.splat(), // Important for printf-style logging
    format.metadata({
        fillExcept: [
            'level', 'message', 'timestamp', 'service', 'stack',
        ],
    }), // Consolidate metadata
    format.printf(info => {
        const {
            level, message, timestamp, service, stack, metadata,
        } = info
        const serviceName = service ? `[${ service }] ` : ''

        let log = `${ timestamp } ${ level }: ${ serviceName }${ message }`

        if (stack) {
            log += `\n${ stack }`
        }

        // Check if metadata object is not empty
        if (metadata && Object.keys(metadata).length > 0) {
            log += ` ${ safeStringify(metadata) }`
        }

        return log
    }),
)

// Select the format based on environment variables
const selectedFormat = () => {
    if (LOG_FORMAT === 'json') {
        return jsonFormat
    }

    return NODE_ENV === 'development' ? developmentFormat : jsonFormat
}

export const logger = createLogger({
    level: LOG_LEVEL,
    format: selectedFormat(), // Apply format at the top level
    transports: [ new transports.Console() ],
})

/**
 * Creates a child logger with a 'service' field.
 * This is the recommended way to log from a specific service/module.
 *
 * @param serviceName - The name of the service or module.
 * @returns A logger instance with the service name attached.
 */
export const makeLogger = (serviceName: string): winston.Logger => logger.child({ service: serviceName })
