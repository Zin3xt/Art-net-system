import { app } from 'electron'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { AppSettings, LogLevel, ThemeMode } from '../../shared/types'

export const defaultSettings: AppSettings = {
  theme: 'dark',
  compactMode: true,
  startMaximized: false,
  restoreLastShow: true,
  outputEnabledOnStartup: false,
  preferredNetworkInterface: null,
  logLevel: 'info'
}

function settingsFile(): string {
  return join(app.getPath('userData'), 'settings.json')
}

function isTheme(value: unknown): value is ThemeMode {
  return value === 'dark' || value === 'system'
}

function isLogLevel(value: unknown): value is LogLevel {
  return value === 'debug' || value === 'info' || value === 'warn' || value === 'error'
}

function sanitize(input: unknown): AppSettings {
  if (!input || typeof input !== 'object') return { ...defaultSettings }
  const raw = input as Partial<AppSettings>

  return {
    theme: isTheme(raw.theme) ? raw.theme : defaultSettings.theme,
    compactMode: typeof raw.compactMode === 'boolean' ? raw.compactMode : defaultSettings.compactMode,
    startMaximized: typeof raw.startMaximized === 'boolean' ? raw.startMaximized : defaultSettings.startMaximized,
    restoreLastShow: typeof raw.restoreLastShow === 'boolean' ? raw.restoreLastShow : defaultSettings.restoreLastShow,
    outputEnabledOnStartup:
      typeof raw.outputEnabledOnStartup === 'boolean'
        ? raw.outputEnabledOnStartup
        : defaultSettings.outputEnabledOnStartup,
    preferredNetworkInterface:
      typeof raw.preferredNetworkInterface === 'string' && raw.preferredNetworkInterface.trim()
        ? raw.preferredNetworkInterface.trim()
        : null,
    logLevel: isLogLevel(raw.logLevel) ? raw.logLevel : defaultSettings.logLevel
  }
}

export async function readSettings(): Promise<AppSettings> {
  try {
    const data = await readFile(settingsFile(), 'utf8')
    return sanitize(JSON.parse(data))
  } catch {
    return { ...defaultSettings }
  }
}

export async function saveSettings(input: unknown): Promise<AppSettings> {
  const settings = sanitize(input)
  const file = settingsFile()
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, `${JSON.stringify(settings, null, 2)}\n`, 'utf8')
  return settings
}
