import type { AppInfo } from '../../../shared/types'
import { StatusDot } from './ui/StatusDot'

export function StatusBar({ info, ipcOk }: { info: AppInfo | null; ipcOk: boolean }) {
  return (
    <footer className="flex h-7 items-center justify-between border-t border-zinc-800 bg-zinc-950 px-4 text-[10px] text-zinc-500">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5"><StatusDot state={ipcOk ? 'ok' : 'warn'} /> IPC {ipcOk ? 'ready' : 'unavailable'}</span>
        <span>OUTPUT DISABLED</span>
        <span>UNIVERSES 0</span>
        <span>NODES 0</span>
      </div>
      <div>{info ? `v${info.version} · Electron ${info.electron} · ${info.platform}` : 'Loading runtime info…'}</div>
    </footer>
  )
}
