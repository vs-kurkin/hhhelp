export class HhApiError extends Error {
    constructor(message: string, public readonly cause?: unknown) {
        super(message)
        this.name = 'HhApiError'
    }
}

export class HhValidationError extends Error {
    constructor(message: string, public readonly validationErrors: unknown) {
        super(message)
        this.name = 'HhValidationError'
    }
}
