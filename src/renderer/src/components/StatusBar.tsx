import type { AppInfo, ArtNetEngineStatus, DmxOutputStatus } from '../../../shared/types'
import { StatusDot } from './ui/StatusDot'

export function StatusBar({
  info,
  ipcOk,
  artnetStatus,
  outputStatus
}: {
  info: AppInfo | null
  ipcOk: boolean
  artnetStatus: ArtNetEngineStatus
  outputStatus: DmxOutputStatus
}) {
  return (
    <footer className="flex h-7 items-center justify-between border-t border-zinc-800 bg-zinc-950 px-4 text-[10px] text-zinc-500">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <StatusDot state={ipcOk ? 'ok' : 'warn'} /> IPC {ipcOk ? 'ready' : 'unavailable'}
        </span>
        <span className={outputStatus.blackout ? 'text-red-300' : outputStatus.outputEnabled ? 'text-emerald-300' : ''}>
          {outputStatus.blackout ? 'BLACKOUT ACTIVE' : outputStatus.outputEnabled ? 'DMX OUTPUT LIVE' : 'DMX OUTPUT DISABLED'}
        </span>
        <span>UDP {artnetStatus.state === 'running' ? '6454 LIVE' : 'OFF'}</span>
        <span>ROUTES {outputStatus.universesTransmitted}/{outputStatus.universesTransmitted + outputStatus.universesBlocked}</span>
        <span>DMX TX {outputStatus.packetsSent}</span>
        <span>H {artnetStatus.healthyNodes}</span>
        <span>S {artnetStatus.staleNodes}</span>
        <span>O {artnetStatus.offlineNodes}</span>
      </div>
      <div>{info ? `v${info.version} · Electron ${info.electron} · ${info.platform}` : 'Loading runtime info…'}</div>
    </footer>
  )
}
