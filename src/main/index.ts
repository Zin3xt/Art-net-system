import { app, BrowserWindow } from 'electron'
import { join } from 'node:path'
import { artNetEngine } from './artnet/engine'
import { dmxOutputEngine } from './artnet/output-engine'
import { registerIpcHandlers } from './ipc/register'
import { logger } from './services/logger'
import { readSettings } from './services/settings'

let mainWindow: BrowserWindow | null = null
let safeQuitInProgress = false

function isAllowedNavigation(url: string): boolean {
  if (url.startsWith('file://')) return true
  if (url.startsWith('http://localhost:') || url.startsWith('http://127.0.0.1:')) return true
  return false
}

async function createWindow(): Promise<void> {
  const settings = await readSettings()

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1080,
    minHeight: 680,
    show: false,
    backgroundColor: '#09090b',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  })

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedNavigation(url)) event.preventDefault()
  })

  mainWindow.webContents.on('preload-error', (_event, preloadPath, error) => {
    void logger.error(`Preload failed: ${preloadPath} — ${error.message}`)
  })

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    void logger.error(`Renderer load failed (${errorCode}): ${errorDescription} — ${validatedURL}`)
  })

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    void logger.error(`Renderer process exited: ${details.reason} (exit ${details.exitCode})`)
  })

  mainWindow.once('ready-to-show', () => {
    if (!mainWindow) return
    if (settings.startMaximized) mainWindow.maximize()
    mainWindow.show()
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    await mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    await mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(async () => {
  registerIpcHandlers()
  await logger.info(`Starting ${app.getName()} ${app.getVersion()}.`)
  await createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) void createWindow()
  })
})

app.on('before-quit', (event) => {
  if (safeQuitInProgress) return

  event.preventDefault()
  safeQuitInProgress = true

  void (async () => {
    try {
      await dmxOutputEngine.disable()
      await artNetEngine.stop()
    } finally {
      app.quit()
    }
  })()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

process.on('uncaughtException', (error) => {
  void logger.error(`Uncaught exception: ${error instanceof Error ? error.stack ?? error.message : String(error)}`)
})

process.on('unhandledRejection', (reason) => {
  void logger.error(`Unhandled rejection: ${String(reason)}`)
})
