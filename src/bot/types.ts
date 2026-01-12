import { Context, SessionFlavor } from 'grammy'

export interface SessionData {
    step: 'idle' | 'waiting_resume' | 'waiting_cover' | 'confirm';
    vacancyId?: string;
    vacancyName?: string;
    employerName?: string;
    resumeFileId?: string;
    resumeText?: string;
    coverLetter?: string;
}

export type MyContext = Context & SessionFlavor<SessionData>;

export interface ApiError {
    description?: string;
    error_code?: number;
}
