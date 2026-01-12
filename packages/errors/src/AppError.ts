import { ErrorCode } from '#codes'

export class AppError extends Error {
    public readonly code: ErrorCode
    public readonly metadata?: Record<string, unknown>

    constructor(code: ErrorCode, message: string, metadata?: Record<string, unknown>) {
        super(message)
        this.name = 'AppError'
        this.code = code
        this.metadata = metadata

        // Restore prototype chain for instance checks
        Object.setPrototypeOf(this, new.target.prototype)
    }

    public toJSON(): Record<string, unknown> {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            metadata: this.metadata,
            stack: this.stack,
        }
    }
}
