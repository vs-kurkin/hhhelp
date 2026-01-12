/* eslint-disable @typescript-eslint/naming-convention */
export enum ErrorCode {
    // General errors
    UNKNOWN_ERROR = 'UNKNOWN_ERROR',
    VALIDATION_ERROR = 'VALIDATION_ERROR',

    // Network errors
    NETWORK_ERROR = 'NETWORK_ERROR',
    CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',

    // Service errors
    SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
    SERVICE_NOT_FOUND = 'SERVICE_NOT_FOUND',

    // Database errors
    DATABASE_ERROR = 'DATABASE_ERROR',
    RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',

    // Authentication errors
    AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
    PERMISSION_DENIED = 'PERMISSION_DENIED',
}
