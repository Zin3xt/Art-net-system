import { app, ipcMain } from 'electron'
import { IPC } from '../../shared/ipc'
import type { AppSettings } from '../../shared/types'
import { logger } from '../services/logger'
import { readSettings, saveSettings } from '../services/settings'
import { assertTrustedSender } from './trust'

function cleanRendererMessage(input: unknown): string {
  if (typeof input !== 'string') return '[invalid renderer log message]'
  return input.replace(/[\r\n]+/g, ' ').slice(0, 1000)
}

export function registerIpcHandlers(): void {
  ipcMain.handle(IPC.APP_PING, (event) => {
    assertTrustedSender(event)
    return 'pong' as const
  })

  ipcMain.handle(IPC.APP_INFO, (event) => {
    assertTrustedSender(event)
    return {
      name: app.getName(),
      version: app.getVersion(),
      platform: process.platform,
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      node: process.versions.node
    }
  })

  ipcMain.handle(IPC.SETTINGS_GET, async (event) => {
    assertTrustedSender(event)
    return readSettings()
  })

  ipcMain.handle(IPC.SETTINGS_SAVE, async (event, settings: AppSettings) => {
    assertTrustedSender(event)
    const saved = await saveSettings(settings)
    await logger.info('Application settings updated.')
    return saved
  })

  ipcMain.handle(IPC.LOG_INFO, async (event, message: unknown) => {
    assertTrustedSender(event)
    await logger.info(`[renderer] ${cleanRendererMessage(message)}`)
  })

  ipcMain.handle(IPC.LOG_WARN, async (event, message: unknown) => {
    assertTrustedSender(event)
    await logger.warn(`[renderer] ${cleanRendererMessage(message)}`)
  })

  ipcMain.handle(IPC.LOG_ERROR, async (event, message: unknown) => {
    assertTrustedSender(event)
    await logger.error(`[renderer] ${cleanRendererMessage(message)}`)
  })
}
