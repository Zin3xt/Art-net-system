import { app, ipcMain } from 'electron'
import { IPC } from '../../shared/ipc'
import type { AppSettings, UniverseChannelUpdate, UniverseInput } from '../../shared/types'
import { artNetEngine } from '../artnet/engine'
import { dmxOutputEngine } from '../artnet/output-engine'
import { logger } from '../services/logger'
import { listNetworkAdapters } from '../services/network'
import { readSettings, saveSettings } from '../services/settings'
import {
  createUniverse,
  deleteUniverse,
  duplicateUniverse,
  listUniverses,
  resetUniverse,
  setUniverseChannel,
  updateUniverse
} from '../services/universes'
import { assertTrustedSender } from './trust'

function cleanRendererMessage(input: unknown): string {
  if (typeof input !== 'string') return '[invalid renderer log message]'
  return input.replace(/[\r\n]+/g, ' ').slice(0, 1000)
}

async function refreshOutputUniverses(): Promise<void> {
  await dmxOutputEngine.refreshUniverses()
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
    await dmxOutputEngine.disable()
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

  ipcMain.handle(IPC.UNIVERSE_LIST, async (event) => {
    assertTrustedSender(event)
    return listUniverses()
  })

  ipcMain.handle(IPC.UNIVERSE_CREATE, async (event, input: UniverseInput) => {
    assertTrustedSender(event)
    const universe = await createUniverse(input)
    await refreshOutputUniverses()
    await logger.info(`Universe created: ${universe.name} (${universe.net}:${universe.subNet}:${universe.universe}).`)
    return universe
  })

  ipcMain.handle(IPC.UNIVERSE_UPDATE, async (event, id: string, input: UniverseInput) => {
    assertTrustedSender(event)
    const universe = await updateUniverse(id, input)
    await refreshOutputUniverses()
    await logger.info(`Universe updated: ${universe.name} (${universe.net}:${universe.subNet}:${universe.universe}).`)
    return universe
  })

  ipcMain.handle(IPC.UNIVERSE_DELETE, async (event, id: string) => {
    assertTrustedSender(event)
    await deleteUniverse(id)
    await refreshOutputUniverses()
    await logger.info(`Universe deleted: ${id}.`)
  })

  ipcMain.handle(IPC.UNIVERSE_DUPLICATE, async (event, id: string) => {
    assertTrustedSender(event)
    const universe = await duplicateUniverse(id)
    await refreshOutputUniverses()
    await logger.info(`Universe duplicated as ${universe.name} (${universe.net}:${universe.subNet}:${universe.universe}).`)
    return universe
  })

  ipcMain.handle(IPC.UNIVERSE_RESET, async (event, id: string) => {
    assertTrustedSender(event)
    const universe = await resetUniverse(id)
    await refreshOutputUniverses()
    await logger.info(`Universe buffer reset: ${universe.name}.`)
    return universe
  })

  ipcMain.handle(IPC.UNIVERSE_SET_CHANNEL, async (event, update: UniverseChannelUpdate) => {
    assertTrustedSender(event)
    const universe = await setUniverseChannel(update)
    await refreshOutputUniverses()
    return universe
  })

  ipcMain.handle(IPC.OUTPUT_ENABLE, async (event) => {
    assertTrustedSender(event)
    return dmxOutputEngine.enable()
  })

  ipcMain.handle(IPC.OUTPUT_DISABLE, async (event) => {
    assertTrustedSender(event)
    return dmxOutputEngine.disable()
  })

  ipcMain.handle(IPC.OUTPUT_BLACKOUT_ON, async (event) => {
    assertTrustedSender(event)
    return dmxOutputEngine.blackoutOn()
  })

  ipcMain.handle(IPC.OUTPUT_BLACKOUT_OFF, async (event) => {
    assertTrustedSender(event)
    return dmxOutputEngine.blackoutOff()
  })

  ipcMain.handle(IPC.OUTPUT_STATUS, (event) => {
    assertTrustedSender(event)
    return dmxOutputEngine.getStatus()
  })

  ipcMain.handle(IPC.OUTPUT_ROUTES, (event) => {
    assertTrustedSender(event)
    return dmxOutputEngine.getRoutes()
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
