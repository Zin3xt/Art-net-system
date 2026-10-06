import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/ipc'
import type { AppSettings, DesktopBridge } from '../shared/types'

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
  log: {
    info: (message: string) => ipcRenderer.invoke(IPC.LOG_INFO, message),
    warn: (message: string) => ipcRenderer.invoke(IPC.LOG_WARN, message),
    error: (message: string) => ipcRenderer.invoke(IPC.LOG_ERROR, message)
  }
}

contextBridge.exposeInMainWorld('artnetDesktop', bridge)
