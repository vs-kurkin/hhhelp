import { makeLogger } from '@vk/logger'
import { ScannedDevice } from '@vk/types'


const logger = makeLogger('nmap-parser')

interface NmapAddress {
    $: {
        addrtype: string;
        addr?: string;
        vendor?: string;
    };
}

interface NmapHostname {
    hostname: Array<{
        $: {
            name: string;
        };
    }>;
}

interface NmapStatus {
    $: {
        state: string;
    };
}

interface NmapOsMatch {
    $: {
        name: string;
    };
}

interface NmapService {
    $: {
        name?: string;
        product?: string;
    };
}

interface NmapPort {
    $: {
        portid: string;
        protocol: string;
    };
    state?: Array<{
        $: {
            state: string;
        };
    }>;
    service?: Array<NmapService>;
}

interface NmapPorts {
    port?: NmapPort[];
}

interface NmapHost {
    address?: NmapAddress[];
    hostnames?: NmapHostname[];
    status?: NmapStatus[];
    os?: Array<{
        osmatch?: NmapOsMatch[];
    }>;
    ports?: NmapPorts[];
}

interface Service {
    port: number;
    protocol: string;
    name: string;
    version: string;
}

// Helper functions to reduce complexity of processHost
function getIpAddress(host: NmapHost): string {
    return host.address?.find(addr => addr.$.addrtype === 'ipv4')?.$.addr || 'unknown'
}

function getMacAddress(host: NmapHost): string | void {
    return host.address?.find(addr => addr.$.addrtype === 'mac')?.$.addr || undefined
}

function getHostName(host: NmapHost, ip: string): string {
    return host.hostnames?.[0]?.hostname?.[0]?.$.name || ip
}

function getMacVendor(host: NmapHost): string {
    return host.address?.find(addr => addr.$.addrtype === 'mac')?.$.vendor || 'unknown'
}

function getStatus(host: NmapHost): string {
    return host.status?.[0]?.$.state || 'unknown'
}

function extractBasicInfo(host: NmapHost) {
    const ip = getIpAddress(host)
    const mac = getMacAddress(host)
    const hostName = getHostName(host, ip)
    const vendor = getMacVendor(host)
    const status = getStatus(host)

    return {
        ip, mac, hostName, vendor, status,
    }
}

function extractOs(host: NmapHost): string {
    const osMatch = host.os?.[0]?.osmatch?.[0]

    return osMatch?.$.name || 'unknown'
}

function createService(port: NmapPort): Service {
    return {
        port: Number.parseInt(port.$.portid, 10),
        protocol: port.$.protocol,
        name: port.service?.[0]?.$.name || 'unknown',
        version: port.service?.[0]?.$.product || 'unknown',
    }
}

function processPort(port: NmapPort, openPorts: number[], services: Service[]) {
    if (port.state?.[0]?.$.state === 'open') {
        openPorts.push(Number.parseInt(port.$.portid, 10))
        services.push(createService(port))
    }
}

function extractPortsAndServices(host: NmapHost) {
    const openPorts: number[] = []
    const services: Service[] = []
    const ports = host.ports?.[0]?.port || []

    if (Array.isArray(ports)) {
        for (const port of ports) {
            processPort(port, openPorts, services)
        }
    }

    return {
        openPorts, services,
    }
}

function processHost(host: NmapHost): ScannedDevice | void {
    if (host == null) {
        return undefined
    }

    const {
        ip, mac, hostName, vendor, status,
    } = extractBasicInfo(host)
    const os = extractOs(host)
    const { openPorts, services } = extractPortsAndServices(host)

    return {
        name: hostName,
        ip,
        mac: mac || '',
        vendor,
        hostname: hostName,
        os,
        openPorts,
        services,
        status,
        lastSeen: new Date(),
        vulnerabilities: [],
        securityScore: 100,
    }
}

// eslint-disable-next-line max-statements,complexity
export async function parseNmapOutput(
    jsonOutput: string,
): Promise<ScannedDevice[]> {
    const devices: ScannedDevice[] = []

    try {
        const firstBrace = jsonOutput.indexOf('{')
        const lastBrace = jsonOutput.lastIndexOf('}')

        if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
            logger.warn('No valid JSON object found in Nmap output.')

            return []
        }

        const extractedJson = jsonOutput.slice(firstBrace, lastBrace + 1)

        logger.debug('Extracted Nmap JSON output:\n' + extractedJson)
        const nmapResult = JSON.parse(extractedJson)

        const hosts = nmapResult?.nmaprun?.host || []

        if (!hosts || !Array.isArray(hosts) || hosts.length === 0) {
            logger.debug('No hosts found in Nmap JSON output.')

            return []
        }

        for (const host of hosts) {
            const scannedDevice = processHost(host)

            if (scannedDevice) {
                devices.push(scannedDevice)
            }
        }

        logger.debug('Parsed devices: ' + JSON.stringify(devices, undefined, 2))
    } catch (error) {
        logger.error('Error parsing Nmap JSON output:', error)
    }

    return devices
}
