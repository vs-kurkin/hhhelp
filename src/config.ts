import path from 'node:path'
import { makeLogger } from '@vk-public/logger'
import dotenv from 'dotenv'
import { cleanEnv, num, str } from 'envalid'

// 1. Load .env immediately
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true })

if (process.env.NODE_ENV === undefined) {
    process.env.NODE_ENV = 'development'
}

import { loadSecrets } from '#utils/vault'

// Load secrets from Vault (if configured)
await loadSecrets()

const logger = makeLogger('hhhelp-config')

// 2. Define and clean config
export const config = cleanEnv(process.env, {
    HH_SEARCH_TEXT: str({ default: '(Teamlead OR "Tech Lead" OR Architect) AND (Node.js OR Python)' }),
    HH_MIN_SALARY: num({ default: 250_000 }),
    HH_AREA: num({ default: 113 }), // Russia
    TELEGRAM_BOT_TOKEN_HH: str(),
    TELEGRAM_CHAT_ID_HH: str(),
    POLL_INTERVAL_MINUTES: num({ default: 10 }),
    HEALTH_PORT: num({ default: 9000 }),
    LOG_LEVEL: str({ default: 'info' }),
    MONGO_URI: str({ default: 'mongodb://192.168.0.109:27018/netagent' }),
    REDIS_URI: str({ default: 'redis://192.168.0.109:6380' }),
    GEMINI_API_KEY: str({ default: '' }),
    GEMINI_MODEL_NAME: str({ default: 'gemini-1.5-flash' }),
    SERVICE_PUBLIC_URL: str({ default: 'https://127.0.0.1:9000' }),
    HH_CLIENT_ID: str({ default: '' }),
    HH_CLIENT_SECRET: str({ default: '' }),
    HH_REDIRECT_URI: str({ default: '' }),
    HH_CONTACT_EMAIL: str({ devDefault: 'admin@example.com' }),
    HH_API_TIMEOUT: num({ default: 10000 }),
    HH_SMART_FILTERS: str({ default: '{}' }),
    VAULT_ADDR: str({ default: '' }),
    VAULT_TOKEN: str({ default: '' }),
})

logger.info('Config loaded', {
    searchText: config.HH_SEARCH_TEXT,
    minSalary: config.HH_MIN_SALARY,
    mongoUri: config.MONGO_URI,
    redisUri: config.REDIS_URI,
})
