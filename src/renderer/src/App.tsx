import { useEffect, useMemo, useState } from 'react'
import type { AppInfo } from '../../shared/types'
import { Sidebar } from './components/Sidebar'
import { StatusBar } from './components/StatusBar'
import { TopBar } from './components/TopBar'
import { DashboardPage } from './pages/DashboardPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { SettingsPage } from './pages/SettingsPage'
import { useAppStore } from './stores/appStore'

const phases = {
  network: 2,
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

  useEffect(() => {
    void Promise.all([window.artnetDesktop.app.getInfo(), window.artnetDesktop.app.ping()])
      .then(([runtime, ping]) => {
        setInfo(runtime)
        setIpcOk(ping === 'pong')
        return window.artnetDesktop.log.info('Renderer initialized and secure IPC bridge verified.')
      })
      .catch(() => setIpcOk(false))
  }, [])

  const page = useMemo(() => {
    if (currentPage === 'dashboard') return <DashboardPage info={info} />
    if (currentPage === 'settings') return <SettingsPage />
    const title = currentPage.charAt(0).toUpperCase() + currentPage.slice(1)
    return <PlaceholderPage title={title} phase={phases[currentPage as keyof typeof phases]} />
  }, [currentPage, info])

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
