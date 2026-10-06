import { useEffect, useMemo, useState } from 'react'
import type { AppInfo } from '../../shared/types'
import { Sidebar } from './components/Sidebar'
import { StatusBar } from './components/StatusBar'
import { TopBar } from './components/TopBar'
import { DashboardPage } from './pages/DashboardPage'
import { NetworkPage } from './pages/NetworkPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { SettingsPage } from './pages/SettingsPage'
import { useAppStore } from './stores/appStore'

const phases = {
  universes: 5,
  fixtures: 9,
  patch: 10,
  programmer: 13,
  groups: 12,
  scenes: 15,
  cues: 16,
  effects: 18,
  stage: 20,
  diagnostics: 25
} as const

export default function App() {
  const currentPage = useAppStore((state) => state.currentPage)
  const [info, setInfo] = useState<AppInfo | null>(null)
  const [ipcOk, setIpcOk] = useState(false)
  const bridgeAvailable = typeof window.artnetDesktop !== 'undefined'

  useEffect(() => {
    if (!bridgeAvailable) {
      setIpcOk(false)
      return
    }

    void Promise.all([window.artnetDesktop.app.getInfo(), window.artnetDesktop.app.ping()])
      .then(([runtime, ping]) => {
        setInfo(runtime)
        setIpcOk(ping === 'pong')
        return window.artnetDesktop.log.info('Renderer initialized and secure IPC bridge verified.')
      })
      .catch(() => setIpcOk(false))
  }, [bridgeAvailable])

  const page = useMemo(() => {
    if (!bridgeAvailable) return <BridgeErrorPage />
    if (currentPage === 'dashboard') return <DashboardPage info={info} />
    if (currentPage === 'network') return <NetworkPage />
    if (currentPage === 'settings') return <SettingsPage />
    const title = currentPage.charAt(0).toUpperCase() + currentPage.slice(1)
    return <PlaceholderPage title={title} phase={phases[currentPage as keyof typeof phases]} />
  }, [bridgeAvailable, currentPage, info])

  return (
    <div className="flex h-screen w-screen bg-zinc-950 text-zinc-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="min-h-0 flex-1 overflow-auto">{page}</main>
        <StatusBar info={info} ipcOk={ipcOk} />
      </div>
    </div>
  )
}

function BridgeErrorPage() {
  return (
    <div className="p-5">
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6">
        <div className="text-lg font-semibold text-red-300">Electron preload bridge unavailable</div>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
          The desktop window loaded, but the secure Electron preload script did not initialize.
          Restart the app after rebuilding. If this remains visible, check the application log for a preload error.
        </p>
        <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs text-zinc-400">
          Expected preload: out/preload/index.cjs
        </div>
      </div>
    </div>
  )
}
