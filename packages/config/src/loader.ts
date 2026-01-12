import { makeLogger } from '@vk/logger'
import { z } from 'zod'

import { type Camelize } from '#mappers'

const logger = makeLogger('config-loader')

const toCamel = (s: string): string =>
    s.toLowerCase().replaceAll(/([-_][a-z])/g, group =>
        group
            .toUpperCase()
            .replace('-', '')
            .replace('_', ''),
    )

export const loadConfig = <T extends Record<string, unknown>>(schema: z.Schema<T>): Readonly<Camelize<T>> => {
    const parsedConfig = schema.safeParse(process.env)

    if (!parsedConfig.success) {
        logger.error('Invalid environment variables:', parsedConfig.error)

        throw parsedConfig.error
    }

    const config = {} as Camelize<T>

    for (const key in parsedConfig.data) {
        (config as Record<string, unknown>)[toCamel(key)] = parsedConfig.data[key]
    }

    return Object.freeze(config)
}
