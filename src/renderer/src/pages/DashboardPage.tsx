import { CheckCircle2, CircleDashed, LockKeyhole, Network, RadioTower, ServerCog } from 'lucide-react'
import type { AppInfo } from '../../../shared/types'
import { Card, CardHeader } from '../components/ui/Card'

const checks = [
  ['UDP lifecycle', 'Discovery binds UDP 6454 only after an Art-Net NIC is selected.'],
  ['ArtPoll encoder', 'Protocol version 14 discovery packets are broadcast automatically.'],
  ['ArtPollReply parser', 'Node identity, capabilities and Port-Addresses are decoded safely.'],
  ['Discovery safety', 'ArtDmx and physical DMX output remain unavailable in Phase 3.']
]

export function DashboardPage({ info }: { info: AppInfo | null }) {
  return (
    <div className="space-y-4 p-5">
      <div>
        <h2 className="text-xl font-semibold">Art-Net Core Engine</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Phase 3 introduces live Art-Net discovery while keeping all lighting-output packets disabled.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Metric icon={ServerCog} label="Application" value="Desktop Ready" detail={info ? `v${info.version}` : 'Starting…'} />
        <Metric icon={LockKeyhole} label="Security" value="Isolated" detail="Restricted IPC bridge" />
        <Metric icon={Network} label="Networking" value="NIC Ready" detail="Phase 2 complete" />
        <Metric icon={RadioTower} label="Art-Net" value="Discovery" detail="UDP 6454 · Phase 3" />
      </div>

      <div className="grid grid-cols-[1.4fr_1fr] gap-4">
        <Card>
          <CardHeader title="Phase 3 capabilities" subtitle="Discovery engine and packet parsing" />
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
          <CardHeader title="Next milestone" subtitle="Phase 4 — Node Discovery & Monitoring" />
          <div className="space-y-3 p-4 text-sm text-zinc-400">
            {[
              'Richer node health and change detection',
              'Node detail / capability view',
              'Port and subscription visualization',
              'Discovery diagnostics and event history'
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
          subtitle="Phase 3 opens UDP 6454 only for ArtPoll discovery and incoming ArtPollReply traffic."
        />
        <div className="grid grid-cols-3 gap-3 p-4">
          <SafetyItem title="ArtPoll" value="Enabled on demand" />
          <SafetyItem title="ArtPollReply" value="Receive / parse" />
          <SafetyItem title="ArtDmx" value="Disabled" />
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
