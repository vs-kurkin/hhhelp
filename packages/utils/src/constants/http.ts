export const HTTP_STATUS = {
    ok: 200,
    accepted: 202,
    badRequest: 400,
    internalServerError: 500,
    serviceUnavailable: 503,
}

export const INSECURE_PORTS: Record<number, string> = {
    /* eslint-disable @typescript-eslint/naming-convention*/
    21: 'FTP (often insecure)',
    23: 'Telnet (insecure, cleartext credentials)',
    80: 'HTTP (unencrypted web traffic)',
    445: 'SMB (potential for WannaCry/EternalBlue vulnerabilities)',
    3389: 'RDP (potential for brute-force attacks)',
    /* eslint-enable @typescript-eslint/naming-convention */
}
