import { loadConfig } from '#loader'
import { configSchema } from '#schema'

export const config = loadConfig(configSchema)

export { type AppConfig } from '#schema'
