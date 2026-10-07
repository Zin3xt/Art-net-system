import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/ipc'
import type { AppSettings, DesktopBridge, UniverseChannelUpdate, UniverseInput } from '../shared/types'

const bridge: DesktopBridge = {
  app: {
    getInfo: () => ipcRenderer.invoke(IPC.APP_INFO),
    ping: () => ipcRenderer.invoke(IPC.APP_PING)
  },
  settings: {
    get: () => ipcRenderer.invoke(IPC.SETTINGS_GET),
    save: (settings: AppSettings) => ipcRenderer.invoke(IPC.SETTINGS_SAVE, settings)
  },
  network: {
    listAdapters: () => ipcRenderer.invoke(IPC.NETWORK_LIST)
  },
  artnet: {
    start: () => ipcRenderer.invoke(IPC.ARTNET_START),
    stop: () => ipcRenderer.invoke(IPC.ARTNET_STOP),
    poll: () => ipcRenderer.invoke(IPC.ARTNET_POLL),
    getStatus: () => ipcRenderer.invoke(IPC.ARTNET_STATUS),
    getNodes: () => ipcRenderer.invoke(IPC.ARTNET_NODES),
    getEvents: () => ipcRenderer.invoke(IPC.ARTNET_EVENTS),
    clearEvents: () => ipcRenderer.invoke(IPC.ARTNET_CLEAR_EVENTS)
  },
  universes: {
    list: () => ipcRenderer.invoke(IPC.UNIVERSE_LIST),
    create: (input: UniverseInput) => ipcRenderer.invoke(IPC.UNIVERSE_CREATE, input),
    update: (id: string, input: UniverseInput) => ipcRenderer.invoke(IPC.UNIVERSE_UPDATE, id, input),
    delete: (id: string) => ipcRenderer.invoke(IPC.UNIVERSE_DELETE, id),
    duplicate: (id: string) => ipcRenderer.invoke(IPC.UNIVERSE_DUPLICATE, id),
    reset: (id: string) => ipcRenderer.invoke(IPC.UNIVERSE_RESET, id),
    setChannel: (update: UniverseChannelUpdate) => ipcRenderer.invoke(IPC.UNIVERSE_SET_CHANNEL, update)
  },
  output: {
    enable: () => ipcRenderer.invoke(IPC.OUTPUT_ENABLE),
    disable: () => ipcRenderer.invoke(IPC.OUTPUT_DISABLE),
    blackoutOn: () => ipcRenderer.invoke(IPC.OUTPUT_BLACKOUT_ON),
    blackoutOff: () => ipcRenderer.invoke(IPC.OUTPUT_BLACKOUT_OFF),
    getStatus: () => ipcRenderer.invoke(IPC.OUTPUT_STATUS),
    getRoutes: () => ipcRenderer.invoke(IPC.OUTPUT_ROUTES)
  },
  log: {
    info: (message: string) => ipcRenderer.invoke(IPC.LOG_INFO, message),
    warn: (message: string) => ipcRenderer.invoke(IPC.LOG_WARN, message),
    error: (message: string) => ipcRenderer.invoke(IPC.LOG_ERROR, message)
  }
}

contextBridge.exposeInMainWorld('artnetDesktop', bridge)
