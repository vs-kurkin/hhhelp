import { type Logger } from '@vk/logger'

import { ErrorCode } from '#codes'


export class ErrorHandler {
    private readonly logger: Logger

    constructor(logger: Logger) {
        this.logger = logger
    }

    public handleError(error: Error, message?: string, code?: ErrorCode): void {
        this.logger.error(message || 'An error occurred', {
            errorMessage: error?.message,
            stack: error?.stack,
            code: code || ErrorCode.UNKNOWN_ERROR,
        })
    }
}
