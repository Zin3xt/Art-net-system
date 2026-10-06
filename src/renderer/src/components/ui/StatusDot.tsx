export function StatusDot({ state = 'idle' }: { state?: 'ok' | 'warn' | 'idle' }) {
  const tone = state === 'ok' ? 'bg-emerald-400' : state === 'warn' ? 'bg-amber-400' : 'bg-zinc-500'
  return <span className={`inline-block h-2 w-2 rounded-full ${tone}`} aria-hidden="true" />
}
