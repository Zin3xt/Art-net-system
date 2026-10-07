import { useCallback, useEffect, useState } from 'react'
import type {
  AppInfo,
  ArtNetEngineStatus,
  ArtNetNode,
  ArtNetNodeEvent,
  DmxOutputStatus,
  DmxUniverseRouteStatus,
  UniverseDefinition
} from '../../shared/types'
import { Sidebar } from './components/Sidebar'
import { StatusBar } from './components/StatusBar'
import { TopBar } from './components/TopBar'
import { DashboardPage } from './pages/DashboardPage'
import { NetworkPage } from './pages/NetworkPage'
import { NodesPage } from './pages/NodesPage'
import { OutputPage } from './pages/OutputPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { SettingsPage } from './pages/SettingsPage'
import { UniversesPage } from './pages/UniversesPage'
import { useAppStore } from './stores/appStore'

const EMPTY_ARTNET_STATUS: ArtNetEngineStatus = {
  state: 'stopped',
  interfaceName: null,
  localAddress: null,
  broadcastAddress: null,
  port: 6454,
  startedAt: null,
  lastPollAt: null,
  packetsSent: 0,
  packetsReceived: 0,
  healthyNodes: 0,
  staleNodes: 0,
  offlineNodes: 0,
  onlineNodes: 0,
  totalNodes: 0,
  lastError: null
}

const EMPTY_OUTPUT_STATUS: DmxOutputStatus = {
  state: 'disabled',
  outputEnabled: false,
  blackout: false,
  tickHz: 30,
  keepAliveMs: 900,
  packetsSent: 0,
  framesSent: 0,
  universesTransmitted: 0,
  universesBlocked: 0,
  startedAt: null,
  lastFrameAt: null,
  lastError: null
}

const phases = {
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
  const [artnetStatus, setArtnetStatus] = useState<ArtNetEngineStatus>(EMPTY_ARTNET_STATUS)
  const [artnetNodes, setArtnetNodes] = useState<ArtNetNode[]>([])
  const [artnetEvents, setArtnetEvents] = useState<ArtNetNodeEvent[]>([])
  const [outputStatus, setOutputStatus] = useState<DmxOutputStatus>(EMPTY_OUTPUT_STATUS)
  const [outputRoutes, setOutputRoutes] = useState<DmxUniverseRouteStatus[]>([])
  const [universes, setUniverses] = useState<UniverseDefinition[]>([])
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

  const refreshArtNet = useCallback(async () => {
    if (!bridgeAvailable) return

    try {
      const [status, nodes, events] = await Promise.all([
        window.artnetDesktop.artnet.getStatus(),
        window.artnetDesktop.artnet.getNodes(),
        window.artnetDesktop.artnet.getEvents()
      ])
      setArtnetStatus(status)
      setArtnetNodes(nodes)
      setArtnetEvents(events)
    } catch {
      // Runtime errors are surfaced by the engine status.
    }
  }, [bridgeAvailable])

  const refreshOutput = useCallback(async () => {
    if (!bridgeAvailable) return

    try {
      const [status, routes, universeList] = await Promise.all([
        window.artnetDesktop.output.getStatus(),
        window.artnetDesktop.output.getRoutes(),
        window.artnetDesktop.universes.list()
      ])
      setOutputStatus(status)
      setOutputRoutes(routes)
      setUniverses(universeList)
    } catch {
      // Output errors are surfaced in Output status.
    }
  }, [bridgeAvailable])

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshArtNet(), refreshOutput()])
  }, [refreshArtNet, refreshOutput])

  const clearArtNetEvents = useCallback(async () => {
    if (!bridgeAvailable) return
    await window.artnetDesktop.artnet.clearEvents()
    setArtnetEvents([])
  }, [bridgeAvailable])

  useEffect(() => {
    if (!bridgeAvailable) return
    void refreshAll()
    const timer = window.setInterval(() => void refreshAll(), 1000)
    return () => window.clearInterval(timer)
  }, [bridgeAvailable, refreshAll])

  function renderPage() {
    if (!bridgeAvailable) return <BridgeErrorPage />
    if (currentPage === 'dashboard') return <DashboardPage info={info} />
    if (currentPage === 'network') {
      return (
        <NetworkPage
          artnetStatus={artnetStatus}
          artnetNodes={artnetNodes}
          onArtNetChanged={refreshAll}
        />
      )
    }
    if (currentPage === 'nodes') {
      return (
        <NodesPage
          artnetStatus={artnetStatus}
          nodes={artnetNodes}
          events={artnetEvents}
          onRefresh={refreshAll}
          onClearEvents={clearArtNetEvents}
        />
      )
    }
    if (currentPage === 'universes') return <UniversesPage nodes={artnetNodes} />
    if (currentPage === 'output') {
      return (
        <OutputPage
          outputStatus={outputStatus}
          routes={outputRoutes}
          universes={universes}
          onRefresh={refreshAll}
        />
      )
    }
    if (currentPage === 'settings') return <SettingsPage />

    const title = currentPage.charAt(0).toUpperCase() + currentPage.slice(1)
    return <PlaceholderPage title={title} phase={phases[currentPage as keyof typeof phases]} />
  }

  return (
    <div className="flex h-screen w-screen bg-zinc-950 text-zinc-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar artnetStatus={artnetStatus} outputStatus={outputStatus} />
        <main className="min-h-0 flex-1 overflow-auto">{renderPage()}</main>
        <StatusBar
          info={info}
          ipcOk={ipcOk}
          artnetStatus={artnetStatus}
          outputStatus={outputStatus}
        />
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
