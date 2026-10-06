import { app } from 'electron'
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type {
  UniverseChannelUpdate,
  UniverseDefinition,
  UniverseInput,
  UniverseOutputMode
} from '../../shared/types'

const CHANNEL_COUNT = 512
const MAX_PORT_ADDRESS = 0x7fff

function universeFile(): string {
  return join(app.getPath('userData'), 'universes.json')
}

export function calculatePortAddress(net: number, subNet: number, universe: number): number {
  return ((net & 0x7f) << 8) | ((subNet & 0x0f) << 4) | (universe & 0x0f)
}

export function decodePortAddress(portAddress: number): { net: number; subNet: number; universe: number } {
  return {
    net: (portAddress >> 8) & 0x7f,
    subNet: (portAddress >> 4) & 0x0f,
    universe: portAddress & 0x0f
  }
}

function assertIntegerRange(label: string, value: unknown, min: number, max: number): number {
  if (!Number.isInteger(value) || Number(value) < min || Number(value) > max) {
    throw new Error(`${label} must be an integer from ${min} to ${max}.`)
  }
  return Number(value)
}

function normalizeName(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Universe name is required.')
  const name = value.trim().replace(/[\r\n\t]+/g, ' ').slice(0, 80)
  if (!name) throw new Error('Universe name is required.')
  return name
}

function normalizeOutputMode(value: unknown): UniverseOutputMode {
  if (value !== 'broadcast' && value !== 'unicast') {
    throw new Error('Output mode must be broadcast or unicast.')
  }
  return value
}

function normalizeNullableString(value: unknown, maxLength = 200): string | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'string') return null
  const normalized = value.trim().slice(0, maxLength)
  return normalized || null
}

function normalizeInput(input: UniverseInput): UniverseInput {
  if (!input || typeof input !== 'object') throw new Error('Universe data is required.')

  const outputMode = normalizeOutputMode(input.outputMode)
  const targetNodeId = normalizeNullableString(input.targetNodeId)
  const targetNodeMac = normalizeNullableString(input.targetNodeMac, 32)
  const targetNodeIp = normalizeNullableString(input.targetNodeIp, 64)

  if (outputMode === 'unicast' && (!targetNodeId || !targetNodeIp)) {
    throw new Error('Unicast mode requires an assigned Art-Net node.')
  }

  return {
    name: normalizeName(input.name),
    net: assertIntegerRange('Net', input.net, 0, 127),
    subNet: assertIntegerRange('Sub-Net', input.subNet, 0, 15),
    universe: assertIntegerRange('Universe', input.universe, 0, 15),
    enabled: Boolean(input.enabled),
    outputMode,
    targetNodeId,
    targetNodeMac,
    targetNodeIp
  }
}

function zeroChannels(): number[] {
  return Array.from({ length: CHANNEL_COUNT }, () => 0)
}

function sanitizeChannels(value: unknown): number[] {
  if (!Array.isArray(value)) return zeroChannels()

  const channels = zeroChannels()
  for (let index = 0; index < Math.min(value.length, CHANNEL_COUNT); index += 1) {
    const channelValue = Number(value[index])
    channels[index] =
      Number.isInteger(channelValue) && channelValue >= 0 && channelValue <= 255
        ? channelValue
        : 0
  }
  return channels
}

function sanitizeStoredUniverse(value: unknown): UniverseDefinition | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Partial<UniverseDefinition>

  try {
    const input = normalizeInput({
      name: raw.name ?? '',
      net: raw.net ?? -1,
      subNet: raw.subNet ?? -1,
      universe: raw.universe ?? -1,
      enabled: Boolean(raw.enabled),
      outputMode: raw.outputMode ?? 'broadcast',
      targetNodeId: raw.targetNodeId ?? null,
      targetNodeMac: raw.targetNodeMac ?? null,
      targetNodeIp: raw.targetNodeIp ?? null
    })

    const expectedPortAddress = calculatePortAddress(input.net, input.subNet, input.universe)
    const now = Date.now()

    return {
      id: typeof raw.id === 'string' && raw.id.trim() ? raw.id : randomUUID(),
      ...input,
      portAddress: expectedPortAddress,
      channels: sanitizeChannels(raw.channels),
      createdAt: Number.isFinite(raw.createdAt) ? Number(raw.createdAt) : now,
      updatedAt: Number.isFinite(raw.updatedAt) ? Number(raw.updatedAt) : now
    }
  } catch {
    return null
  }
}

async function readAll(): Promise<UniverseDefinition[]> {
  try {
    const data = JSON.parse(await readFile(universeFile(), 'utf8')) as unknown
    if (!Array.isArray(data)) return []

    const seenAddresses = new Set<number>()
    const universes: UniverseDefinition[] = []

    for (const item of data) {
      const universe = sanitizeStoredUniverse(item)
      if (!universe || seenAddresses.has(universe.portAddress)) continue
      seenAddresses.add(universe.portAddress)
      universes.push(universe)
    }

    return universes.sort((a, b) => a.portAddress - b.portAddress)
  } catch {
    return []
  }
}

