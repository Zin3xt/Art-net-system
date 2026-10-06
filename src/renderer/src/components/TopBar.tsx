import { ShieldCheck } from 'lucide-react'
import type { ArtNetEngineStatus } from '../../../shared/types'
import { StatusDot } from './ui/StatusDot'

export function TopBar({ artnetStatus }: { artnetStatus: ArtNetEngineStatus }) {
  const status =
    artnetStatus.state === 'running'
      ? { label: 'Art-Net monitoring live', dot: 'ok' as const }
      : artnetStatus.state === 'starting'
        ? { label: 'Art-Net starting', dot: 'warn' as const }
        : artnetStatus.state === 'error'
          ? { label: 'Art-Net error', dot: 'warn' as const }
          : { label: 'Art-Net monitoring stopped', dot: 'idle' as const }

  return (
    <header className="flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-950/70 px-5">
      <div>
        <h1 className="text-sm font-semibold">Art-Net Lighting Control System</h1>
        <p className="text-[11px] text-zinc-500">Phase 5 · Universe Engine</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="rounded-md border border-blue-500/20 bg-blue-500/5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide text-blue-300">
          ArtDmx locked
        </div>
        <div className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs text-zinc-400">
          <ShieldCheck size={14} className="text-emerald-400" /> Secure IPC
        </div>
        <div className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs text-zinc-400">
          <StatusDot state={status.dot} /> {status.label}
        </div>
      </div>
    </header>
  )
}
