import { useEffect, useState } from 'react'
import type { AppSettings } from '../../../shared/types'
import { Button } from '../components/ui/Button'
import { Card, CardHeader } from '../components/ui/Card'

const fallback: AppSettings = {
  theme: 'dark',
  compactMode: true,
  startMaximized: false,
  restoreLastShow: true,
  outputEnabledOnStartup: false,
  preferredNetworkInterface: null,
  logLevel: 'info'
}

export function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(fallback)
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle')

  useEffect(() => {
    void window.artnetDesktop.settings.get().then(setSettings)
  }, [])

  async function save() {
    setState('saving')
    const saved = await window.artnetDesktop.settings.save(settings)
    setSettings(saved)
    setState('saved')
    window.setTimeout(() => setState('idle'), 1200)
  }

  return (
    <div className="space-y-4 p-5">
      <div>
        <h2 className="text-xl font-semibold">Application Settings</h2>
        <p className="mt-1 text-sm text-zinc-500">Local settings are stored on this computer.</p>
      </div>

      <Card>
        <CardHeader title="Interface" subtitle="Desktop shell behavior" />
        <div className="divide-y divide-zinc-900">
          <ToggleRow label="Compact console mode" description="Use tighter spacing for operator-focused screens." checked={settings.compactMode} onChange={(v) => setSettings({ ...settings, compactMode: v })} />
          <ToggleRow label="Start maximized" description="Open the main console using the available desktop workspace." checked={settings.startMaximized} onChange={(v) => setSettings({ ...settings, startMaximized: v })} />
          <ToggleRow label="Restore last show" description="Reserved for the show-file phase; preference is stored now." checked={settings.restoreLastShow} onChange={(v) => setSettings({ ...settings, restoreLastShow: v })} />
        </div>
      </Card>

      <Card>
        <CardHeader title="Networking" subtitle="Art-Net interface preference" />
        <div className="p-4">
          <div className="text-sm text-zinc-200">Preferred interface</div>
          <div className="mt-1 text-xs text-zinc-500">
            {settings.preferredNetworkInterface
              ? `Selected from Network: ${settings.preferredNetworkInterface}`
              : 'No Art-Net interface selected. Choose one from the Network workspace.'}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Safety" subtitle="Physical output defaults" />
        <div className="divide-y divide-zinc-900">
          <ToggleRow
            label="Enable lighting output on startup"
            description="Recommended OFF. This setting is stored now but will not control hardware until the output engine exists."
            checked={settings.outputEnabledOnStartup}
            onChange={(v) => setSettings({ ...settings, outputEnabledOnStartup: v })}
            danger
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="Diagnostics" subtitle="Local application logging" />
        <div className="flex items-center justify-between p-4">
          <div>
            <div className="text-sm text-zinc-200">Log level</div>
            <div className="mt-1 text-xs text-zinc-500">Controls how much diagnostic information future phases will record.</div>
          </div>
          <select
            value={settings.logLevel}
            onChange={(event) => setSettings({ ...settings, logLevel: event.target.value as AppSettings['logLevel'] })}
            className="h-9 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm outline-none focus:border-blue-500"
          >
            <option value="debug">Debug</option>
            <option value="info">Info</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
          </select>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={state === 'saving'} className="min-w-28 border-blue-500/40 bg-blue-500/15 hover:bg-blue-500/25">
          {state === 'saving' ? 'Saving…' : state === 'saved' ? 'Saved' : 'Save settings'}
        </Button>
      </div>
    </div>
  )
}

function ToggleRow({ label, description, checked, onChange, danger = false }: { label: string; description: string; checked: boolean; onChange: (checked: boolean) => void; danger?: boolean }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-6 px-4 py-4">
      <div>
        <div className={`text-sm ${danger ? 'text-amber-300' : 'text-zinc-200'}`}>{label}</div>
        <div className="mt-1 text-xs text-zinc-500">{description}</div>
      </div>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-blue-500" />
    </label>
  )
}
