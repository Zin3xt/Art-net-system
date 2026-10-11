import { useEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import {
  Ban,
  Check,
  Clipboard,
  ClipboardPaste,
  Lock,
  Power,
  RefreshCw,
  RotateCcw,
  Search,
  Unlock,
  X
} from 'lucide-react'
import type {
  DmxOutputStatus,
  DmxUniverseRouteStatus,
  UniverseDefinition,
  UniverseChannelValue
} from '../../../shared/types'
import { Button } from '../components/ui/Button'
import { Card, CardHeader } from '../components/ui/Card'
import { StatusDot } from '../components/ui/StatusDot'

const BANK_SIZE = 64
const BANK_COUNT = 8
const QUICK_VALUES = [0, 64, 128, 192, 255]

interface ClipboardChannel {
  value: number
  label: string
}

export function RawDmxPage({
  outputStatus,
  routes,
  universes,
  onRefresh
}: {
  outputStatus: DmxOutputStatus
  routes: DmxUniverseRouteStatus[]
  universes: UniverseDefinition[]
  onRefresh: () => Promise<void>
}) {
  const [universeId, setUniverseId] = useState('')
  const [bank, setBank] = useState(0)
  const [query, setQuery] = useState('')
  const [selectedChannels, setSelectedChannels] = useState<number[]>([])
  const [selectionValue, setSelectionValue] = useState(0)
  const [labelDraft, setLabelDraft] = useState('')
  const [masterDraft, setMasterDraft] = useState(outputStatus.masterPercent)
  const [clipboard, setClipboard] = useState<ClipboardChannel[]>([])
  const [localChannels, setLocalChannels] = useState<number[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const anchorRef = useRef<number | null>(null)
  const pendingRef = useRef<Map<number, number>>(new Map())
  const flushTimerRef = useRef<number | null>(null)

  const universe = useMemo(
    () => universes.find((item) => item.id === universeId) ?? null,
    [universeId, universes]
  )

  const route = useMemo(
    () => routes.find((item) => item.universeId === universeId) ?? null,
    [routes, universeId]
  )

  useEffect(() => {
    if (!universeId && universes.length > 0) {
      setUniverseId(universes[0].id)
    } else if (universeId && !universes.some((item) => item.id === universeId)) {
      setUniverseId(universes[0]?.id ?? '')
    }
  }, [universeId, universes])

  useEffect(() => {
    if (!universe) {
      setLocalChannels([])
      return
    }
    if (pendingRef.current.size === 0) {
      setLocalChannels([...universe.channels])
    }
  }, [universe?.id, universe?.updatedAt])

  useEffect(() => {
    setMasterDraft(outputStatus.masterPercent)
  }, [outputStatus.masterPercent])

  useEffect(() => {
    if (selectedChannels.length === 1 && universe) {
      setSelectionValue(localChannels[selectedChannels[0] - 1] ?? 0)
      setLabelDraft(universe.channelLabels[selectedChannels[0] - 1] ?? '')
    } else if (selectedChannels.length > 1) {
      const values = selectedChannels.map((channel) => localChannels[channel - 1] ?? 0)
      const first = values[0] ?? 0
      setSelectionValue(values.every((value) => value === first) ? first : 0)
      setLabelDraft('')
    }
  }, [selectedChannels, universe?.id, universe?.updatedAt, localChannels])

  useEffect(() => {
    return () => {
      if (flushTimerRef.current !== null) window.clearTimeout(flushTimerRef.current)
    }
  }, [])

  const bankStart = bank * BANK_SIZE + 1
  const bankEnd = Math.min(512, bankStart + BANK_SIZE - 1)
  const visibleBankChannels = useMemo(
    () => Array.from({ length: bankEnd - bankStart + 1 }, (_, index) => bankStart + index),
    [bankEnd, bankStart]
  )

  const overviewChannels = useMemo(() => {
    if (!universe) return []
    const normalized = query.trim().toLowerCase()
    const all = Array.from({ length: 512 }, (_, index) => index + 1)
    if (!normalized) return all

    return all.filter((channel) => {
      const label = universe.channelLabels[channel - 1] ?? ''
      return String(channel).includes(normalized) || label.toLowerCase().includes(normalized)
    })
  }, [query, universe])

  const selectedLockedCount = universe
    ? selectedChannels.filter((channel) => universe.channelLocks[channel - 1]).length
    : 0

  const outputReady = route?.eligible === true

  function selectChannel(channel: number, event?: MouseEvent) {
    if (event?.shiftKey && anchorRef.current !== null) {
      const start = Math.min(anchorRef.current, channel)
      const end = Math.max(anchorRef.current, channel)
      setSelectedChannels(Array.from({ length: end - start + 1 }, (_, index) => start + index))
      return
    }

    if (event?.ctrlKey || event?.metaKey) {
      setSelectedChannels((current) =>
        current.includes(channel)
          ? current.filter((item) => item !== channel)
          : [...current, channel].sort((a, b) => a - b)
      )
      anchorRef.current = channel
      return
    }

    setSelectedChannels([channel])
    anchorRef.current = channel
  }

  function selectVisibleBank() {
    if (!universe) return
    setSelectedChannels(visibleBankChannels)
    anchorRef.current = visibleBankChannels[0] ?? null
  }

  function selectSearchResults() {
    if (overviewChannels.length === 0) return
    setSelectedChannels(overviewChannels)
    anchorRef.current = overviewChannels[0] ?? null
  }

  function clearSelection() {
    setSelectedChannels([])
    anchorRef.current = null
  }

  function queueChannelValue(channel: number, value: number) {
    if (!universe || universe.channelLocks[channel - 1]) return
    const normalized = clamp(value, 0, 255)

    setLocalChannels((current) => {
      const next = current.length === 512 ? [...current] : [...universe.channels]
      next[channel - 1] = normalized
      return next
    })

    pendingRef.current.set(channel, normalized)
    if (flushTimerRef.current !== null) return

    flushTimerRef.current = window.setTimeout(() => {
      flushTimerRef.current = null
      void flushPending()
    }, 80)
  }

  async function flushPending() {
    if (!universe || pendingRef.current.size === 0) return
    const pending = Array.from(pendingRef.current.entries()).map(([channel, value]) => ({
      channel,
      value
    }))
    pendingRef.current.clear()

    try {
      await window.artnetDesktop.universes.setChannels({
        universeId: universe.id,
        updates: pending
      })
      await onRefresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update DMX channels.')
      await onRefresh()
    }
  }

  async function applyToSelection(value: number) {
    if (!universe || selectedChannels.length === 0) return
    const unlocked = selectedChannels.filter((channel) => !universe.channelLocks[channel - 1])
    if (unlocked.length === 0) {
      setError('All selected channels are locked.')
      return
    }

    const normalized = clamp(value, 0, 255)
    setBusy('selection')
    setError(null)
    try {
      const updates: UniverseChannelValue[] = unlocked.map((channel) => ({
        channel,
        value: normalized
      }))
      await window.artnetDesktop.universes.setChannels({
        universeId: universe.id,
        updates
      })
      setLocalChannels((current) => {
        const next = current.length === 512 ? [...current] : [...universe.channels]
        for (const channel of unlocked) next[channel - 1] = normalized
        return next
      })
      setSelectionValue(normalized)
      await onRefresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update selected channels.')
    } finally {
      setBusy(null)
    }
  }

  async function saveLabel() {
    if (!universe || selectedChannels.length !== 1) return
    setBusy('label')
    setError(null)
    try {
      await window.artnetDesktop.universes.setChannelLabel({
        universeId: universe.id,
        channel: selectedChannels[0],
        label: labelDraft
      })
      await onRefresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save channel label.')
    } finally {
      setBusy(null)
    }
  }

  async function setSelectionLock(locked: boolean) {
    if (!universe || selectedChannels.length === 0) return
    setBusy('lock')
    setError(null)
    try {
      await window.artnetDesktop.universes.setChannelLocks({
        universeId: universe.id,
        channels: selectedChannels,
        locked
      })
      await onRefresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update channel locks.')
    } finally {
      setBusy(null)
    }
  }

  function copySelection() {
    if (!universe || selectedChannels.length === 0) return
    setClipboard(
      selectedChannels.map((channel) => ({
        value: localChannels[channel - 1] ?? 0,
        label: universe.channelLabels[channel - 1] ?? ''
      }))
    )
  }

  async function pasteSelection() {
    if (!universe || selectedChannels.length === 0 || clipboard.length === 0) return
    const unlocked = selectedChannels.filter((channel) => !universe.channelLocks[channel - 1])
    if (unlocked.length === 0) {
      setError('All selected destination channels are locked.')
      return
    }

    const updates = unlocked.map((channel, index) => ({
      channel,
      value: clipboard[index % clipboard.length].value
    }))

    setBusy('paste')
    setError(null)
    try {
      await window.artnetDesktop.universes.setChannels({
        universeId: universe.id,
        updates
      })
      setLocalChannels((current) => {
        const next = current.length === 512 ? [...current] : [...universe.channels]
        for (const item of updates) next[item.channel - 1] = item.value
        return next
      })
      await onRefresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to paste channel values.')
    } finally {
      setBusy(null)
    }
  }

  async function resetUniverse() {
    if (!universe) return
    const confirmed = window.confirm(
      `Set all 512 channels in "${universe.name}" to zero? Channel locks do not block this deliberate full-universe reset.`
    )
    if (!confirmed) return

    setBusy('reset')
    setError(null)
    try {
      await window.artnetDesktop.universes.reset(universe.id)
      setLocalChannels(Array.from({ length: 512 }, () => 0))
      await onRefresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to reset universe.')
    } finally {
      setBusy(null)
    }
  }

  async function changeMaster(percent: number) {
    const normalized = clamp(percent, 0, 100)
    setMasterDraft(normalized)
    try {
      await window.artnetDesktop.output.setMaster(normalized)
      await onRefresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to change master level.')
    }
  }

  async function enableOutput() {
    const confirmed = window.confirm(
      'ENABLE LIVE DMX OUTPUT?\n\nThe Raw DMX Tester will transmit current channel values to eligible subscribed Art-Net nodes.'
    )
    if (!confirmed) return

    setBusy('output')
    setError(null)
    try {
      await window.artnetDesktop.output.enable()
      await onRefresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to enable DMX output.')
    } finally {
      setBusy(null)
    }
  }

  async function disableOutput() {
    setBusy('output')
    setError(null)
    try {
      await window.artnetDesktop.output.disable()
      await onRefresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to disable DMX output.')
    } finally {
      setBusy(null)
    }
  }

  async function toggleBlackout() {
    setBusy('blackout')
    setError(null)
    try {
      if (outputStatus.blackout) await window.artnetDesktop.output.blackoutOff()
      else await window.artnetDesktop.output.blackoutOn()
      await onRefresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to change Blackout state.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Raw DMX Tester</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Direct control of all 512 DMX channels using the Phase 6 ArtDmx safety engine.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => void onRefresh()}>
            <RefreshCw size={15} className="mr-2" />
            Refresh
          </Button>
          {outputStatus.outputEnabled ? (
            <Button onClick={() => void disableOutput()} disabled={busy !== null}>
              <Power size={15} className="mr-2" />
              Disable output
            </Button>
          ) : (
            <Button
              onClick={() => void enableOutput()}
              disabled={busy !== null || !outputReady}
              className="border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
            >
              <Power size={15} className="mr-2" />
              ENABLE OUTPUT
            </Button>
          )}
          <Button
            onClick={() => void toggleBlackout()}
            disabled={!outputStatus.outputEnabled || busy !== null}
            className={
              outputStatus.blackout
                ? 'border-red-500 bg-red-500/25 text-red-100 hover:bg-red-500/35'
                : 'border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20'
            }
          >
            <Ban size={15} className="mr-2" />
            {outputStatus.blackout ? 'RELEASE BLACKOUT' : 'BLACKOUT'}
          </Button>
        </div>
      </div>

      {error ? (
        <Card className="border-red-500/30 bg-red-500/5 p-4 text-sm text-red-300">
          {error}
        </Card>
      ) : null}

      <Card className={outputStatus.blackout ? 'border-red-500/40' : outputStatus.outputEnabled ? 'border-emerald-500/30' : ''}>
        <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-4 p-4">
          <div>
            <Label>Universe</Label>
            <select
              value={universeId}
              onChange={(event) => {
                setUniverseId(event.target.value)
                setSelectedChannels([])
                setBank(0)
              }}
              className={inputClass}
            >
              <option value="">Select universe</option>
              {universes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — {item.net}:{item.subNet}:{item.universe}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Route / target</Label>
            <div className="mt-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2">
              <div className="flex items-center gap-2 text-xs">
                <StatusDot state={route?.eligible ? 'ok' : route?.enabled ? 'warn' : 'idle'} />
                <span className={route?.eligible ? 'text-emerald-300' : 'text-zinc-400'}>
                  {route?.eligible ? 'Ready for ArtDmx' : route?.reason ?? 'No route selected'}
                </span>
              </div>
              <div className="mt-1 truncate font-mono text-[10px] text-zinc-600">
                {route?.targetNodeName ?? '—'} · {route?.targetIp ?? '—'}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label>Master dimmer</Label>
              <span className="font-mono text-xs text-zinc-300">{masterDraft}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={masterDraft}
              onChange={(event) => void changeMaster(Number(event.target.value))}
              className="mt-4 w-full accent-blue-500"
            />
            <div className="mt-2 flex justify-between text-[10px] text-zinc-600">
              <span>0%</span>
              <span>Non-destructive output scale</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </Card>

      {!universe ? (
        <Card className="grid min-h-[300px] place-items-center p-8 text-center">
          <div>
            <div className="text-sm font-medium text-zinc-300">Select a universe to begin</div>
            <div className="mt-2 text-xs text-zinc-500">
              Phase 7 controls the persistent 512-channel buffer for the selected universe.
            </div>
          </div>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader
              title="Channel selection & operations"
              subtitle={`${selectedChannels.length} selected · ${selectedLockedCount} locked`}
              action={
                selectedChannels.length > 0 ? (
                  <Button onClick={clearSelection}>
                    <X size={14} className="mr-2" />
                    Clear selection
                  </Button>
                ) : null
              }
            />
            <div className="grid grid-cols-[1.1fr_0.85fr_0.75fr] gap-5 p-4">
              <div className="space-y-3">
                <div className="grid grid-cols-[1fr_auto_auto] gap-2">
                  <div className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-3">
                    <Search size={14} className="text-zinc-500" />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Channel number or label"
                      className="h-9 min-w-0 flex-1 bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
                    />
                  </div>
                  <Button onClick={selectSearchResults} disabled={overviewChannels.length === 0}>
                    Select results
                  </Button>
                  <Button onClick={selectVisibleBank}>Select bank</Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: BANK_COUNT }, (_, index) => {
                    const start = index * BANK_SIZE + 1
                    const end = start + BANK_SIZE - 1
                    return (
                      <button
                        key={index}
                        onClick={() => setBank(index)}
                        className={
                          bank === index
                            ? 'rounded-md border border-blue-500/40 bg-blue-500/10 px-3 py-1.5 text-xs text-blue-200'
                            : 'rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-300'
                        }
                      >
                        {start}–{end}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-[1fr_90px] gap-2">
                  <div>
                    <Label>Selected value</Label>
                    <input
                      type="range"
                      min={0}
                      max={255}
                      value={selectionValue}
                      disabled={selectedChannels.length === 0}
                      onChange={(event) => setSelectionValue(Number(event.target.value))}
                      onPointerUp={() => void applyToSelection(selectionValue)}
                      className="mt-3 w-full accent-blue-500"
                    />
                  </div>
                  <div>
                    <Label>0–255</Label>
                    <input
                      type="number"
                      min={0}
                      max={255}
                      value={selectionValue}
                      disabled={selectedChannels.length === 0}
                      onChange={(event) => setSelectionValue(clamp(Number(event.target.value), 0, 255))}
                      onBlur={() => void applyToSelection(selectionValue)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">
                    {Math.round((selectionValue / 255) * 100)}%
                  </span>
                  {QUICK_VALUES.map((value) => (
                    <Button
                      key={value}
                      onClick={() => void applyToSelection(value)}
                      disabled={selectedChannels.length === 0 || busy !== null}
                    >
                      {value}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={copySelection} disabled={selectedChannels.length === 0}>
                    <Clipboard size={14} className="mr-2" />
                    Copy
                  </Button>
                  <Button
                    onClick={() => void pasteSelection()}
                    disabled={selectedChannels.length === 0 || clipboard.length === 0 || busy !== null}
                  >
                    <ClipboardPaste size={14} className="mr-2" />
                    Paste
                  </Button>
                  <Button
                    onClick={() => void setSelectionLock(true)}
                    disabled={selectedChannels.length === 0 || busy !== null}
                  >
                    <Lock size={14} className="mr-2" />
                    Lock
                  </Button>
                  <Button
                    onClick={() => void setSelectionLock(false)}
                    disabled={selectedChannels.length === 0 || busy !== null}
                  >
                    <Unlock size={14} className="mr-2" />
                    Unlock
                  </Button>
                </div>

                <Button
                  onClick={() => void resetUniverse()}
                  disabled={busy !== null}
                  className="w-full border-red-500/30 text-red-300 hover:bg-red-500/10"
                >
                  <RotateCcw size={14} className="mr-2" />
                  Zero all 512 channels
                </Button>
              </div>
            </div>

            {selectedChannels.length === 1 ? (
              <div className="border-t border-zinc-900 p-4">
                <div className="grid grid-cols-[120px_1fr_auto] items-end gap-3">
                  <div>
                    <Label>Channel</Label>
                    <div className="mt-2 font-mono text-lg text-zinc-200">
                      {selectedChannels[0]}
                    </div>
                  </div>
                  <div>
                    <Label>Channel label</Label>
                    <input
                      value={labelDraft}
                      maxLength={32}
                      onChange={(event) => setLabelDraft(event.target.value)}
                      placeholder="e.g. Front Wash Red"
                      className={inputClass}
                    />
                  </div>
                  <Button onClick={() => void saveLabel()} disabled={busy !== null}>
                    <Check size={14} className="mr-2" />
                    Save label
                  </Button>
                </div>
              </div>
            ) : null}
          </Card>

          <div className="grid grid-cols-[1.7fr_0.8fr] gap-4">
            <Card>
              <CardHeader
                title={`Fader bank ${bankStart}–${bankEnd}`}
                subtitle="Move faders to update the universe buffer. Locked channels cannot be changed."
              />
              <div className="grid grid-cols-8 gap-2 p-3">
                {visibleBankChannels.map((channel) => {
                  const value = localChannels[channel - 1] ?? 0
                  const locked = universe.channelLocks[channel - 1]
                  const selected = selectedChannels.includes(channel)
                  const label = universe.channelLabels[channel - 1]

                  return (
                    <div
                      key={channel}
                      className={
                        selected
                          ? 'rounded-lg border border-blue-500/50 bg-blue-500/10 p-2'
                          : locked
                            ? 'rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-2'
                            : 'rounded-lg border border-zinc-800 bg-zinc-900/40 p-2'
                      }
                    >
                      <button
                        onClick={(event) => selectChannel(channel, event)}
                        className="flex w-full items-center justify-between text-left"
                      >
                        <span className="font-mono text-xs text-zinc-300">
                          {String(channel).padStart(3, '0')}
                        </span>
                        {locked ? <Lock size={10} className="text-amber-400" /> : null}
                      </button>
                      <div className="mt-1 h-4 truncate text-[9px] text-zinc-600" title={label}>
                        {label || '—'}
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={255}
                        value={value}
                        disabled={locked}
                        onChange={(event) => queueChannelValue(channel, Number(event.target.value))}
                        className="mt-2 w-full accent-blue-500"
                      />
                      <div className="mt-1 flex items-center justify-between">
                        <span className="font-mono text-[11px] text-zinc-300">{value}</span>
                        <span className="text-[9px] text-zinc-600">
                          {Math.round((value / 255) * 100)}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            <Card>
              <CardHeader
                title="512-channel overview"
                subtitle={query ? `${overviewChannels.length} matching channels` : 'Click to select · Ctrl/Cmd toggles · Shift selects a range'}
              />
              <div className="max-h-[620px] overflow-y-auto p-3">
                <div className="grid grid-cols-8 gap-1.5">
                  {overviewChannels.map((channel) => {
                    const value = localChannels[channel - 1] ?? 0
                    const selected = selectedChannels.includes(channel)
                    const locked = universe.channelLocks[channel - 1]
                    const label = universe.channelLabels[channel - 1]

                    return (
                      <button
                        key={channel}
                        onClick={(event) => {
                          setBank(Math.floor((channel - 1) / BANK_SIZE))
                          selectChannel(channel, event)
                        }}
                        title={'CH ' + channel + (label ? ' · ' + label : '') + ' · Value ' + value}
                        className={
                          selected
                            ? 'rounded border border-blue-500/60 bg-blue-500/15 px-1.5 py-2 text-left'
                            : value > 0
                              ? 'rounded border border-emerald-500/20 bg-emerald-500/[0.04] px-1.5 py-2 text-left'
                              : 'rounded border border-zinc-800 bg-zinc-900/50 px-1.5 py-2 text-left hover:border-zinc-700'
                        }
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[9px] text-zinc-500">{channel}</span>
                          {locked ? <Lock size={8} className="text-amber-400" /> : null}
                        </div>
                        <div className="mt-1 font-mono text-xs text-zinc-200">{value}</div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader title="Raw DMX safety" subtitle="Phase 6 protections remain mandatory in Phase 7." />
            <div className="grid grid-cols-4 gap-3 p-4">
              <Safety label="Output" value={outputStatus.outputEnabled ? 'LIVE' : 'DISABLED'} />
              <Safety label="Blackout" value={outputStatus.blackout ? 'ACTIVE' : 'Released'} />
              <Safety label="Master" value={`${outputStatus.masterPercent}%`} />
              <Safety label="Route" value={route?.eligible ? 'Subscribed / Ready' : 'Blocked'} />
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

function Safety({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
      <Label>{label}</Label>
      <div className="mt-2 text-sm text-zinc-200">{value}</div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] uppercase tracking-[0.12em] text-zinc-600">{children}</div>
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.max(min, Math.min(max, Math.trunc(value)))
}

const inputClass =
  'mt-1.5 h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-200 outline-none focus:border-blue-500'
