import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Database,
  Pencil,
  Plus,
  RadioTower,
  RefreshCw,
  RotateCcw,
  Trash2,
  X
} from 'lucide-react'
import type {
  ArtNetNode,
  UniverseDefinition,
  UniverseInput,
  UniverseOutputMode
} from '../../../shared/types'
import { Button } from '../components/ui/Button'
import { Card, CardHeader } from '../components/ui/Card'
import { StatusDot } from '../components/ui/StatusDot'

const EMPTY_FORM: UniverseInput = {
  name: 'Universe 1',
  net: 0,
  subNet: 0,
  universe: 0,
  enabled: false,
  outputMode: 'broadcast',
  targetNodeId: null,
  targetNodeMac: null,
  targetNodeIp: null
}

export function UniversesPage({ nodes }: { nodes: ArtNetNode[] }) {
  const [universes, setUniverses] = useState<UniverseDefinition[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<UniverseInput>(EMPTY_FORM)
  const [editorOpen, setEditorOpen] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setUniverses(await window.artnetDesktop.universes.list())
      setError(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load universes.')
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const enabledCount = universes.filter((item) => item.enabled).length
  const unicastCount = universes.filter((item) => item.outputMode === 'unicast').length
  const nonZeroChannels = universes.reduce(
    (sum, item) => sum + item.channels.filter((value) => value !== 0).length,
    0
  )

  function openCreate() {
    const nextAddress = findNextAddress(universes)
    setEditingId(null)
    setForm({
      ...EMPTY_FORM,
      name: `Universe ${universes.length + 1}`,
      net: nextAddress.net,
      subNet: nextAddress.subNet,
      universe: nextAddress.universe
    })
    setError(null)
    setEditorOpen(true)
  }

  function openEdit(universe: UniverseDefinition) {
    const currentTarget =
      (universe.targetNodeMac
        ? nodes.find((node) => node.mac === universe.targetNodeMac)
        : null) ??
      (universe.targetNodeId
        ? nodes.find((node) => node.id === universe.targetNodeId)
        : null) ??
      null

    setEditingId(universe.id)
    setForm({
      ...toInput(universe),
      targetNodeId: currentTarget?.id ?? universe.targetNodeId,
      targetNodeMac: currentTarget?.mac ?? universe.targetNodeMac,
      targetNodeIp: currentTarget?.ip ?? universe.targetNodeIp
    })
    setError(null)
    setEditorOpen(true)
  }

  function closeEditor() {
    setEditorOpen(false)
    setEditingId(null)
    setError(null)
  }

  async function saveUniverse() {
    setBusy('save')
    setError(null)
    try {
      if (editingId) {
        await window.artnetDesktop.universes.update(editingId, form)
      } else {
        await window.artnetDesktop.universes.create(form)
      }
      await refresh()
      closeEditor()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save universe.')
    } finally {
      setBusy(null)
    }
  }

  async function toggleEnabled(universe: UniverseDefinition) {
    setBusy(universe.id)
    setError(null)
    try {
      await window.artnetDesktop.universes.update(universe.id, {
        ...toInput(universe),
        enabled: !universe.enabled
      })
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update universe.')
    } finally {
      setBusy(null)
    }
  }

  async function duplicate(universe: UniverseDefinition) {
    setBusy(universe.id)
    setError(null)
    try {
      await window.artnetDesktop.universes.duplicate(universe.id)
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to duplicate universe.')
    } finally {
      setBusy(null)
    }
  }

  async function reset(universe: UniverseDefinition) {
    setBusy(universe.id)
    setError(null)
    try {
      await window.artnetDesktop.universes.reset(universe.id)
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to reset universe.')
    } finally {
      setBusy(null)
    }
  }

  async function remove(universe: UniverseDefinition) {
    const confirmed = window.confirm(
      `Delete "${universe.name}"? This removes its configuration and 512-channel buffer.`
    )
    if (!confirmed) return

    setBusy(universe.id)
    setError(null)
    try {
      await window.artnetDesktop.universes.delete(universe.id)
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to delete universe.')
    } finally {
      setBusy(null)
    }
  }

  function updateMode(mode: UniverseOutputMode) {
    setForm((current) => ({
      ...current,
      outputMode: mode,
      targetNodeId: mode === 'broadcast' ? null : current.targetNodeId,
      targetNodeMac: mode === 'broadcast' ? null : current.targetNodeMac,
      targetNodeIp: mode === 'broadcast' ? null : current.targetNodeIp
    }))
  }

  function updateTarget(nodeId: string) {
    const node = nodes.find((item) => item.id === nodeId)
    setForm((current) => ({
      ...current,
      targetNodeId: node?.id ?? null,
      targetNodeMac: node?.mac ?? null,
      targetNodeIp: node?.ip ?? null
    }))
  }

  return (
    <div className="space-y-4 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Universe Engine</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Configure 512-channel Art-Net universes and ESP32 destinations. ArtDmx transmission remains locked.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => void refresh()}>
            <RefreshCw size={15} className="mr-2" />
            Refresh
          </Button>
          <Button
            onClick={openCreate}
            className="border-blue-500/40 bg-blue-500/15 hover:bg-blue-500/25"
          >
            <Plus size={15} className="mr-2" />
            New universe
          </Button>
        </div>
      </div>

      {error ? (
        <Card className="border-red-500/30 bg-red-500/5 p-4 text-sm text-red-300">
          {error}
        </Card>
      ) : null}

      <div className="grid grid-cols-5 gap-3">
        <Summary label="Universes" value={universes.length} />
        <Summary label="Enabled" value={enabledCount} />
        <Summary label="Unicast" value={unicastCount} />
        <Summary label="Configured channels" value={universes.length * 512} />
        <Summary label="Non-zero channels" value={nonZeroChannels} />
      </div>

      <Card className="border-amber-500/20 bg-amber-500/[0.03]">
        <div className="flex items-start gap-3 p-4">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-400" />
          <div>
            <div className="text-sm font-medium text-amber-200">Physical output safety lock is active</div>
            <div className="mt-1 text-xs leading-5 text-zinc-500">
              Enabled universes are configuration-ready only. Phase 5 does not serialize or transmit ArtDmx,
              so changing these settings cannot move or illuminate fixtures.
            </div>
          </div>
        </div>
      </Card>

      {editorOpen ? (
        <UniverseEditor
          form={form}
          editing={editingId !== null}
          nodes={nodes}
          busy={busy === 'save'}
          onChange={setForm}
          onModeChange={updateMode}
          onTargetChange={updateTarget}
          onSave={() => void saveUniverse()}
          onClose={closeEditor}
        />
      ) : null}

      {universes.length === 0 ? (
        <Card className="grid min-h-[320px] place-items-center p-8 text-center">
          <div>
            <Database size={30} className="mx-auto text-zinc-600" />
            <div className="mt-3 text-sm font-medium text-zinc-300">No universes configured</div>
            <div className="mt-1 max-w-md text-xs leading-5 text-zinc-500">
              Create the first universe and assign Port-Address 0:0:0 to your ESP32 output,
              or choose another Art-Net address.
            </div>
            <Button onClick={openCreate} className="mt-4">
              <Plus size={14} className="mr-2" />
              Create Universe 1
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {universes.map((universe) => (
            <UniverseCard
              key={universe.id}
              universe={universe}
              nodes={nodes}
              busy={busy === universe.id}
              onEdit={() => openEdit(universe)}
              onToggle={() => void toggleEnabled(universe)}
              onDuplicate={() => void duplicate(universe)}
              onReset={() => void reset(universe)}
              onDelete={() => void remove(universe)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function UniverseEditor({
  form,
  editing,
  nodes,
  busy,
  onChange,
  onModeChange,
  onTargetChange,
  onSave,
  onClose
}: {
  form: UniverseInput
  editing: boolean
  nodes: ArtNetNode[]
  busy: boolean
  onChange: (form: UniverseInput) => void
  onModeChange: (mode: UniverseOutputMode) => void
  onTargetChange: (id: string) => void
  onSave: () => void
  onClose: () => void
}) {
  const portAddress = ((form.net & 0x7f) << 8) | ((form.subNet & 0x0f) << 4) | (form.universe & 0x0f)

  return (
    <Card>
      <CardHeader
        title={editing ? 'Edit universe' : 'Create universe'}
        subtitle="Each universe contains exactly 512 DMX channel values."
        action={
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200" aria-label="Close editor">
            <X size={17} />
          </button>
        }
      />
      <div className="grid grid-cols-2 gap-5 p-4">
        <div className="space-y-4">
          <Field label="Name">
            <input
              value={form.name}
              maxLength={80}
              onChange={(event) => onChange({ ...form, name: event.target.value })}
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <NumberField
              label="Net"
              min={0}
              max={127}
              value={form.net}
              onChange={(net) => onChange({ ...form, net })}
            />
            <NumberField
              label="Sub-Net"
              min={0}
              max={15}
              value={form.subNet}
              onChange={(subNet) => onChange({ ...form, subNet })}
            />
            <NumberField
              label="Universe"
              min={0}
              max={15}
              value={form.universe}
              onChange={(universe) => onChange({ ...form, universe })}
            />
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
            <div className="text-[10px] uppercase tracking-[0.12em] text-zinc-600">Port-Address</div>
            <div className="mt-2 font-mono text-lg text-zinc-200">
              {form.net}:{form.subNet}:{form.universe}
            </div>
            <div className="mt-1 text-xs text-zinc-600">15-bit decimal address {portAddress}</div>
          </div>
        </div>

        <div className="space-y-4">
          <Field label="Destination mode">
            <div className="grid grid-cols-2 gap-2">
              {(['broadcast', 'unicast'] as UniverseOutputMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onModeChange(mode)}
                  className={`rounded-md border px-3 py-2 text-sm capitalize ${
                    form.outputMode === mode
                      ? 'border-blue-500/40 bg-blue-500/10 text-blue-200'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-500'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </Field>

          {form.outputMode === 'unicast' ? (
            <Field label="Target Art-Net node">
              <select
                value={form.targetNodeId ?? ''}
                onChange={(event) => onTargetChange(event.target.value)}
                className={inputClass}
              >
                <option value="">Select a discovered node</option>
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.longName} — {node.ip} — {node.health}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 text-xs leading-5 text-zinc-500">
              Broadcast mode will use the selected Art-Net adapter's subnet broadcast address in the future
              output phase. No ArtDmx is sent yet.
            </div>
          )}

          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
            <div>
              <div className="text-sm text-zinc-200">Universe enabled</div>
              <div className="mt-1 text-xs text-zinc-600">Configuration flag only while ArtDmx is locked.</div>
            </div>
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(event) => onChange({ ...form, enabled: event.target.checked })}
              className="h-4 w-4 accent-blue-500"
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={onClose}>Cancel</Button>
            <Button
              onClick={onSave}
              disabled={busy || (form.outputMode === 'unicast' && !form.targetNodeId)}
              className="border-blue-500/40 bg-blue-500/15 hover:bg-blue-500/25"
            >
              {busy ? 'Saving…' : editing ? 'Save changes' : 'Create universe'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

function UniverseCard({
  universe,
  nodes,
  busy,
  onEdit,
  onToggle,
  onDuplicate,
  onReset,
  onDelete
}: {
  universe: UniverseDefinition
  nodes: ArtNetNode[]
  busy: boolean
  onEdit: () => void
  onToggle: () => void
  onDuplicate: () => void
  onReset: () => void
  onDelete: () => void
}) {
  const target =
    (universe.targetNodeMac
      ? nodes.find((node) => node.mac === universe.targetNodeMac)
      : null) ??
    (universe.targetNodeId
      ? nodes.find((node) => node.id === universe.targetNodeId)
      : null) ??
    null
  const readiness = getReadiness(universe, target)
  const nonZero = universe.channels.filter((value) => value !== 0).length
  const maxValue = universe.channels.reduce((max, value) => Math.max(max, value), 0)

  return (
    <Card>
      <div className="grid grid-cols-[1.15fr_0.9fr_1fr_auto] items-center gap-5 p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <StatusDot state={universe.enabled ? 'ok' : 'idle'} />
            <span className="truncate text-sm font-semibold text-zinc-200">{universe.name}</span>
            <span className="rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[9px] uppercase text-zinc-500">
              {universe.outputMode}
            </span>
          </div>
          <div className="mt-2 font-mono text-lg text-zinc-100">
            {universe.net}:{universe.subNet}:{universe.universe}
          </div>
          <div className="mt-1 text-[10px] text-zinc-600">
            Port-Address {universe.portAddress} · 512 channels
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-zinc-600">Destination</div>
          <div className="mt-2 truncate text-xs text-zinc-300">
            {universe.outputMode === 'broadcast'
              ? 'Subnet broadcast'
              : target?.longName ?? 'Assigned node unavailable'}
          </div>
          <div className="mt-1 font-mono text-[11px] text-zinc-600">
            {universe.outputMode === 'broadcast'
              ? 'Resolved by selected NIC'
              : target?.ip ?? universe.targetNodeIp ?? '—'}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.12em] text-zinc-600">Buffer</div>
              <div className="mt-2 text-xs text-zinc-300">{nonZero} non-zero channels</div>
              <div className="mt-1 text-[11px] text-zinc-600">Peak value {maxValue} / 255</div>
            </div>
            <ReadinessBadge readiness={readiness} />
          </div>
          <div className="mt-3 grid grid-cols-16 gap-0.5" title="Channels 1–16 preview">
            {universe.channels.slice(0, 16).map((value, index) => (
              <div
                key={index}
                className="h-5 rounded-sm border border-zinc-800 bg-zinc-900"
                title={`Channel ${index + 1}: ${value}`}
              >
                <div
                  className="w-full rounded-sm bg-blue-400/40"
                  style={{ height: `${Math.max(2, (value / 255) * 100)}%`, marginTop: 'auto' }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button onClick={onToggle} disabled={busy}>
            {universe.enabled ? 'Disable' : 'Enable'}
          </Button>
          <Button onClick={onEdit} disabled={busy} title="Edit universe">
            <Pencil size={14} />
          </Button>
          <Button onClick={onDuplicate} disabled={busy} title="Duplicate universe">
            <Copy size={14} />
          </Button>
          <Button onClick={onReset} disabled={busy} title="Reset all 512 channels">
            <RotateCcw size={14} />
          </Button>
          <Button
            onClick={onDelete}
            disabled={busy}
            className="border-red-500/30 text-red-300 hover:bg-red-500/10"
            title="Delete universe"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
    </Card>
  )
}

type Readiness = 'disabled' | 'ready' | 'target-offline' | 'target-missing' | 'output-locked'

function getReadiness(universe: UniverseDefinition, target: ArtNetNode | null): Readiness {
  if (!universe.enabled) return 'disabled'
  if (universe.outputMode === 'unicast' && !target) return 'target-missing'
  if (universe.outputMode === 'unicast' && target?.health === 'offline') return 'target-offline'
  return 'output-locked'
}

function ReadinessBadge({ readiness }: { readiness: Readiness }) {
  const map: Record<Readiness, { label: string; classes: string; icon: typeof CheckCircle2 }> = {
    disabled: {
      label: 'Disabled',
      classes: 'border-zinc-700 bg-zinc-900 text-zinc-500',
      icon: CheckCircle2
    },
    ready: {
      label: 'Ready',
      classes: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
      icon: CheckCircle2
    },
    'target-offline': {
      label: 'Target offline',
      classes: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
      icon: AlertTriangle
    },
    'target-missing': {
      label: 'Target missing',
      classes: 'border-red-500/30 bg-red-500/10 text-red-300',
      icon: AlertTriangle
    },
    'output-locked': {
      label: 'ArtDmx locked',
      classes: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
      icon: RadioTower
    }
  }
  const item = map[readiness]
  const Icon = item.icon

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] uppercase tracking-wide ${item.classes}`}>
      <Icon size={10} /> {item.label}
    </span>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-[10px] uppercase tracking-[0.12em] text-zinc-600">{label}</div>
      {children}
    </label>
  )
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => {
          const parsed = Number.parseInt(event.target.value, 10)
          if (Number.isFinite(parsed)) onChange(Math.max(min, Math.min(max, parsed)))
        }}
        className={inputClass}
      />
    </Field>
  )
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <div className="text-[10px] uppercase tracking-[0.12em] text-zinc-600">{label}</div>
      <div className="mt-2 text-xl font-semibold text-zinc-100">{value}</div>
    </Card>
  )
}

function toInput(universe: UniverseDefinition): UniverseInput {
  return {
    name: universe.name,
    net: universe.net,
    subNet: universe.subNet,
    universe: universe.universe,
    enabled: universe.enabled,
    outputMode: universe.outputMode,
    targetNodeId: universe.targetNodeId,
    targetNodeMac: universe.targetNodeMac,
    targetNodeIp: universe.targetNodeIp
  }
}

function findNextAddress(universes: UniverseDefinition[]) {
  const used = new Set(universes.map((item) => item.portAddress))
  for (let portAddress = 0; portAddress <= 0x7fff; portAddress += 1) {
    if (!used.has(portAddress)) {
      return {
        net: (portAddress >> 8) & 0x7f,
        subNet: (portAddress >> 4) & 0x0f,
        universe: portAddress & 0x0f
      }
    }
  }
  return { net: 0, subNet: 0, universe: 0 }
}

const inputClass =
  'h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-200 outline-none focus:border-blue-500'
