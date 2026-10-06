import type { HTMLAttributes, ReactNode } from 'react'

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-xl border border-zinc-800 bg-zinc-950/70 ${className}`} {...props} />
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-zinc-800 px-4 py-3">
      <div>
        <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
        {subtitle ? <p className="mt-1 text-xs text-zinc-500">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  )
}
