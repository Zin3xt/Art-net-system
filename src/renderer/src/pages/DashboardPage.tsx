import { CheckCircle2, CircleDashed, HardDrive, LockKeyhole, Network, RadioTower, ServerCog } from 'lucide-react'
import type { AppInfo } from '../../../shared/types'
import { Card, CardHeader } from '../components/ui/Card'

const checks = [
  ['Secure desktop bridge', 'Renderer remains isolated from direct Node.js access.'],
  ['Network adapter discovery', 'Native Electron service enumerates IPv4 interfaces.'],
  ['Subnet and broadcast data', 'Art-Net-ready addressing is calculated for each IPv4 adapter.'],
  ['Preferred NIC persistence', 'The chosen interface is stored for the future Art-Net engine.']
]

export function DashboardPage({ info }: { info: AppInfo | null }) {
  return (
    <div className="space-y-4 p-5">
      <div>
        <h2 className="text-xl font-semibold">System Foundation</h2>
        <p className="mt-1 text-sm text-zinc-500">Phase 2 adds safe network-interface management while physical lighting output remains disabled.</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Metric icon={ServerCog} label="Application" value="Desktop Ready" detail={info ? `v${info.version}` : 'Starting…'} />
        <Metric icon={LockKeyhole} label="Security" value="Isolated" detail="Restricted bridge" />
        <Metric icon={Network} label="Networking" value="Phase 2" detail="NIC discovery ready" />
        <Metric icon={RadioTower} label="Art-Net" value="Not Active" detail="Phase 3" />
      </div>

      <div className="grid grid-cols-[1.4fr_1fr] gap-4">
        <Card>
          <CardHeader title="Phase 2 capabilities" subtitle="Network layer implemented before UDP output" />
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
          <CardHeader title="Next milestone" subtitle="Phase 3 — Art-Net Core Engine" />
          <div className="space-y-3 p-4 text-sm text-zinc-400">
            {['Bind UDP to the selected Art-Net NIC', 'Open Art-Net port 6454 safely', 'Send ArtPoll discovery packets', 'Parse and validate ArtPollReply packets'].map((item) => (
              <div key={item} className="flex gap-2">
                <CircleDashed size={15} className="mt-0.5 shrink-0 text-blue-400" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Output safety" subtitle="Phase 2 performs network inspection only; it sends no Art-Net packets." />
        <div className="grid grid-cols-3 gap-3 p-4">
          <SafetyItem title="Startup output" value="Disabled" />
          <SafetyItem title="UDP / 6454" value="Not opened" />
          <SafetyItem title="DMX output" value="Not implemented" />
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
