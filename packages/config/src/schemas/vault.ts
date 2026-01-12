import { z } from 'zod'

export const vaultSchema = z.object({
    VAULT_ADDR: z.url(),
    VAULT_TOKEN: z.string(),
})
