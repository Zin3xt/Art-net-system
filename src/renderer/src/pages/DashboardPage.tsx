import { CheckCircle2, CircleDashed, Cpu, LockKeyhole, Network, RadioTower, ServerCog } from 'lucide-react'
import type { AppInfo } from '../../../shared/types'
import { Card, CardHeader } from '../components/ui/Card'

const checks = [
  ['Node health monitoring', 'Healthy, stale and offline states are derived from ArtPollReply timing.'],
  ['ESP32 monitoring', 'Response count, first/last seen and recovery state are tracked per device.'],
  ['Change detection', 'Name, firmware, capabilities, reports and port mappings are monitored for changes.'],
  ['Event history', 'Discovery, recovery, offline, changes and engine events are retained for the session.']
]

export function DashboardPage({ info }: { info: AppInfo | null }) {
  return (
    <div className="space-y-4 p-5">
      <div>
        <h2 className="text-xl font-semibold">Art-Net Node Monitoring</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Phase 4 adds live Art-Net device health and history while keeping physical DMX output disabled.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Metric icon={ServerCog} label="Application" value="Desktop Ready" detail={info ? `v${info.version}` : 'Starting…'} />
        <Metric icon={LockKeyhole} label="Security" value="Isolated" detail="Restricted IPC bridge" />
        <Metric icon={Network} label="Discovery" value="UDP 6454" detail="ArtPoll / ArtPollReply" />
        <Metric icon={Cpu} label="Monitoring" value="Phase 4" detail="ESP32 / Art-Net nodes" />
      </div>

      <div className="grid grid-cols-[1.4fr_1fr] gap-4">
        <Card>
          <CardHeader title="Phase 4 capabilities" subtitle="Device health, details and monitoring history" />
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
          <CardHeader title="Next milestone" subtitle="Phase 5 — Universe Engine" />
          <div className="space-y-3 p-4 text-sm text-zinc-400">
            {[
              'Create and manage Art-Net universes',
              'Maintain 512-channel universe buffers',
              'Assign Port-Addresses and node destinations',
              'Add explicit universe enable / disable state'
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
          subtitle="Phase 4 monitors Art-Net devices only. Fixture/channel data is not transmitted."
        />
        <div className="grid grid-cols-3 gap-3 p-4">
          <SafetyItem title="ArtPoll" value="Enabled on demand" />
          <SafetyItem title="Node monitoring" value="Enabled" />
          <SafetyItem title="ArtDmx" value="Disabled" />
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
