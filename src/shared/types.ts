export type ThemeMode = 'dark' | 'system'
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
export type NetworkAdapterType = 'ethernet' | 'wifi' | 'virtual' | 'loopback' | 'other'
export type ArtNetEngineState = 'stopped' | 'starting' | 'running' | 'error'

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
  lastSeenAt: number
  online: boolean
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
  onlineNodes: number
  totalNodes: number
  lastError: string | null
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
  }
  log: {
    info: (message: string) => Promise<void>
    warn: (message: string) => Promise<void>
    error: (message: string) => Promise<void>
  }
}
