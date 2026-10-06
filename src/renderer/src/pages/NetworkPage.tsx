import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  CircleOff,
  EthernetPort,
  Play,
  Radar,
  RefreshCw,
  Router,
  Send,
  Square,
  Wifi
} from 'lucide-react'
import type {
  AppSettings,
  ArtNetEngineStatus,
  ArtNetNode,
  NetworkAdapter
} from '../../../shared/types'
import { Button } from '../components/ui/Button'
import { Card, CardHeader } from '../components/ui/Card'
import { StatusDot } from '../components/ui/StatusDot'

const REFRESH_MS = 2500

function AdapterIcon({ adapter }: { adapter: NetworkAdapter }) {
  if (adapter.type === 'wifi') return <Wifi size={18} />
  if (adapter.type === 'ethernet') return <EthernetPort size={18} />
  return <Router size={18} />
}

export function NetworkPage({
  artnetStatus,
  artnetNodes,
  onArtNetChanged
}: {
  artnetStatus: ArtNetEngineStatus
  artnetNodes: ArtNetNode[]
  onArtNetChanged: () => Promise<void>
}) {
  const [adapters, setAdapters] = useState<NetworkAdapter[]>([])
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [engineAction, setEngineAction] = useState<'start' | 'stop' | 'poll' | null>(null)

  const refresh = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      const [items, appSettings] = await Promise.all([
        window.artnetDesktop.network.listAdapters(),
        window.artnetDesktop.settings.get()
      ])
      setAdapters(items)
      setSettings(appSettings)
      setLastUpdated(new Date())
      setError(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to read network interfaces.')
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh(true)
    const timer = window.setInterval(() => void refresh(false), REFRESH_MS)
    return () => window.clearInterval(timer)
  }, [refresh])

  const engineLocked = artnetStatus.state === 'running' || artnetStatus.state === 'starting'
  const usable = useMemo(() => adapters.filter((adapter) => adapter.usableForArtNet), [adapters])
  const selected = useMemo(
    () => adapters.find((adapter) => adapter.name === settings?.preferredNetworkInterface) ?? null,
    [adapters, settings?.preferredNetworkInterface]
  )

  async function selectAdapter(adapter: NetworkAdapter) {
    if (!settings || !adapter.usableForArtNet || engineLocked) return
    const next = { ...settings, preferredNetworkInterface: adapter.name }
    const saved = await window.artnetDesktop.settings.save(next)
    setSettings(saved)
    await window.artnetDesktop.log.info(`Selected Art-Net network interface: ${adapter.name}`)
  }

  async function clearSelection() {
    if (!settings || engineLocked) return
    const saved = await window.artnetDesktop.settings.save({
      ...settings,
      preferredNetworkInterface: null
    })
    setSettings(saved)
  }

  async function startDiscovery() {
    setEngineAction('start')
    setError(null)
    try {
      await window.artnetDesktop.artnet.start()
      await onArtNetChanged()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to start Art-Net discovery.')
      await onArtNetChanged()
    } finally {
      setEngineAction(null)
    }
  }

  async function stopDiscovery() {
    setEngineAction('stop')
    setError(null)
    try {
      await window.artnetDesktop.artnet.stop()
      await onArtNetChanged()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to stop Art-Net discovery.')
    } finally {
      setEngineAction(null)
    }
  }

  async function pollNow() {
    setEngineAction('poll')
    setError(null)
    try {
      await window.artnetDesktop.artnet.poll()
      await onArtNetChanged()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to send ArtPoll.')
    } finally {
      setEngineAction(null)
    }
  }

  return (
    <div className="space-y-4 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Network & Art-Net Discovery</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Bind UDP 6454 to the selected IPv4 adapter and discover Art-Net nodes without sending DMX data.
          </p>
        </div>
        <Button onClick={() => void refresh(true)} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'mr-2 animate-spin' : 'mr-2'} />
          Refresh adapters
        </Button>
      </div>

      {error ? (
        <Card className="border-red-500/30 bg-red-500/5 p-4 text-sm text-red-300">{error}</Card>
      ) : null}

      {artnetStatus.lastError ? (
        <Card className="border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200">
          Art-Net engine: {artnetStatus.lastError}
        </Card>
      ) : null}

      <Card>
        <CardHeader
          title="Art-Net discovery engine"
          subtitle="Discovery only. ArtDmx and physical lighting output remain disabled in Phase 3."
          action={
            <div className="flex gap-2">
              <Button
                onClick={() => void pollNow()}
                disabled={artnetStatus.state !== 'running' || engineAction !== null}
              >
                <Send size={14} className="mr-2" />
                Scan now
              </Button>
              {artnetStatus.state === 'running' || artnetStatus.state === 'starting' ? (
                <Button
                  onClick={() => void stopDiscovery()}
                  disabled={engineAction !== null}
                  className="border-red-500/40 bg-red-500/10 hover:bg-red-500/20"
                >
                  <Square size={14} className="mr-2" />
                  {engineAction === 'stop' ? 'Stopping…' : 'Stop'}
                </Button>
              ) : (
                <Button
                  onClick={() => void startDiscovery()}
                  disabled={!selected || engineAction !== null}
                  className="border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20"
                >
                  <Play size={14} className="mr-2" />
                  {engineAction === 'start' ? 'Starting…' : 'Start discovery'}
                </Button>
              )}
            </div>
          }
        />

        <div className="grid grid-cols-6 gap-3 p-4">
          <EngineMetric
            label="State"
            value={artnetStatus.state}
            state={artnetStatus.state === 'running' ? 'ok' : artnetStatus.state === 'error' ? 'warn' : 'idle'}
          />
          <EngineMetric label="Local IPv4" value={artnetStatus.localAddress ?? '—'} />
          <EngineMetric label="Broadcast" value={artnetStatus.broadcastAddress ?? '—'} />
          <EngineMetric label="UDP port" value={String(artnetStatus.port)} />
          <EngineMetric label="ArtPoll TX" value={String(artnetStatus.packetsSent)} />
          <EngineMetric label="Packets RX" value={String(artnetStatus.packetsReceived)} />
        </div>

        <div className="border-t border-zinc-900 px-4 py-3 text-xs text-zinc-500">
          ArtPoll automatically repeats every 2.75 seconds while discovery is running.
          {artnetStatus.lastPollAt
            ? ` Last poll: ${new Date(artnetStatus.lastPollAt).toLocaleTimeString()}.`
            : ''}
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Summary label="IPv4 interfaces" value={String(adapters.length)} />
        <Summary label="Art-Net usable" value={String(usable.length)} />
        <Summary label="Selected interface" value={selected?.name ?? 'Not selected'} />
      </div>

      <Card>
        <CardHeader
          title="Detected adapters"
          subtitle={
            engineLocked
              ? 'Interface selection is locked while Art-Net discovery is running.'
              : lastUpdated
                ? `Auto-refresh every 2.5 seconds · Last checked ${lastUpdated.toLocaleTimeString()}`
                : 'Reading adapters…'
          }
        />
        <div className="divide-y divide-zinc-900">
          {!loading && adapters.length === 0 ? (
            <div className="flex items-center gap-3 p-5 text-sm text-zinc-500">
              <CircleOff size={18} /> No IPv4 interfaces were detected.
            </div>
          ) : null}

          {adapters.map((adapter) => {
            const isSelected = adapter.name === settings?.preferredNetworkInterface
            return (
              <div
                key={adapter.id}
                className="grid grid-cols-[minmax(180px,1.3fr)_1fr_1fr_auto] items-center gap-4 px-4 py-4"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border ${
                      isSelected
                        ? 'border-blue-500/40 bg-blue-500/10 text-blue-300'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                    }`}
                  >
                    <AdapterIcon adapter={adapter} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-zinc-200">{adapter.name}</span>
                      {isSelected ? <CheckCircle2 size={14} className="text-blue-400" /> : null}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-500">
                      <StatusDot state={adapter.usableForArtNet ? 'ok' : 'idle'} />
                      <span className="capitalize">{adapter.type}</span>
                      <span>·</span>
                      <span>{adapter.usableForArtNet ? 'Available for Art-Net' : 'Not selectable'}</span>
                    </div>
                  </div>
                </div>

                <Info label="IPv4" value={adapter.address} secondary={adapter.cidr ?? undefined} />
                <Info
                  label="Subnet / Broadcast"
                  value={adapter.netmask}
                  secondary={adapter.broadcast ?? 'Unavailable'}
                />

                <div className="flex justify-end">
                  {isSelected ? (
                    <Button
                      onClick={() => void clearSelection()}
                      disabled={engineLocked}
                      className="min-w-28"
                    >
                      Clear
                    </Button>
                  ) : (
                    <Button
                      onClick={() => void selectAdapter(adapter)}
                      disabled={!adapter.usableForArtNet || engineLocked}
                      className="min-w-28"
                    >
                      Use for Art-Net
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Selected Art-Net interface"
          subtitle="The discovery engine binds UDP 6454 to this local IPv4 address."
        />
        {selected ? (
          <div className="grid grid-cols-4 gap-3 p-4">
            <InfoBox label="Interface" value={selected.name} />
            <InfoBox label="IPv4 address" value={selected.address} />
            <InfoBox label="Subnet mask" value={selected.netmask} />
            <InfoBox label="Broadcast" value={selected.broadcast ?? 'Unavailable'} />
          </div>
        ) : (
          <div className="p-4 text-sm text-amber-300">
            Select a non-loopback IPv4 interface before starting Art-Net discovery.
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Discovered Art-Net nodes"
          subtitle={`${artnetStatus.onlineNodes} online · ${artnetStatus.totalNodes} retained`}
          action={<Radar size={18} className={artnetStatus.state === 'running' ? 'text-emerald-400' : 'text-zinc-600'} />}
        />
        {artnetNodes.length === 0 ? (
          <div className="p-5 text-sm text-zinc-500">
            No ArtPollReply packets received yet. Start discovery with an Art-Net node connected to the selected network.
          </div>
        ) : (
          <div className="divide-y divide-zinc-900">
            {artnetNodes.map((node) => (
              <div key={node.id} className="grid grid-cols-[1.5fr_1fr_1fr_1.2fr_auto] gap-4 px-4 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <StatusDot state={node.online ? 'ok' : 'idle'} />
                    <span className="truncate text-sm font-medium text-zinc-200">{node.longName}</span>
                  </div>
                  <div className="mt-1 truncate text-xs text-zinc-500">
                    {node.shortName} · {node.styleName}
                  </div>
                  {node.nodeReport ? (
                    <div className="mt-1 truncate font-mono text-[10px] text-zinc-600">{node.nodeReport}</div>
                  ) : null}
                </div>

                <Info label="IP / MAC" value={node.ip} secondary={node.mac ?? 'MAC unavailable'} />
                <Info
                  label="Device"
                  value={`OEM 0x${node.oemCode.toString(16).padStart(4, '0').toUpperCase()}`}
                  secondary={`FW ${node.firmwareVersion}`}
                />
                <Info
                  label="Ports"
                  value={formatPorts(node)}
                  secondary={[
                    node.rdmCapable ? 'RDM' : null,
                    node.sacnCapable ? 'sACN' : null
                  ].filter(Boolean).join(' · ') || 'Art-Net'}
                />

                <div className="text-right">
                  <div className={`text-xs font-medium ${node.online ? 'text-emerald-300' : 'text-zinc-500'}`}>
                    {node.online ? 'Online' : 'Offline'}
                  </div>
                  <div className="mt-1 text-[10px] text-zinc-600">
                    {new Date(node.lastSeenAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

function formatPorts(node: ArtNetNode): string {
  const outputs = node.ports
    .filter((port) => port.canOutput && port.outputPortAddress !== null)
    .map((port) => formatPortAddress(port.outputPortAddress!))

  const inputs = node.ports
    .filter((port) => port.canInput && port.inputPortAddress !== null)
    .map((port) => formatPortAddress(port.inputPortAddress!))

  if (outputs.length) return `Out ${outputs.join(', ')}`
  if (inputs.length) return `In ${inputs.join(', ')}`
  return `${node.numPorts} port${node.numPorts === 1 ? '' : 's'}`
}

function formatPortAddress(address: number): string {
  const net = (address >> 8) & 0x7f
  const subNet = (address >> 4) & 0x0f
  const universe = address & 0x0f
  return `${net}:${subNet}:${universe}`
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">{label}</div>
      <div className="mt-2 truncate text-lg font-semibold text-zinc-100">{value}</div>
    </Card>
  )
}

function EngineMetric({
  label,
  value,
  state = 'idle'
}: {
  label: string
  value: string
  state?: 'ok' | 'warn' | 'idle'
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-zinc-600">
        <StatusDot state={state} /> {label}
      </div>
      <div className="mt-2 truncate font-mono text-xs text-zinc-200">{value}</div>
    </div>
  )
}

function Info({ label, value, secondary }: { label: string; value: string; secondary?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.12em] text-zinc-600">{label}</div>
      <div className="mt-1 font-mono text-xs text-zinc-300">{value}</div>
      {secondary ? <div className="mt-1 font-mono text-[11px] text-zinc-500">{secondary}</div> : null}
    </div>
  )
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
      <div className="text-[10px] uppercase tracking-[0.12em] text-zinc-600">{label}</div>
      <div className="mt-2 break-all font-mono text-xs text-zinc-200">{value}</div>
    </div>
  )
}