async function writeAll(universes: UniverseDefinition[]): Promise<void> {
  const file = universeFile()
  await mkdir(dirname(file), { recursive: true })
  const sorted = [...universes].sort((a, b) => a.portAddress - b.portAddress)
  await writeFile(file, `${JSON.stringify(sorted, null, 2)}\n`, 'utf8')
}

function assertUniquePortAddress(
  universes: UniverseDefinition[],
  portAddress: number,
  excludingId: string | null = null
): void {
  const conflict = universes.find(
    (item) => item.portAddress === portAddress && item.id !== excludingId
  )
  if (!conflict) return

  const address = decodePortAddress(portAddress)
  throw new Error(
    `Port-Address ${address.net}:${address.subNet}:${address.universe} is already used by "${conflict.name}".`
  )
}

function nextFreePortAddress(universes: UniverseDefinition[], start: number): number {
  const used = new Set(universes.map((item) => item.portAddress))
  for (let offset = 1; offset <= MAX_PORT_ADDRESS; offset += 1) {
    const candidate = (start + offset) & MAX_PORT_ADDRESS
    if (!used.has(candidate)) return candidate
  }
  throw new Error('No free Art-Net Port-Address is available.')
}

export async function listUniverses(): Promise<UniverseDefinition[]> {
  return readAll()
}

export async function createUniverse(input: UniverseInput): Promise<UniverseDefinition> {
  const normalized = normalizeInput(input)
  const universes = await readAll()
  const portAddress = calculatePortAddress(normalized.net, normalized.subNet, normalized.universe)

  assertUniquePortAddress(universes, portAddress)

  const now = Date.now()
  const universe: UniverseDefinition = {
    id: randomUUID(),
    ...normalized,
    portAddress,
    channels: zeroChannels(),
    createdAt: now,
    updatedAt: now
  }

  await writeAll([...universes, universe])
  return universe
}

export async function updateUniverse(id: string, input: UniverseInput): Promise<UniverseDefinition> {
  const normalized = normalizeInput(input)
  const universes = await readAll()
  const index = universes.findIndex((item) => item.id === id)
  if (index < 0) throw new Error('Universe not found.')

  const portAddress = calculatePortAddress(normalized.net, normalized.subNet, normalized.universe)
  assertUniquePortAddress(universes, portAddress, id)

  const updated: UniverseDefinition = {
    ...universes[index],
    ...normalized,
    portAddress,
    updatedAt: Date.now()
  }

  universes[index] = updated
  await writeAll(universes)
  return updated
}

export async function deleteUniverse(id: string): Promise<void> {
  const universes = await readAll()
  const next = universes.filter((item) => item.id !== id)
  if (next.length === universes.length) throw new Error('Universe not found.')
  await writeAll(next)
}

export async function duplicateUniverse(id: string): Promise<UniverseDefinition> {
  const universes = await readAll()
  const source = universes.find((item) => item.id === id)
  if (!source) throw new Error('Universe not found.')

  const portAddress = nextFreePortAddress(universes, source.portAddress)
  const address = decodePortAddress(portAddress)
  const now = Date.now()

  const duplicated: UniverseDefinition = {
    ...source,
    id: randomUUID(),
    name: `${source.name} Copy`.slice(0, 80),
    net: address.net,
    subNet: address.subNet,
    universe: address.universe,
    portAddress,
    enabled: false,
    channels: [...source.channels],
    createdAt: now,
    updatedAt: now
  }

  await writeAll([...universes, duplicated])
  return duplicated
}

export async function resetUniverse(id: string): Promise<UniverseDefinition> {
  const universes = await readAll()
  const index = universes.findIndex((item) => item.id === id)
  if (index < 0) throw new Error('Universe not found.')

  const updated: UniverseDefinition = {
    ...universes[index],
    channels: zeroChannels(),
    updatedAt: Date.now()
  }

  universes[index] = updated
  await writeAll(universes)
  return updated
}

export async function setUniverseChannel(update: UniverseChannelUpdate): Promise<UniverseDefinition> {
  if (!update || typeof update !== 'object') throw new Error('Channel update is required.')
  const channel = assertIntegerRange('Channel', update.channel, 1, CHANNEL_COUNT)
  const value = assertIntegerRange('Channel value', update.value, 0, 255)

  const universes = await readAll()
  const index = universes.findIndex((item) => item.id === update.universeId)
  if (index < 0) throw new Error('Universe not found.')

  const channels = [...universes[index].channels]
  channels[channel - 1] = value

  const updated: UniverseDefinition = {
    ...universes[index],
    channels,
    updatedAt: Date.now()
  }

  universes[index] = updated
  await writeAll(universes)
  return updated
}
