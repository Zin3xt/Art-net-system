import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Clock3,
  Cpu,
  Eraser,
  Network,
  RadioTower,
  RefreshCw,
  Search,
  ShieldCheck,
  Unplug,
  WifiOff
} from 'lucide-react'
import type {
  ArtNetEngineStatus,
  ArtNetNode,
  ArtNetNodeEvent,
  ArtNetNodeHealth,
  ArtNetPort
} from '../../../shared/types'
import { Button } from '../components/ui/Button'
import { Card, CardHeader } from '../components/ui/Card'
import { StatusDot } from '../components/ui/StatusDot'

type HealthFilter = 'all' | ArtNetNodeHealth

export function NodesPage({
  artnetStatus,
  nodes,
  events,
  onRefresh,
  onClearEvents
}: {
  artnetStatus: ArtNetEngineStatus
  nodes: ArtNetNode[]
  events: ArtNetNodeEvent[]
  onRefresh: () => Promise<void>
  onClearEvents: () => Promise<void>
}) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [healthFilter, setHealthFilter] = useState<HealthFilter>('all')
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (selectedNodeId && nodes.some((node) => node.id === selectedNodeId)) return
    setSelectedNodeId(nodes[0]?.id ?? null)
  }, [nodes, selectedNodeId])

  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null
  const filteredNodes = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return nodes.filter((node) => {
      if (healthFilter !== 'all' && node.health !== healthFilter) return false
      if (!normalized) return true

      return [
        node.longName,
        node.shortName,
        node.ip,
        node.mac ?? '',
        node.nodeReport,
        node.styleName
      ].some((value) => value.toLowerCase().includes(normalized))
    })
  }, [healthFilter, nodes, query])

  const selectedEvents = selectedNode
    ? events.filter((event) => event.nodeId === selectedNode.id)
    : []

  return (
    <div className="space-y-4 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Art-Net Nodes</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Monitor your ESP32 and other Art-Net devices, their health, port mapping and discovery history.
          </p>
        </div>
        <Button onClick={() => void onRefresh()}>
          <RefreshCw size={15} className="mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-5 gap-3">
        <SummaryCard label="Healthy" value={artnetStatus.healthyNodes} health="healthy" />
        <SummaryCard label="Stale" value={artnetStatus.staleNodes} health="stale" />
        <SummaryCard label="Offline" value={artnetStatus.offlineNodes} health="offline" />
        <SummaryCard label="Retained" value={artnetStatus.totalNodes} />
        <SummaryCard label="Events" value={events.length} />
      </div>

      <div className="grid min-h-[520px] grid-cols-[minmax(320px,0.9fr)_minmax(460px,1.5fr)] gap-4">
        <Card className="min-h-0 overflow-hidden">
          <CardHeader
            title="Node list"
            subtitle={`${filteredNodes.length} of ${nodes.length} devices shown`}
          />
          <div className="border-b border-zinc-800 p-3">
            <div className="flex gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-3">
                <Search size={14} className="shrink-0 text-zinc-500" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Name, IP, MAC, report…"
                  className="h-9 min-w-0 flex-1 bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
                />
              </div>
              <select
                value={healthFilter}
                onChange={(event) => setHealthFilter(event.target.value as HealthFilter)}
                className="h-9 rounded-md border border-zinc-800 bg-zinc-900 px-2 text-xs text-zinc-300 outline-none"
              >
                <option value="all">All</option>
                <option value="healthy">Healthy</option>
                <option value="stale">Stale</option>
                <option value="offline">Offline</option>
              </select>
            </div>
          </div>

          <div className="max-h-[620px] overflow-y-auto">
            {filteredNodes.length === 0 ? (
              <div className="p-5 text-sm text-zinc-500">
                {nodes.length === 0
                  ? 'No Art-Net nodes have been discovered yet.'
                  : 'No nodes match the current filter.'}
              </div>
            ) : (
              <div className="divide-y divide-zinc-900">
                {filteredNodes.map((node) => {
                  const selected = node.id === selectedNodeId
                  return (
                    <button
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`w-full px-4 py-3 text-left transition ${
                        selected ? 'bg-blue-500/8' : 'hover:bg-zinc-900/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <HealthDot health={node.health} />
                            <span className="truncate text-sm font-medium text-zinc-200">
                              {node.longName}
                            </span>
                          </div>
                          <div className="mt-1 truncate font-mono text-[11px] text-zinc-500">
                            {node.ip}{node.mac ? ` · ${node.mac}` : ''}
                          </div>
                        </div>
                        <HealthBadge health={node.health} />
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-zinc-600">
                        <span>{node.numPorts} port{node.numPorts === 1 ? '' : 's'}</span>
                        <span className="text-right">{node.responseCount} replies</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          {selectedNode ? (
            <>
              <NodeOverview node={selectedNode} />
              <PortMapping node={selectedNode} />
              <NodeEvents node={selectedNode} events={selectedEvents} />
            </>
          ) : (
            <Card className="grid min-h-[320px] place-items-center p-8 text-center">
              <div>
                <Cpu size={28} className="mx-auto text-zinc-600" />
                <div className="mt-3 text-sm font-medium text-zinc-300">No node selected</div>
                <div className="mt-1 text-xs text-zinc-500">
                  Start discovery from Network and select an Art-Net node here.
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <CardHeader
          title="Monitoring event history"
          subtitle="Engine and node events are kept in memory for this application session."
          action={
            <Button onClick={() => void onClearEvents()} disabled={events.length === 0}>
              <Eraser size={14} className="mr-2" />
              Clear history
            </Button>
          }
        />
        {events.length === 0 ? (
          <div className="p-5 text-sm text-zinc-500">No monitoring events recorded yet.</div>
        ) : (
          <div className="max-h-80 divide-y divide-zinc-900 overflow-y-auto">
            {events.map((event) => (
              <button
                key={event.id}
                onClick={() => event.nodeId && setSelectedNodeId(event.nodeId)}
                className="grid w-full grid-cols-[140px_130px_1fr] gap-4 px-4 py-3 text-left hover:bg-zinc-900/60"
              >
                <div className="font-mono text-[11px] text-zinc-500">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </div>
                <EventBadge type={event.type} severity={event.severity} />
                <div className="min-w-0">
                  <div className="text-xs text-zinc-300">{event.message}</div>
                  {event.details ? (
                    <div className="mt-1 truncate text-[10px] text-zinc-600">{event.details}</div>
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

function NodeOverview({ node }: { node: ArtNetNode }) {
  const ageMs = Math.max(0, Date.now() - node.lastSeenAt)

  return (
    <Card>
      <CardHeader
        title={node.longName}
        subtitle={`${node.shortName} · ${node.styleName}`}
        action={<HealthBadge health={node.health} />}
      />
      <div className="grid grid-cols-4 gap-3 p-4">
        <InfoBox label="IP address" value={node.ip} icon={Network} />
        <InfoBox label="MAC address" value={node.mac ?? 'Unavailable'} icon={Cpu} />
        <InfoBox label="Last reply" value={formatDuration(ageMs) + ' ago'} icon={Clock3} />
        <InfoBox label="Responses" value={String(node.responseCount)} icon={Activity} />
      </div>

      <div className="grid grid-cols-3 gap-x-6 gap-y-4 border-t border-zinc-900 p-4">
        <Detail label="Remote source" value={node.remoteAddress} />
        <Detail label="UDP port" value={String(node.port)} />
        <Detail label="Bind IP / index" value={`${node.bindIp ?? '—'} / ${node.bindIndex}`} />
        <Detail label="OEM code" value={`0x${node.oemCode.toString(16).padStart(4, '0').toUpperCase()}`} />
        <Detail label="Firmware" value={String(node.firmwareVersion)} />
        <Detail label="Style" value={node.styleName} />
        <Detail label="First seen" value={new Date(node.firstSeenAt).toLocaleString()} />
        <Detail label="Last changed" value={new Date(node.lastChangedAt).toLocaleString()} />
        <Detail label="Last seen" value={new Date(node.lastSeenAt).toLocaleString()} />
      </div>

      <div className="flex flex-wrap gap-2 border-t border-zinc-900 px-4 py-3">
        <Capability enabled label="Art-Net" icon={RadioTower} />
        <Capability enabled={node.rdmCapable} label="RDM" icon={ShieldCheck} />
        <Capability enabled={node.sacnCapable} label="sACN" icon={RadioTower} />
        <Capability enabled={node.numPorts > 0} label={`${node.numPorts} physical port${node.numPorts === 1 ? '' : 's'}`} icon={Unplug} />
      </div>

      {node.nodeReport ? (
        <div className="border-t border-zinc-900 p-4">
          <div className="text-[10px] uppercase tracking-[0.12em] text-zinc-600">Node report</div>
          <div className="mt-2 rounded-md border border-zinc-800 bg-zinc-900/50 p-3 font-mono text-xs text-zinc-400">
            {node.nodeReport}
          </div>
        </div>
      ) : null}
    </Card>
  )
}

function PortMapping({ node }: { node: ArtNetNode }) {
  return (
    <Card>
      <CardHeader
        title="Port / Universe mapping"
        subtitle="Art-Net Port-Addresses reported by this node"
      />
      {node.ports.length === 0 ? (
        <div className="p-4 text-sm text-zinc-500">This ArtPollReply reports no usable ports.</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 p-4">
          {node.ports.map((port) => (
            <PortCard key={port.index} port={port} />
          ))}
        </div>
      )}
    </Card>
  )
}

function PortCard({ port }: { port: ArtNetPort }) {
  const input = port.inputPortAddress === null ? null : decodePortAddress(port.inputPortAddress)
  const output = port.outputPortAddress === null ? null : decodePortAddress(port.outputPortAddress)

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-zinc-300">Port {port.index}</div>
        <div className="text-[10px] text-zinc-600">Protocol {port.protocol}</div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <PortDirection label="Input" enabled={port.canInput} address={input} />
        <PortDirection label="Output" enabled={port.canOutput} address={output} />
      </div>
    </div>
  )
}

function PortDirection({
  label,
  enabled,
  address
}: {
  label: string
  enabled: boolean
  address: ReturnType<typeof decodePortAddress> | null
}) {
  return (
    <div className={`rounded-md border p-2 ${
      enabled ? 'border-zinc-700 bg-zinc-950/70' : 'border-zinc-900 bg-zinc-950/30'
    }`}>
      <div className="text-[10px] uppercase text-zinc-600">{label}</div>
      {enabled && address ? (
        <>
          <div className="mt-1 font-mono text-sm text-zinc-200">{address.label}</div>
          <div className="mt-1 text-[10px] text-zinc-600">
            Net {address.net} · Sub {address.subNet} · Universe {address.universe}
          </div>
        </>
      ) : (
        <div className="mt-1 text-xs text-zinc-700">Not enabled</div>
      )}
    </div>
  )
}

function NodeEvents({ node, events }: { node: ArtNetNode; events: ArtNetNodeEvent[] }) {
  return (
    <Card>
      <CardHeader
        title="Device history"
        subtitle={`${events.length} recorded event${events.length === 1 ? '' : 's'} for ${node.shortName}`}
      />
      {events.length === 0 ? (
        <div className="p-4 text-sm text-zinc-500">No node-specific events have been recorded.</div>
      ) : (
        <div className="max-h-56 divide-y divide-zinc-900 overflow-y-auto">
          {events.slice(0, 20).map((event) => (
            <div key={event.id} className="flex gap-3 px-4 py-3">
              <EventIcon severity={event.severity} />
              <div className="min-w-0 flex-1">
                <div className="text-xs text-zinc-300">{event.message}</div>
                <div className="mt-1 text-[10px] text-zinc-600">
                  {new Date(event.timestamp).toLocaleString()}
                  {event.details ? ` · ${event.details}` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

function SummaryCard({
  label,
  value,
  health
}: {
  label: string
  value: number
  health?: ArtNetNodeHealth
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        {health ? <HealthDot health={health} /> : <StatusDot />}
        <div className="text-[10px] uppercase tracking-[0.12em] text-zinc-600">{label}</div>
      </div>
      <div className="mt-2 text-xl font-semibold text-zinc-100">{value}</div>
    </Card>
  )
}

function HealthDot({ health }: { health: ArtNetNodeHealth }) {
  return <StatusDot state={health === 'healthy' ? 'ok' : health === 'stale' ? 'warn' : 'idle'} />
}

function HealthBadge({ health }: { health: ArtNetNodeHealth }) {
  const classes =
    health === 'healthy'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
      : health === 'stale'
        ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
        : 'border-zinc-700 bg-zinc-900 text-zinc-500'

  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${classes}`}>
      {health}
    </span>
  )
}

function EventBadge({
  type,
  severity
}: {
  type: ArtNetNodeEvent['type']
  severity: ArtNetNodeEvent['severity']
}) {
  const classes =
    severity === 'error'
      ? 'border-red-500/30 bg-red-500/10 text-red-300'
      : severity === 'warning'
        ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
        : 'border-blue-500/20 bg-blue-500/5 text-blue-300'

  return (
    <span className={`w-fit rounded border px-2 py-1 text-[9px] uppercase tracking-wide ${classes}`}>
      {type.replaceAll('-', ' ')}
    </span>
  )
}

function EventIcon({ severity }: { severity: ArtNetNodeEvent['severity'] }) {
  if (severity === 'error') return <WifiOff size={14} className="mt-0.5 shrink-0 text-red-400" />
  if (severity === 'warning') return <WifiOff size={14} className="mt-0.5 shrink-0 text-amber-400" />
  return <Activity size={14} className="mt-0.5 shrink-0 text-blue-400" />
}

function InfoBox({
  label,
  value,
  icon: Icon
}: {
  label: string
  value: string
  icon: typeof Cpu
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-zinc-600">
        <Icon size={12} /> {label}
      </div>
      <div className="mt-2 break-all font-mono text-xs text-zinc-200">{value}</div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.12em] text-zinc-600">{label}</div>
      <div className="mt-1 break-all font-mono text-xs text-zinc-300">{value}</div>
    </div>
  )
}

function Capability({
  enabled,
  label,
  icon: Icon
}: {
  enabled: boolean
  label: string
  icon: typeof RadioTower
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] ${
      enabled
        ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300'
        : 'border-zinc-800 bg-zinc-900 text-zinc-600'
    }`}>
      <Icon size={11} /> {label}
    </span>
  )
}

function decodePortAddress(address: number) {
  const net = (address >> 8) & 0x7f
  const subNet = (address >> 4) & 0x0f
  const universe = address & 0x0f
  return {
    net,
    subNet,
    universe,
    label: `${net}:${subNet}:${universe}`
  }
}

function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) return `${milliseconds} ms`
  const seconds = milliseconds / 1000
  if (seconds < 60) return `${seconds.toFixed(seconds < 10 ? 1 : 0)} s`
  const minutes = Math.floor(seconds / 60)
  return `${minutes} min`
}
