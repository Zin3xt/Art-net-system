import { CheckCircle2, CircleDashed, LockKeyhole, Network, RadioTower, ServerCog } from 'lucide-react'
import type { AppInfo } from '../../../shared/types'
import { Card, CardHeader } from '../components/ui/Card'

const checks = [
  ['ArtDmx serializer', 'Builds protocol-version-14 ArtDmx packets with 512 channels and sequence numbers.'],
  ['Subscription enforcement', 'ArtDmx is sent only to healthy nodes advertising the universe in ArtPollReply.'],
  ['Explicit output gate', 'Every launch starts with output disabled until the operator explicitly enables it.'],
  ['Blackout and failsafe', 'Blackout repeats zero frames; disable sends a zero burst; repeated send failures stop output.']
]

export function DashboardPage({ info }: { info: AppInfo | null }) {
  return (
    <div className="space-y-4 p-5">
      <div>
        <h2 className="text-xl font-semibold">Realtime DMX Output Engine</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Phase 6 introduces controlled ArtDmx output to subscribed ESP32 / Art-Net nodes.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Metric icon={ServerCog} label="Application" value="Desktop Ready" detail={info ? `v${info.version}` : 'Starting…'} />
        <Metric icon={LockKeyhole} label="Startup safety" value="Output OFF" detail="Explicit enable required" />
        <Metric icon={Network} label="Art-Net" value="UDP 6454" detail="Discovery + unicast ArtDmx" />
        <Metric icon={RadioTower} label="Live output" value="Phase 6" detail="512-channel frames" />
      </div>

      <div className="grid grid-cols-[1.4fr_1fr] gap-4">
        <Card>
          <CardHeader title="Phase 6 capabilities" subtitle="ArtDmx output with protocol and operator safeguards" />
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
          <CardHeader title="Next milestone" subtitle="Phase 7 — Raw DMX Tester" />
          <div className="space-y-3 p-4 text-sm text-zinc-400">
            {[
              '512-channel fader/grid interface',
              '0–255 and percentage values',
              'channel selection and labeling',
              'master level and fast reset controls'
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
          title="Output policy"
          subtitle="Art-Net 4 ArtDmx output is unicast to advertised subscribers only."
        />
        <div className="grid grid-cols-3 gap-3 p-4">
          <SafetyItem title="Normal output" value="Changed data + 900 ms keepalive" />
          <SafetyItem title="Blackout" value="Zero frame every 100 ms" />
          <SafetyItem title="Disable / quit" value="3 zero frames then stop" />
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
