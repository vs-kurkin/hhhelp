/* eslint-disable max-statements */
import { makeLogger } from '@vk-public/logger'
import vault from 'node-vault'
import { config } from '#config'

const logger = makeLogger('vault-loader')

export async function loadSecrets(): Promise<void> {
    const vaultAddr = process.env.VAULT_ADDR
    const vaultToken = process.env.VAULT_TOKEN

    if (!vaultAddr || !vaultToken) {
        logger.warn('VAULT_ADDR or VAULT_TOKEN not set. Skipping Vault loading.')

        return
    }

    try {
        if (!config.VAULT_ADDR || !config.VAULT_TOKEN) {
            logger.warn('VAULT_ADDR or VAULT_TOKEN not set. Skipping Vault loading.')

            return
        }

        const client = vault({
            apiVersion: 'v1',
            endpoint: config.VAULT_ADDR,
            token: config.VAULT_TOKEN,
        })

        const secretPath = 'secret/data/services/hhhelp'
        logger.info(`Fetching secrets from Vault: ${ secretPath }`)

        const response = await client.read(secretPath)
        const data = response.data?.data

        if (data) {
            for (const [
                key, value
            ] of Object.entries(data)) {
                if (!process.env[key]) {
                    process.env[key] = value as string
                    logger.debug(`Loaded ${ key } from Vault`)
                }
            }

            logger.info('Secrets loaded from Vault successfully')
        } else {
            logger.warn('No data found at Vault path')
        }
    } catch (error) {
        logger.error('Failed to load secrets from Vault', { error })
        // We might want to throw here if Vault is mandatory, but for now we fallback to .env
    }
}
