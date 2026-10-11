import { CheckCircle2, CircleDashed, LockKeyhole, Network, RadioTower, ServerCog } from 'lucide-react'
import type { AppInfo } from '../../../shared/types'
import { Card, CardHeader } from '../components/ui/Card'

const checks = [
  ['512-channel control', 'All DMX channels are available through banked faders and a complete universe overview.'],
  ['Operator selection tools', 'Single, Ctrl/Cmd multi-select, Shift ranges, search, quick values and batch edits are supported.'],
  ['Persistent metadata', 'Channel labels and locks are stored with the universe and survive application restarts.'],
  ['Non-destructive master', 'The 0–100% master scales transmitted ArtDmx without rewriting stored channel values.']
]

export function DashboardPage({ info }: { info: AppInfo | null }) {
  return (
    <div className="space-y-4 p-5">
      <div>
        <h2 className="text-xl font-semibold">Raw DMX Tester</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Phase 7 adds direct operator control of all 512 DMX channels while preserving the Phase 6 output safeguards.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Metric icon={ServerCog} label="Application" value="Desktop Ready" detail={info ? `v${info.version}` : 'Starting…'} />
        <Metric icon={LockKeyhole} label="Startup safety" value="Output OFF" detail="Explicit enable required" />
        <Metric icon={Network} label="Art-Net" value="UDP 6454" detail="Discovery + unicast ArtDmx" />
        <Metric icon={RadioTower} label="Raw control" value="Phase 7" detail="512-channel tester" />
      </div>

      <div className="grid grid-cols-[1.4fr_1fr] gap-4">
        <Card>
          <CardHeader title="Phase 7 capabilities" subtitle="Direct channel control with persistent operator metadata" />
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
          <CardHeader title="Next milestone" subtitle="Phase 8 — Output Safety & Recovery Hardening" />
          <div className="space-y-3 p-4 text-sm text-zinc-400">
            {[
              'Output watchdog and reconnect recovery',
              'ESP32 disconnect / reconnect hardening',
              'Emergency-stop and blackout recovery policy',
              'Long-run packet / timing validation'
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
          title="Raw DMX safety policy"
          subtitle="Direct channel control never bypasses the Phase 6 ArtDmx routing and safety engine."
        />
        <div className="grid grid-cols-3 gap-3 p-4">
          <SafetyItem title="Channel locks" value="Server-enforced" />
          <SafetyItem title="Master" value="Runtime 0–100% scale" />
          <SafetyItem title="Blackout" value="Always available while output is live" />
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
