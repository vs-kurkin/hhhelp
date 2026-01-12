import type { Logger as ViteLogger, LogType } from 'vite'

import { makeLogger } from '#makeLogger'


type LogMessage = string | Record<string, unknown>

/**
 * Creates a logger adapter that bridges Vite's logger output to the project's Winston logger.
 *
 * @param serviceName - The name of the service to appear in the logs (e.g., 'view', 'api').
 * @returns A Vite-compatible logger instance.
 */
export const makeViteLogger = (serviceName: string): ViteLogger => {
    const logger = makeLogger(serviceName)

    const handleLog = (type: LogType, message: LogMessage): void => {
        const handler = logger[type]

        if (!handler) return

        if (typeof message === 'string') {
            handler(message)
        } else {
            handler({
                ...message,
                message: message.message,
            })
        }
    }

    const wrapHandle = (type: LogType) => (message: LogMessage) => handleLog(type, message)

    return {
        info: wrapHandle('info'),
        warn: wrapHandle('warn'),
        error: wrapHandle('error'),
        warnOnce: wrapHandle('warn'),
        hasWarned: false,
        clearScreen: () => {},
        hasErrorLogged(): boolean {
            return false
        },
    }
}
