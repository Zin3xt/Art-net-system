import { CheckCircle2, CircleDashed, HardDrive, LockKeyhole, RadioTower, ServerCog } from 'lucide-react'
import type { AppInfo } from '../../../shared/types'
import { Card, CardHeader } from '../components/ui/Card'

const checks = [
  ['Secure preload bridge', 'Renderer has no direct Node.js access.'],
  ['Context isolation', 'Electron APIs stay outside the renderer context.'],
  ['Local settings service', 'Application preferences persist under userData.'],
  ['Local log service', 'Main/renderer events can be written to a local log file.']
]

export function DashboardPage({ info }: { info: AppInfo | null }) {
  return (
    <div className="space-y-4 p-5">
      <div>
        <h2 className="text-xl font-semibold">System Foundation</h2>
        <p className="mt-1 text-sm text-zinc-500">Phase 1 establishes the desktop shell before any physical lighting output is enabled.</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Metric icon={ServerCog} label="Application" value="Desktop Ready" detail={info ? `v${info.version}` : 'Starting…'} />
        <Metric icon={LockKeyhole} label="Security" value="Isolated" detail="Restricted bridge" />
        <Metric icon={RadioTower} label="Art-Net" value="Not Active" detail="Scheduled Phase 3" />
        <Metric icon={HardDrive} label="Storage" value="Local" detail="Settings + logs" />
      </div>

      <div className="grid grid-cols-[1.4fr_1fr] gap-4">
        <Card>
          <CardHeader title="Phase 1 checks" subtitle="Foundation components currently included" />
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
          <CardHeader title="Next milestone" subtitle="Phase 2 — Network Interface Management" />
          <div className="space-y-3 p-4 text-sm text-zinc-400">
            {['Enumerate Ethernet and Wi-Fi adapters', 'Choose the Art-Net NIC', 'Show IP, subnet and broadcast information', 'Detect interface changes'].map((item) => (
              <div key={item} className="flex gap-2">
                <CircleDashed size={15} className="mt-0.5 shrink-0 text-blue-400" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Output safety" subtitle="Physical lighting output remains intentionally unavailable in Phase 1" />
        <div className="grid grid-cols-3 gap-3 p-4">
          <SafetyItem title="Startup output" value="Disabled" />
          <SafetyItem title="Blackout" value="Reserved" />
          <SafetyItem title="UDP / 6454" value="Not opened" />
        </div>
      </Card>
    </div>
  )
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof ServerCog; label: string; value: string; detail: string }) {
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
