import { z } from 'zod'

export const scannerSchema = z.object({
    SUBNET_DEVICE_DISCOVERY: z.string(),
    // eslint-disable-next-line sonarjs/no-hardcoded-ip
    SUBNET_SCAN: z.string().default('192.168.1.0/24'),
    TIMEOUT_NMAP_SCAN_SECONDS: z.string().transform(Number).default(300),
})
