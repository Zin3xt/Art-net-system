import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  CircleOff,
  Power,
  RefreshCw,
  Send,
  ShieldAlert,
  SquareActivity
} from 'lucide-react'
import type {
  DmxOutputStatus,
  DmxUniverseRouteStatus,
  UniverseDefinition
} from '../../../shared/types'
import { Button } from '../components/ui/Button'
import { Card, CardHeader } from '../components/ui/Card'
import { StatusDot } from '../components/ui/StatusDot'

export function OutputPage({
  outputStatus,
  routes,
  universes,
  onRefresh
}: {
  outputStatus: DmxOutputStatus
  routes: DmxUniverseRouteStatus[]
  universes: UniverseDefinition[]
  onRefresh: () => Promise<void>
}) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [testUniverseId, setTestUniverseId] = useState('')
  const [testChannel, setTestChannel] = useState(1)
  const [testValue, setTestValue] = useState(0)

  const outputActive = outputStatus.outputEnabled
  const eligibleRoutes = routes.filter((route) => route.eligible)
  const selectedUniverse = useMemo(
    () => universes.find((universe) => universe.id === testUniverseId) ?? null,
    [testUniverseId, universes]
  )

  async function enableOutput() {
    const confirmed = window.confirm(
      'ENABLE LIVE DMX OUTPUT?\n\nArtDmx will be transmitted to eligible subscribed Art-Net nodes. Verify the correct ESP32, universe and fixtures before continuing.'
    )
    if (!confirmed) return

    setBusy('enable')
    setError(null)
    try {
      await window.artnetDesktop.output.enable()
      await onRefresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to enable DMX output.')
      await onRefresh()
    } finally {
      setBusy(null)
    }
  }

  async function disableOutput() {
    setBusy('disable')
    setError(null)
    try {
      await window.artnetDesktop.output.disable()
      await onRefresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to disable DMX output.')
    } finally {
      setBusy(null)
    }
  }

  async function blackoutOn() {
    setBusy('blackout')
    setError(null)
    try {
      await window.artnetDesktop.output.blackoutOn()
      await onRefresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to activate Blackout.')
    } finally {
      setBusy(null)
    }
  }

  async function blackoutOff() {
    setBusy('blackout')
    setError(null)
    try {
      await window.artnetDesktop.output.blackoutOff()
      await onRefresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to release Blackout.')
    } finally {
      setBusy(null)
    }
  }

  async function applyDiagnosticChannel() {
    if (!selectedUniverse) {
      setError('Select a universe for the diagnostic channel test.')
      return
    }

    setBusy('test')
    setError(null)
    try {
      await window.artnetDesktop.universes.setChannel({
        universeId: selectedUniverse.id,
        channel: testChannel,
        value: testValue
      })
      await onRefresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update diagnostic channel.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Realtime DMX Output</h2>
          <p className="mt-1 text-sm text-zinc-500">
            ArtDmx output to subscribed ESP32 / Art-Net nodes with explicit enable and Blackout safeguards.
          </p>
        </div>
        <Button onClick={() => void onRefresh()}>
          <RefreshCw size={15} className="mr-2" />
          Refresh
        </Button>
      </div>

      {error ? (
        <Card className="border-red-500/30 bg-red-500/5 p-4 text-sm text-red-300">
          {error}
        </Card>
      ) : null}

      {outputStatus.lastError ? (
        <Card className="border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200">
          Output engine: {outputStatus.lastError}
        </Card>
      ) : null}

      <Card className={outputStatus.blackout ? 'border-red-500/40' : outputActive ? 'border-emerald-500/30' : ''}>
        <CardHeader
          title="Master output"
          subtitle="Output always starts disabled after application launch."
          action={<OutputStateBadge status={outputStatus} />}
        />
        <div className="grid grid-cols-[1fr_auto] gap-6 p-4">
          <div className="grid grid-cols-6 gap-3">
            <Metric label="State" value={outputStatus.state} />
            <Metric label="Scheduler" value={`${outputStatus.tickHz} Hz`} />
            <Metric label="Keepalive" value={`${outputStatus.keepAliveMs} ms`} />
            <Metric label="Eligible" value={String(outputStatus.universesTransmitted)} />
            <Metric label="Blocked" value={String(outputStatus.universesBlocked)} />
            <Metric label="ArtDmx TX" value={String(outputStatus.packetsSent)} />
          </div>

          <div className="flex min-w-52 flex-col gap-2">
            {!outputActive ? (
              <Button
                onClick={() => void enableOutput()}
                disabled={busy !== null || eligibleRoutes.length === 0}
                className="h-11 border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
              >
                <Power size={16} className="mr-2" />
                {busy === 'enable' ? 'Enabling…' : 'ENABLE OUTPUT'}
              </Button>
            ) : (
              <Button
                onClick={() => void disableOutput()}
                disabled={busy !== null}
                className="h-11 border-zinc-600"
              >
                <CircleOff size={16} className="mr-2" />
                {busy === 'disable' ? 'Disabling…' : 'Disable output'}
              </Button>
            )}

            {outputStatus.blackout ? (
              <Button
                onClick={() => void blackoutOff()}
                disabled={busy !== null}
                className="h-12 border-red-500 bg-red-500/20 text-red-200 hover:bg-red-500/30"
              >
                <Ban size={17} className="mr-2" />
                RELEASE BLACKOUT
              </Button>
            ) : (
              <Button
                onClick={() => void blackoutOn()}
                disabled={!outputActive || busy !== null}
                className="h-12 border-red-500/50 bg-red-500/10 text-red-300 hover:bg-red-500/20"
              >
                <Ban size={17} className="mr-2" />
                BLACKOUT
              </Button>
            )}
          </div>
        </div>

        <div className="border-t border-zinc-900 px-4 py-3 text-xs text-zinc-500">
          Normal output sends changed frames immediately and unchanged keepalives approximately every 900 ms.
          Blackout repeatedly sends zero frames every 100 ms. Disabling output sends a short three-frame zero burst first.
        </div>
      </Card>

      <Card className="border-blue-500/20 bg-blue-500/[0.03]">
        <div className="flex gap-3 p-4">
          <ShieldAlert size={18} className="mt-0.5 shrink-0 text-blue-300" />
          <div className="text-xs leading-5 text-zinc-400">
            <span className="font-medium text-blue-200">Art-Net 4 compliance:</span>{' '}
            live ArtDmx is unicast only. A target must be healthy and advertise this universe in its
            ArtPollReply SwIn/SwOut subscription. Phase 5 broadcast universe configurations are deliberately
            blocked from live output.
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Universe routes"
          subtitle={`${eligibleRoutes.length} eligible route${eligibleRoutes.length === 1 ? '' : 's'} · ${routes.length} configured`}
        />
        {routes.length === 0 ? (
          <div className="p-5 text-sm text-zinc-500">No universes are configured.</div>
        ) : (
          <div className="divide-y divide-zinc-900">
            {routes.map((route) => (
              <div
                key={route.universeId}
                className="grid grid-cols-[1.2fr_0.8fr_1fr_0.8fr_1.4fr] items-center gap-4 px-4 py-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <StatusDot state={route.eligible ? 'ok' : route.enabled ? 'warn' : 'idle'} />
                    <span className="text-sm font-medium text-zinc-200">{route.universeName}</span>
                  </div>
                  <div className="mt-1 font-mono text-[11px] text-zinc-600">
                    Port-Address {formatPortAddress(route.portAddress)}
                  </div>
                </div>

                <div>
                  <Label>Subscription</Label>
                  <div className={`mt-1 text-xs ${route.subscribed ? 'text-emerald-300' : 'text-zinc-500'}`}>
                    {route.subscribed ? 'Subscribed' : 'Not subscribed'}
                  </div>
                </div>

                <div>
                  <Label>Target</Label>
                  <div className="mt-1 truncate text-xs text-zinc-300">{route.targetNodeName ?? '—'}</div>
                  <div className="mt-1 font-mono text-[10px] text-zinc-600">{route.targetIp ?? '—'}</div>
                </div>

                <div>
                  <Label>Frames</Label>
                  <div className="mt-1 text-xs text-zinc-300">{route.framesSent}</div>
                  <div className="mt-1 text-[10px] text-zinc-600">Seq {route.sequence || '—'}</div>
                </div>

                <div className="text-right">
                  {route.eligible ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-300">
                      <CheckCircle2 size={11} /> Ready for ArtDmx
                    </span>
                  ) : (
                    <span
                      className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] text-amber-300"
                      title={route.reason ?? undefined}
                    >
                      <AlertTriangle size={11} />
                      <span className="truncate">{route.reason ?? 'Blocked'}</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Single-channel hardware test"
          subtitle="Diagnostic control for Phase 6 verification only. Full 512-channel control is Phase 7."
        />
        <div className="grid grid-cols-[1.3fr_0.6fr_0.6fr_auto] items-end gap-3 p-4">
          <Field label="Universe">
            <select
              value={testUniverseId}
              onChange={(event) => setTestUniverseId(event.target.value)}
              className={inputClass}
            >
              <option value="">Select universe</option>
              {universes.map((universe) => (
                <option key={universe.id} value={universe.id}>
                  {universe.name} — {universe.net}:{universe.subNet}:{universe.universe}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Channel 1–512">
            <input
              type="number"
              min={1}
              max={512}
              value={testChannel}
              onChange={(event) => setTestChannel(clamp(Number(event.target.value), 1, 512))}
              className={inputClass}
            />
          </Field>

          <Field label="Value 0–255">
            <input
              type="number"
              min={0}
              max={255}
              value={testValue}
              onChange={(event) => setTestValue(clamp(Number(event.target.value), 0, 255))}
              className={inputClass}
            />
          </Field>

          <Button onClick={() => void applyDiagnosticChannel()} disabled={busy !== null || !selectedUniverse}>
            <Send size={14} className="mr-2" />
            {busy === 'test' ? 'Applying…' : 'Apply'}
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader title="Safety behavior" subtitle="Phase 6 failure and shutdown policy" />
        <div className="grid grid-cols-4 gap-3 p-4">
          <Safety icon={Power} title="Startup" value="Output disabled" />
          <Safety icon={Ban} title="Blackout" value="Repeated zero frames" />
          <Safety icon={SquareActivity} title="Send errors" value="Stop after 3" />
          <Safety icon={CircleOff} title="App shutdown" value="Zero burst then stop" />
        </div>
      </Card>
    </div>
  )
}

function OutputStateBadge({ status }: { status: DmxOutputStatus }) {
  if (status.blackout) {
    return <span className="rounded-full border border-red-500/40 bg-red-500/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-red-200">BLACKOUT</span>
  }
  if (status.outputEnabled) {
    return <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">OUTPUT LIVE</span>
  }
  if (status.state === 'error') {
    return <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-300">OUTPUT ERROR</span>
  }
  return <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">OUTPUT DISABLED</span>
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
      <Label>{label}</Label>
      <div className="mt-2 truncate font-mono text-xs text-zinc-200">{value}</div>
    </div>
  )
}

function Safety({
  icon: Icon,
  title,
  value
}: {
  icon: typeof Power
  title: string
  value: string
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Icon size={13} /> {title}
      </div>
      <div className="mt-2 text-sm text-zinc-200">{value}</div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] uppercase tracking-[0.12em] text-zinc-600">{children}</div>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <div className="mt-1.5">{children}</div>
    </label>
  )
}

function formatPortAddress(address: number): string {
  return `${(address >> 8) & 0x7f}:${(address >> 4) & 0x0f}:${address & 0x0f}`
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.max(min, Math.min(max, Math.trunc(value)))
}

const inputClass =
  'h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-200 outline-none focus:border-blue-500'
