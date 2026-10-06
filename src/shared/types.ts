export type ThemeMode = 'dark' | 'system'
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
export type NetworkAdapterType = 'ethernet' | 'wifi' | 'virtual' | 'loopback' | 'other'

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
  log: {
    info: (message: string) => Promise<void>
    warn: (message: string) => Promise<void>
    error: (message: string) => Promise<void>
  }
}
