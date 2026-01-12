import { ForceReply, InlineKeyboardMarkup, ParseMode, RemoveKeyboard, ReplyKeyboardMarkup } from 'grammy/types'

export interface IpAddress {
    id: string;
    address: string;
    network: string;
    interface: string;
    actualInterface: string;
    disabled: boolean;
}

export interface MikrotikUser {
    id: string;
    name: string;
    group: string;
    lastLoggedIn: string;
}

export interface MikrotikServiceType {
    id: string;
    name: string;
    port: number;
    disabled: boolean;
}

export interface RouterosVersion {
    version: string;
}

export interface FirewallRule {
    id: string;
    action: string;
    chain: string;
    srcMacAddress?: string;
    comment?: string;
    disabled: boolean;
}

export interface CustomApiResponse<T> {
    data: T;
    status: number;
}

export interface MikrotikService {
    getIpAddresses(): Promise<IpAddress[]>;

    getDhcpLeases(): Promise<DhcpLease[]>;

    getArpEntries(): Promise<IArpEntry[]>;

    getFirewallRules(): Promise<FirewallRule[]>;

    getFirewallBlockedDevices(): Promise<FirewallRule[]>;

    getUsers(): Promise<MikrotikUser[]>;

    getServices(): Promise<MikrotikServiceType[]>;

    getRouterosVersion(): Promise<RouterosVersion>;

    scanNetwork(target: string): Promise<ScanResult>;

    blockDevice(mac: string): Promise<CustomApiResponse<unknown>>;

    unblockDevice(mac: string): Promise<CustomApiResponse<unknown>>;

    addLogEntry(message: string): Promise<CustomApiResponse<unknown>>;

    runScript(scriptName: string, scriptArgs: string): Promise<CustomApiResponse<unknown>>;
}

export interface ScannedDevice {
    ip: string;
    mac: string;
    vendor: string;
    hostname?: string;
    name?: string;
    os?: string | null;
    openPorts?: number[];
    services?: Service[];
    status?: string;
    lastSeen?: Date;
    vulnerabilities?: string[];
    securityScore?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export type ScanResult = ScannedDevice[];

export interface Service {
    port: number;
    protocol: string;
    name: string;
    version: string;
}

export interface SendMessageOptions {
    disable_notification?: boolean;
    disable_web_page_preview?: boolean;
    parse_mode?: ParseMode;
    reply_markup?: ReplyKeyboardMarkup | InlineKeyboardMarkup | RemoveKeyboard | ForceReply;
    reply_to_message_id?: number;
}

export interface EditMessageTextOptions {
    disable_web_page_preview?: boolean;
    parse_mode?: ParseMode;
    reply_markup?: InlineKeyboardMarkup;
}

export interface DhcpLease {
    address: string;
    mac: string;
    hostName?: string;
    comment?: string;
    status: string;
}

export interface IArpEntry {
    address: string;
    mac: string;
    interface: string;
}

export interface MikrotikCommandResult {
    status: string;
    message?: string;
    data?: unknown;
}

export interface CommandProxyPayload {
    command: string;
    match?: string; // Added this line
    chatId?: number;
    messageId?: number;
}

export interface CommandProxyResponse {
    message: string
}

export interface CommandResultMessage<T = unknown> {
    status: 'error' | 'success';
    command: string;
    chatId: number;
    messageId?: number;
    payload?: T;
}

export interface NewDeviceMessage {
    type: 'new_device_detected'
    device: ScannedDevice
}

// =================================================================
// DOMAIN EVENT AND COMMAND SCHEMA
// This section defines the formal schema for all events and commands
// that are transmitted through the message bus (RabbitMQ).
//
// It establishes a unified, strongly-typed contract for inter-service
// communication, following Domain-Driven Design (DDD) principles.
// =================================================================


/**
 * Represents the origin of a message, allowing for tracing and context.
 */
export interface MessageMetadata {
    /**
     * A unique identifier for the entire transaction or workflow.
     * All events and commands within the same workflow share this ID.
     */
    correlationId: string;

    /**
     * The name of the service that originated this message.
     */
    originService: string;

    /**
     * The timestamp when the message was created.
     */
    timestamp: string;

    /**
     * Optional user context, if the action was initiated by a user.
     */
    user?: {
        chatId: number;
        messageId?: number;
    };
}

/**
 * A generic envelope for all messages passed through the system.
 * @template TPayload The specific payload for the message.
 * @template TType The specific type of the message, as a string literal.
 */
export interface DomainMessage<
    TPayload extends object,
    TType extends string = string,
> {
    /**
     * The unique, domain-specific type of the message.
     * e.g., "user.command.scan_device", "system.event.device_detected"
     */
    type: TType;

    /**
     * The data payload specific to this message type.
     */
    payload: TPayload;

    /**
     * Metadata for tracing and context.
     */
    metadata: MessageMetadata;
}


// =================================================================
// 1. COMMANDS
// Commands are requests to perform an action. They are named in the
// imperative tense (e.g., "DoThisThing").
// =================================================================

// --- User-Initiated Commands (from Telegram) ---

export type UserScanDeviceCommand = DomainMessage<{
    target: string;
}, 'user.command.scan_device'>;

export type UserBlockDeviceCommand = DomainMessage<{
    macAddress: string;
}, 'user.command.block_device'>;


// --- System-Internal Commands (between services) ---

export type AnalysisStartDeepScanCommand = DomainMessage<{
    target: string;
    reason: string;
}, 'analysis.command.start_deep_scan'>;

export type RemediationBlockDeviceCommand = DomainMessage<{
    macAddress: string;
    reason: string;
}, 'remediation.command.block_device'>;


// =================================================================
// 2. EVENTS
// Events are records of something that has happened. They are named
// in the past tense (e.g., "ThingHasHappened").
// =================================================================

// --- Low-Level "Fact" Events (from Adapters) ---

export type DeviceDetectedEvent = DomainMessage<{
    macAddress: string;
    ipAddress: string;
    hostname?: string;
    timestamp: string;
}, 'device.fact.detected'>;

export type NetworkTrafficFlowRecordedEvent = DomainMessage<{
    sourceIp: string;
    destinationIp: string;
    sourcePort: number;
    destinationPort: number;
    protocol: string;
    packets: number;
    bytes: number;
    startTime: string; // ISO 8601 format
    endTime: string;   // ISO 8601 format
}, 'network.traffic.flow_recorded'>;


// --- High-Level "Analysis" Events (from Analyzers/Detectors) ---

export type ThreatDetectedEvent = DomainMessage<{
    type: 'unusual_port_activity' | 'known_vulnerability_found';
    severity: 'low' | 'medium' | 'high' | 'critical';
    target: {
        ipAddress: string;
        macAddress: string;
    };
    details: string;
}, 'analysis.event.threat_detected'>;

// --- Notification Events (for sending messages to user) ---

export type NotificationSendMessageEvent = DomainMessage<{
    level: 'info' | 'warn' | 'error';
    message: string;
}, 'notification.event.send_message'>
