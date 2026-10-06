export type ThemeMode = 'dark' | 'system'
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface AppSettings {
  theme: ThemeMode
  compactMode: boolean
  startMaximized: boolean
  restoreLastShow: boolean
  outputEnabledOnStartup: boolean
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

export interface DesktopBridge {
  app: {
    getInfo: () => Promise<AppInfo>
    ping: () => Promise<'pong'>
  }
  settings: {
    get: () => Promise<AppSettings>
    save: (settings: AppSettings) => Promise<AppSettings>
  }
  log: {
    info: (message: string) => Promise<void>
    warn: (message: string) => Promise<void>
    error: (message: string) => Promise<void>
  }
}
