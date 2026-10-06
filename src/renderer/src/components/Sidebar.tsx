import {
  Activity,
  Cable,
  CircleGauge,
  Clapperboard,
  Layers,
  LayoutDashboard,
  Library,
  Lightbulb,
  ListChecks,
  Network,
  PanelsTopLeft,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Wrench
} from 'lucide-react'
import type { ComponentType } from 'react'
import { useAppStore, type PageId } from '../stores/appStore'

type Item = { id: PageId; label: string; icon: ComponentType<{ size?: number }>; phase: number }

const items: Item[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, phase: 1 },
  { id: 'network', label: 'Network', icon: Network, phase: 2 },
  { id: 'universes', label: 'Universes', icon: PanelsTopLeft, phase: 5 },
  { id: 'fixtures', label: 'Fixtures', icon: Lightbulb, phase: 9 },
  { id: 'patch', label: 'Patch', icon: Cable, phase: 10 },
  { id: 'programmer', label: 'Programmer', icon: SlidersHorizontal, phase: 13 },
  { id: 'groups', label: 'Groups', icon: Layers, phase: 12 },
  { id: 'scenes', label: 'Scenes', icon: Library, phase: 15 },
  { id: 'cues', label: 'Cues', icon: ListChecks, phase: 16 },
  { id: 'effects', label: 'Effects', icon: Sparkles, phase: 18 },
  { id: 'stage', label: 'Stage', icon: Clapperboard, phase: 20 },
  { id: 'diagnostics', label: 'Diagnostics', icon: Activity, phase: 25 },
  { id: 'settings', label: 'Settings', icon: Settings, phase: 1 }
]

export function Sidebar() {
  const currentPage = useAppStore((state) => state.currentPage)
  const setCurrentPage = useAppStore((state) => state.setCurrentPage)

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950/80">
      <div className="border-b border-zinc-800 px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg border border-blue-500/30 bg-blue-500/10">
            <CircleGauge size={17} />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-wide">ART-NET</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Controller</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {items.map((item) => {
          const Icon = item.icon
          const active = item.id === currentPage
          const available = item.phase === 1
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition ${
                active ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <Icon size={16} />
              <span className="flex-1">{item.label}</span>
              {!available ? <span className="text-[9px] text-zinc-600">P{item.phase}</span> : null}
            </button>
          )
        })}
      </nav>

      <div className="border-t border-zinc-800 p-3 text-[11px] text-zinc-500">
        <div className="flex items-center gap-2"><Wrench size={13} /> Phase 1 foundation</div>
      </div>
    </aside>
  )
}
