import mongoose, { Document, Schema } from 'mongoose'

export interface Vacancy extends Document {
    hhId: string;
    name: string;
    employer: string;
    salary?: {
        from?: number;
        to?: number;
        currency?: string;
    };
    alternateUrl: string;
    stack: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    raw: any;
    createdAt: Date;
    updatedAt: Date;
}

const VacancySchema = new Schema<Vacancy>({
    hhId: {
        type: String, required: true, unique: true, index: true,
    },
    name: {
        type: String, required: true,
    },
    employer: {
        type: String, required: true,
    },
    salary: {
        from: Number,
        to: Number,
        currency: String,
    },
    alternateUrl: {
        type: String, required: true,
    },
    stack: {
        type: String, default: 'Other', index: true,
    }, // 'Frontend', 'Backend' etc.
    raw: { type: Schema.Types.Mixed }, // Full JSON from HH API
}, { timestamps: true })

export const VacancyModel = mongoose.model<Vacancy>('Vacancy', VacancySchema)
