import { Ban, ShieldCheck } from 'lucide-react'
import type { ArtNetEngineStatus, DmxOutputStatus } from '../../../shared/types'
import { StatusDot } from './ui/StatusDot'

export function TopBar({
  artnetStatus,
  outputStatus
}: {
  artnetStatus: ArtNetEngineStatus
  outputStatus: DmxOutputStatus
}) {
  const artnet =
    artnetStatus.state === 'running'
      ? { label: 'Art-Net live', dot: 'ok' as const }
      : artnetStatus.state === 'starting'
        ? { label: 'Art-Net starting', dot: 'warn' as const }
        : artnetStatus.state === 'error'
          ? { label: 'Art-Net error', dot: 'warn' as const }
          : { label: 'Art-Net stopped', dot: 'idle' as const }

  return (
    <header className="flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-950/70 px-5">
      <div>
        <h1 className="text-sm font-semibold">Art-Net Lighting Control System</h1>
        <p className="text-[11px] text-zinc-500">Phase 7 · Raw DMX Tester</p>
      </div>
      <div className="flex items-center gap-3">
        {outputStatus.blackout ? (
          <div className="flex items-center gap-2 rounded-md border border-red-500/50 bg-red-500/15 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-red-200">
            <Ban size={13} /> BLACKOUT
          </div>
        ) : outputStatus.outputEnabled ? (
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
            OUTPUT LIVE
          </div>
        ) : (
          <div className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            OUTPUT DISABLED
          </div>
        )}
        <div className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs text-zinc-400">
          <ShieldCheck size={14} className="text-emerald-400" /> Secure IPC
        </div>
        <div className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs text-zinc-400">
          <StatusDot state={artnet.dot} /> {artnet.label}
        </div>
      </div>
    </header>
  )
}
