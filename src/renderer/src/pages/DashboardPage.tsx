import { CheckCircle2, CircleDashed, Database, LockKeyhole, Network, RadioTower, ServerCog } from 'lucide-react'
import type { AppInfo } from '../../../shared/types'
import { Card, CardHeader } from '../components/ui/Card'

const checks = [
  ['Persistent universes', 'Universe definitions and 512-channel buffers are stored under Electron userData.'],
  ['15-bit Port-Address', 'Net, Sub-Net and Universe are combined into a validated Art-Net Port-Address.'],
  ['ESP32 assignment', 'Unicast universes can be assigned to discovered Art-Net nodes such as the ESP32.'],
  ['Safety lock', 'Universe configuration can be enabled, but ArtDmx serialization and transmission remain absent.']
]

export function DashboardPage({ info }: { info: AppInfo | null }) {
  return (
    <div className="space-y-4 p-5">
      <div>
        <h2 className="text-xl font-semibold">Universe Engine</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Phase 5 manages Art-Net universe configuration and 512-channel buffers without transmitting physical DMX data.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Metric icon={ServerCog} label="Application" value="Desktop Ready" detail={info ? `v${info.version}` : 'Starting…'} />
        <Metric icon={LockKeyhole} label="Security" value="Isolated" detail="Restricted IPC bridge" />
        <Metric icon={Network} label="Discovery" value="UDP 6454" detail="ESP32 / Art-Net nodes" />
        <Metric icon={Database} label="Universes" value="Phase 5" detail="512 channels each" />
      </div>

      <div className="grid grid-cols-[1.4fr_1fr] gap-4">
        <Card>
          <CardHeader title="Phase 5 capabilities" subtitle="Universe configuration and persistent channel buffers" />
          <div className="divide-y divide-zinc-900">
            {checks.map(([title, description]) => (
              <div key={title} className="flex items-start gap-3 px-4 py-3">
                <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-400" />
                <div>
                  <div className="text-sm text-zinc-200">{title}</div>
                  <div className="mt-0.5 text-xs text-zinc-500">{description}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Next milestone" subtitle="Phase 6 — Realtime DMX Output Engine" />
          <div className="space-y-3 p-4 text-sm text-zinc-400">
            {[
              'ArtDmx packet serializer',
              'Worker-thread refresh loop',
              'Configurable output frame rate',
              'Explicit Output Enable and Blackout safeguards'
            ].map((item) => (
              <div key={item} className="flex gap-2">
                <CircleDashed size={15} className="mt-0.5 shrink-0 text-blue-400" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Output safety"
          subtitle="Enabled universes are configuration-ready only. ArtDmx remains physically locked in Phase 5."
        />
        <div className="grid grid-cols-3 gap-3 p-4">
          <SafetyItem title="Universe buffers" value="Enabled" />
          <SafetyItem title="ESP32 assignment" value="Enabled" />
          <SafetyItem title="ArtDmx" value="Locked" />
        </div>
      </Card>
    </div>
  )
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof RadioTower; label: string; value: string; detail: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">{label}</p>
          <p className="mt-2 text-lg font-semibold">{value}</p>
          <p className="mt-1 text-xs text-zinc-500">{detail}</p>
        </div>
        <Icon size={18} className="text-zinc-500" />
      </div>
    </Card>
  )
}

function SafetyItem({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-3">
      <div className="text-xs text-zinc-500">{title}</div>
      <div className="mt-1 text-sm font-medium text-zinc-200">{value}</div>
    </div>
  )
}
