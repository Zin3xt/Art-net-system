export type ThemeMode = 'dark' | 'system'
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
export type NetworkAdapterType = 'ethernet' | 'wifi' | 'virtual' | 'loopback' | 'other'
export type ArtNetEngineState = 'stopped' | 'starting' | 'running' | 'error'
export type ArtNetNodeHealth = 'healthy' | 'stale' | 'offline'
export type ArtNetNodeEventSeverity = 'info' | 'warning' | 'error'
export type UniverseOutputMode = 'broadcast' | 'unicast'
export type ArtNetNodeEventType =
  | 'engine-started'
  | 'engine-stopped'
  | 'node-discovered'
  | 'node-recovered'
  | 'node-stale'
  | 'node-offline'
  | 'node-changed'
  | 'node-removed'
  | 'socket-error'

export interface AppSettings {
  theme: ThemeMode
  compactMode: boolean
  startMaximized: boolean
  restoreLastShow: boolean
  outputEnabledOnStartup: boolean
  preferredNetworkInterface: string | null
  logLevel: LogLevel
}

export interface AppInfo {
  name: string
  version: string
  platform: NodeJS.Platform
  electron: string
  chrome: string
  node: string
}

export interface NetworkAdapter {
  id: string
  name: string
  type: NetworkAdapterType
  address: string
  netmask: string
  broadcast: string | null
  cidr: string | null
  mac: string | null
  internal: boolean
  usableForArtNet: boolean
}

export interface ArtNetPort {
  index: number
  canInput: boolean
  canOutput: boolean
  inputPortAddress: number | null
  outputPortAddress: number | null
  protocol: number
}

export interface ArtNetNode {
  id: string
  ip: string
  remoteAddress: string
  port: number
  shortName: string
  longName: string
  nodeReport: string
  firmwareVersion: number
  oemCode: number
  style: number
  styleName: string
  mac: string | null
  bindIp: string | null
  bindIndex: number
  numPorts: number
  ports: ArtNetPort[]
  rdmCapable: boolean
  sacnCapable: boolean
  firstSeenAt: number
  lastSeenAt: number
  lastChangedAt: number
  responseCount: number
  health: ArtNetNodeHealth
  online: boolean
}

export interface ArtNetNodeEvent {
  id: string
  timestamp: number
  type: ArtNetNodeEventType
  severity: ArtNetNodeEventSeverity
  nodeId: string | null
  nodeName: string | null
  message: string
  details: string | null
}

export interface ArtNetEngineStatus {
  state: ArtNetEngineState
  interfaceName: string | null
  localAddress: string | null
  broadcastAddress: string | null
  port: number
  startedAt: number | null
  lastPollAt: number | null
  packetsSent: number
  packetsReceived: number
  healthyNodes: number
  staleNodes: number
  offlineNodes: number
  onlineNodes: number
  totalNodes: number
  lastError: string | null
}

export interface UniverseDefinition {
  id: string
  name: string
  net: number
  subNet: number
  universe: number
  portAddress: number
  enabled: boolean
  outputMode: UniverseOutputMode
  targetNodeId: string | null
  targetNodeIp: string | null
  channels: number[]
  createdAt: number
  updatedAt: number
}

export interface UniverseInput {
  name: string
  net: number
  subNet: number
  universe: number
  enabled: boolean
  outputMode: UniverseOutputMode
  targetNodeId: string | null
  targetNodeIp: string | null
}

export interface UniverseChannelUpdate {
  universeId: string
  channel: number
  value: number
}

export interface DesktopBridge {
  app: {
    getInfo: () => Promise<AppInfo>
    ping: () => Promise<'pong'>
  }
  settings: {
    get: () => Promise<AppSettings>
    save: (settings: AppSettings) => Promise<AppSettings>
  }
  network: {
    listAdapters: () => Promise<NetworkAdapter[]>
  }
  artnet: {
    start: () => Promise<ArtNetEngineStatus>
    stop: () => Promise<ArtNetEngineStatus>
    poll: () => Promise<ArtNetEngineStatus>
    getStatus: () => Promise<ArtNetEngineStatus>
    getNodes: () => Promise<ArtNetNode[]>
    getEvents: () => Promise<ArtNetNodeEvent[]>
    clearEvents: () => Promise<void>
  }
  universes: {
    list: () => Promise<UniverseDefinition[]>
    create: (input: UniverseInput) => Promise<UniverseDefinition>
    update: (id: string, input: UniverseInput) => Promise<UniverseDefinition>
    delete: (id: string) => Promise<void>
    duplicate: (id: string) => Promise<UniverseDefinition>
    reset: (id: string) => Promise<UniverseDefinition>
    setChannel: (update: UniverseChannelUpdate) => Promise<UniverseDefinition>
  }
  log: {
    info: (message: string) => Promise<void>
    warn: (message: string) => Promise<void>
    error: (message: string) => Promise<void>
  }
}
