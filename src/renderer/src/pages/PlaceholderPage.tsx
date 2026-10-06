import { Construction } from 'lucide-react'
import { Card } from '../components/ui/Card'

export function PlaceholderPage({ title, phase }: { title: string; phase: number }) {
  return (
    <div className="p-5">
      <Card className="grid min-h-[360px] place-items-center p-8 text-center">
        <div>
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-zinc-800 bg-zinc-900">
            <Construction size={21} className="text-zinc-400" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-zinc-500">This workspace is reserved for Phase {phase}.</p>
        </div>
      </Card>
    </div>
  )
}
