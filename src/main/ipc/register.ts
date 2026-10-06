import { app, ipcMain } from 'electron'
import { IPC } from '../../shared/ipc'
import type { AppSettings } from '../../shared/types'
import { artNetEngine } from '../artnet/engine'
import { logger } from '../services/logger'
import { listNetworkAdapters } from '../services/network'
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

  ipcMain.handle(IPC.NETWORK_LIST, (event) => {
    assertTrustedSender(event)
    return listNetworkAdapters()
  })

  ipcMain.handle(IPC.ARTNET_START, async (event) => {
    assertTrustedSender(event)
    return artNetEngine.start()
  })

  ipcMain.handle(IPC.ARTNET_STOP, async (event) => {
    assertTrustedSender(event)
    return artNetEngine.stop()
  })

  ipcMain.handle(IPC.ARTNET_POLL, async (event) => {
    assertTrustedSender(event)
    return artNetEngine.poll()
  })

  ipcMain.handle(IPC.ARTNET_STATUS, (event) => {
    assertTrustedSender(event)
    return artNetEngine.getStatus()
  })

  ipcMain.handle(IPC.ARTNET_NODES, (event) => {
    assertTrustedSender(event)
    return artNetEngine.getNodes()
  })

  ipcMain.handle(IPC.ARTNET_EVENTS, (event) => {
    assertTrustedSender(event)
    return artNetEngine.getEvents()
  })

  ipcMain.handle(IPC.ARTNET_CLEAR_EVENTS, (event) => {
    assertTrustedSender(event)
    artNetEngine.clearEvents()
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
