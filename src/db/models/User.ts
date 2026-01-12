import mongoose, { Document, Schema } from 'mongoose'

export interface User extends Document {
    telegramId: number;
    username?: string;
    firstName?: string;
    lastName?: string;
    resumeText?: string;
    analysisReports?: { date: Date; content: string }[];
    role: 'admin' | 'user';
    hhAuth?: {
        accessToken: string;
        refreshToken: string;
        expiresAt: number;
        hhUserId?: string;
        email?: string;
    };
    hhResumes?: unknown[]; // Store raw resume data from HH
    favorites?: string[]; // Array of vacancy IDs (hhId)
    hiddenVacancies?: string[]; // Array of hidden vacancy IDs
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<User>({
    telegramId: {
        type: Number, required: true, unique: true, index: true,
    },
    username: String,
    firstName: String,
    lastName: String,
    resumeText: String,
    analysisReports: [
        {
            date: {
                type: Date, default: Date.now,
            },
            content: String,
        },
    ],
    role: {
        type: String, enum: [
            'admin', 'user',
        ], default: 'user',
    },
    hhAuth: {
        accessToken: String,
        refreshToken: String,
        expiresAt: Number,
        hhUserId: String,
        email: String,
    },
    hhResumes: [ Schema.Types.Mixed ],
    favorites: { type: [ String ], default: [] },
    hiddenVacancies: { type: [ String ], default: [] },
}, { timestamps: true })

export const UserModel = mongoose.model<User>('User', UserSchema)
