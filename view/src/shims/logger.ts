// Shim for @vk-public/logger in browser environment
export const logger = {
    // eslint-disable-next-line no-console
    info: (message: string, ...meta: unknown[]): void => console.info(message, ...meta),
    // eslint-disable-next-line no-console
    warn: (message: string, ...meta: unknown[]): void => console.warn(message, ...meta),
    // eslint-disable-next-line no-console
    error: (message: string, ...meta: unknown[]): void => console.error(message, ...meta),
    // eslint-disable-next-line no-console
    debug: (message: string, ...meta: unknown[]): void => console.debug(message, ...meta),
}

export const makeLogger = (serviceName: string) => {
    return {
        // eslint-disable-next-line no-console
        info: (message: string, ...meta: unknown[]): void => console.info(`[${serviceName}] ${message}`, ...meta),
        // eslint-disable-next-line no-console
        warn: (message: string, ...meta: unknown[]): void => console.warn(`[${serviceName}] ${message}`, ...meta),
        // eslint-disable-next-line no-console
        error: (message: string, ...meta: unknown[]): void => console.error(`[${serviceName}] ${message}`, ...meta),
        // eslint-disable-next-line no-console
        debug: (message: string, ...meta: unknown[]): void => console.debug(`[${serviceName}] ${message}`, ...meta),
    }
}