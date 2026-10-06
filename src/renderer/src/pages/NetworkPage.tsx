import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, CircleOff, EthernetPort, RefreshCw, Router, Wifi } from 'lucide-react'
import type { AppSettings, NetworkAdapter } from '../../../shared/types'
import { Button } from '../components/ui/Button'
import { Card, CardHeader } from '../components/ui/Card'
import { StatusDot } from '../components/ui/StatusDot'

const REFRESH_MS = 2500

function AdapterIcon({ adapter }: { adapter: NetworkAdapter }) {
  if (adapter.type === 'wifi') return <Wifi size={18} />
  if (adapter.type === 'ethernet') return <EthernetPort size={18} />
  return <Router size={18} />
}

export function NetworkPage() {
  const [adapters, setAdapters] = useState<NetworkAdapter[]>([])
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  const usable = useMemo(() => adapters.filter((adapter) => adapter.usableForArtNet), [adapters])
  const selected = useMemo(
    () => adapters.find((adapter) => adapter.name === settings?.preferredNetworkInterface) ?? null,
    [adapters, settings?.preferredNetworkInterface]
  )

  async function selectAdapter(adapter: NetworkAdapter) {
    if (!settings || !adapter.usableForArtNet) return
    const next = { ...settings, preferredNetworkInterface: adapter.name }
    const saved = await window.artnetDesktop.settings.save(next)
    setSettings(saved)
    await window.artnetDesktop.log.info(`Selected Art-Net network interface: ${adapter.name}`)
  }

  async function clearSelection() {
    if (!settings) return
    const saved = await window.artnetDesktop.settings.save({ ...settings, preferredNetworkInterface: null })
    setSettings(saved)
  }

  return (
    <div className="space-y-4 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Network Interfaces</h2>
          <p className="mt-1 text-sm text-zinc-500">Choose the IPv4 adapter that Phase 3 will use for Art-Net UDP traffic.</p>
        </div>
        <Button onClick={() => void refresh(true)} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'mr-2 animate-spin' : 'mr-2'} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Summary label="IPv4 interfaces" value={String(adapters.length)} />
        <Summary label="Art-Net usable" value={String(usable.length)} />
        <Summary label="Selected interface" value={selected?.name ?? 'Not selected'} />
      </div>

      {error ? (
        <Card className="border-red-500/30 bg-red-500/5 p-4 text-sm text-red-300">{error}</Card>
      ) : null}

      <Card>
        <CardHeader
          title="Detected adapters"
          subtitle={lastUpdated ? `Auto-refresh every 2.5 seconds · Last checked ${lastUpdated.toLocaleTimeString()}` : 'Reading adapters…'}
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
              <div key={adapter.id} className="grid grid-cols-[minmax(180px,1.3fr)_1fr_1fr_auto] items-center gap-4 px-4 py-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border ${
                    isSelected ? 'border-blue-500/40 bg-blue-500/10 text-blue-300' : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                  }`}>
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
                <Info label="Subnet / Broadcast" value={adapter.netmask} secondary={adapter.broadcast ?? 'Unavailable'} />

                <div className="flex justify-end">
                  {isSelected ? (
                    <Button onClick={() => void clearSelection()} className="min-w-28">Clear</Button>
                  ) : (
                    <Button
                      onClick={() => void selectAdapter(adapter)}
                      disabled={!adapter.usableForArtNet}
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
        <CardHeader title="Selected Art-Net interface" subtitle="Phase 3 will bind the Art-Net engine to this adapter." />
        {selected ? (
          <div className="grid grid-cols-4 gap-3 p-4">
            <InfoBox label="Interface" value={selected.name} />
            <InfoBox label="IPv4 address" value={selected.address} />
            <InfoBox label="Subnet mask" value={selected.netmask} />
            <InfoBox label="Broadcast" value={selected.broadcast ?? 'Unavailable'} />
          </div>
        ) : (
          <div className="p-4 text-sm text-amber-300">Select a non-loopback IPv4 interface before starting the Art-Net engine in Phase 3.</div>
        )}
      </Card>
    </div>
  )
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">{label}</div>
      <div className="mt-2 truncate text-lg font-semibold text-zinc-100">{value}</div>
    </Card>
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
