import type {
  ArtNetNode,
  DmxOutputState,
  DmxOutputStatus,
  DmxUniverseRouteStatus,
  UniverseDefinition
} from '../../shared/types'
import {
  DMX_BLACKOUT_REPEAT_MS,
  DMX_KEEPALIVE_MS,
  DMX_MAX_SEND_ERRORS,
  DMX_OUTPUT_TICK_HZ
} from './constants'
import { artNetEngine } from './engine'
import { createArtDmxPacket } from './packets'
import { logger } from '../services/logger'
import { listUniverses } from '../services/universes'

interface RouteRuntime {
  sequence: number
  framesSent: number
  lastSentAt: number | null
  lastVersion: number | null
}

interface ResolvedRoute {
  universe: UniverseDefinition
  node: ArtNetNode | null
  eligible: boolean
  subscribed: boolean
  reason: string | null
  targetIp: string | null
}

class DmxOutputEngine {
  private state: DmxOutputState = 'disabled'
  private blackout = false
  private timer: NodeJS.Timeout | null = null
  private tickBusy = false
  private universes: UniverseDefinition[] = []
  private runtime = new Map<string, RouteRuntime>()
  private packetsSent = 0
  private framesSent = 0
  private startedAt: number | null = null
  private lastFrameAt: number | null = null
  private lastError: string | null = null
  private consecutiveSendErrors = 0
  private masterPercent = 100

  getStatus(): DmxOutputStatus {
    const routes = this.resolveRoutes()
    return {
      state: this.state,
      outputEnabled: this.state === 'enabled' || this.state === 'blackout',
      blackout: this.blackout,
      tickHz: DMX_OUTPUT_TICK_HZ,
      keepAliveMs: DMX_KEEPALIVE_MS,
      masterPercent: this.masterPercent,
      packetsSent: this.packetsSent,
      framesSent: this.framesSent,
      universesTransmitted: routes.filter((route) => route.eligible).length,
      universesBlocked: routes.filter((route) => route.universe.enabled && !route.eligible).length,
      startedAt: this.startedAt,
      lastFrameAt: this.lastFrameAt,
      lastError: this.lastError
    }
  }

  getRoutes(): DmxUniverseRouteStatus[] {
    return this.resolveRoutes().map((route) => {
      const runtime = this.getRuntime(route.universe.id)
      return {
        universeId: route.universe.id,
        universeName: route.universe.name,
        portAddress: route.universe.portAddress,
        enabled: route.universe.enabled,
        eligible: route.eligible,
        reason: route.reason,
        targetNodeId: route.node?.id ?? route.universe.targetNodeId,
        targetNodeName: route.node?.longName ?? null,
        targetIp: route.targetIp,
        targetHealth: route.node?.health ?? null,
        subscribed: route.subscribed,
        sequence: runtime.sequence,
        framesSent: runtime.framesSent,
        lastSentAt: runtime.lastSentAt
      }
    })
  }

  async setMaster(percent: number): Promise<DmxOutputStatus> {
    if (!Number.isFinite(percent)) throw new Error('Master level must be a number from 0 to 100.')
    const normalized = Math.max(0, Math.min(100, Math.round(percent)))
    if (normalized === this.masterPercent) return this.getStatus()

    this.masterPercent = normalized
    for (const runtime of this.runtime.values()) {
      runtime.lastVersion = null
    }

    await logger.info(`DMX master level set to ${normalized}%.`)
    if (this.state === 'enabled') {
      await this.tick(true)
    }
    return this.getStatus()
  }

  async refreshUniverses(): Promise<void> {
    this.universes = await listUniverses()
    const ids = new Set(this.universes.map((universe) => universe.id))
    for (const id of this.runtime.keys()) {
      if (!ids.has(id)) this.runtime.delete(id)
    }
  }

  async enable(): Promise<DmxOutputStatus> {
    if (this.state === 'enabled' || this.state === 'blackout') return this.getStatus()
    if (this.state === 'enabling') throw new Error('DMX output is already enabling.')

    this.state = 'enabling'
    this.blackout = false
    this.lastError = null
    this.consecutiveSendErrors = 0

    try {
      const artnet = artNetEngine.getStatus()
      if (artnet.state !== 'running') {
        throw new Error('Start Art-Net discovery before enabling DMX output.')
      }

      await this.refreshUniverses()
      const routes = this.resolveRoutes()
      const eligible = routes.filter((route) => route.eligible)
      if (eligible.length === 0) {
        const firstBlocked = routes.find((route) => route.universe.enabled && route.reason)
        throw new Error(
          firstBlocked?.reason ??
          'No enabled unicast universe has a healthy subscribed Art-Net node.'
        )
      }

      this.state = 'enabled'
      this.startedAt = Date.now()
      this.packetsSent = 0
      this.framesSent = 0
      this.lastFrameAt = null
      this.startTimer()

      await logger.warn(
        `DMX OUTPUT ENABLED: ${eligible.length} Art-Net universe route(s) are eligible for live ArtDmx.`
      )

      await this.tick(true)
      return this.getStatus()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.state = 'error'
      this.lastError = message
      this.stopTimer()
      await logger.error(`Unable to enable DMX output: ${message}`)
      throw error
    }
  }

  async disable(): Promise<DmxOutputStatus> {
    const wasEnabled = this.state === 'enabled' || this.state === 'blackout'

    if (wasEnabled) {
      try {
        await this.sendSafetyBlackoutBurst()
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        await logger.warn(`Safety blackout burst encountered an error during output disable: ${message}`)
      }
    }

    this.stopTimer()
    this.blackout = false
    this.state = 'disabled'
    this.startedAt = null
    this.consecutiveSendErrors = 0

    if (wasEnabled) {
      await logger.warn('DMX OUTPUT DISABLED after safety zero-frame burst.')
    }

    return this.getStatus()
  }

  async blackoutOn(): Promise<DmxOutputStatus> {
    if (this.state !== 'enabled' && this.state !== 'blackout') {
      throw new Error('Enable DMX output before activating Blackout.')
    }

    this.blackout = true
    this.state = 'blackout'
    await logger.warn('BLACKOUT ACTIVE: sending repeated zero ArtDmx frames.')
    await this.tick(true)
    return this.getStatus()
  }

  async blackoutOff(): Promise<DmxOutputStatus> {
    if (this.state !== 'blackout') return this.getStatus()

    this.blackout = false
    this.state = 'enabled'
    for (const runtime of this.runtime.values()) {
      runtime.lastVersion = null
    }
    await logger.info('Blackout released; universe buffers will resume.')
    await this.tick(true)
    return this.getStatus()
  }

  private startTimer(): void {
    this.stopTimer()
    const intervalMs = Math.max(10, Math.round(1000 / DMX_OUTPUT_TICK_HZ))
    this.timer = setInterval(() => {
      void this.tick(false)
    }, intervalMs)
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  private async tick(force: boolean): Promise<void> {
    if (this.tickBusy || (this.state !== 'enabled' && this.state !== 'blackout')) return
    this.tickBusy = true

    try {
      const artnet = artNetEngine.getStatus()
      if (artnet.state !== 'running') {
        await this.failSafe('Art-Net discovery stopped while DMX output was enabled.')
        return
      }

      const now = Date.now()
      const routes = this.resolveRoutes()
      let sentThisTick = 0

      for (const route of routes) {
        if (!route.eligible || !route.targetIp) continue

        const runtime = this.getRuntime(route.universe.id)
        const dueForKeepalive =
          runtime.lastSentAt === null || now - runtime.lastSentAt >= DMX_KEEPALIVE_MS
        const dueForBlackout =
          this.blackout &&
          (runtime.lastSentAt === null || now - runtime.lastSentAt >= DMX_BLACKOUT_REPEAT_MS)
        const changed = runtime.lastVersion !== route.universe.updatedAt

        if (!force && !changed && !dueForKeepalive && !dueForBlackout) continue

        const channels = this.blackout
          ? ZERO_DMX
          : applyMaster(route.universe.channels, this.masterPercent)
        const sequence = nextSequence(runtime.sequence)
        const packet = createArtDmxPacket(
          route.universe.portAddress,
          sequence,
          channels
        )

        try {
          await artNetEngine.sendUnicastPacket(packet, route.targetIp)
          runtime.sequence = sequence
          runtime.framesSent += 1
          runtime.lastSentAt = now
          runtime.lastVersion = route.universe.updatedAt
          this.packetsSent += 1
          this.framesSent += 1
          sentThisTick += 1
          this.lastFrameAt = now
          this.consecutiveSendErrors = 0
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          this.consecutiveSendErrors += 1
          this.lastError = message
          await logger.error(
            `ArtDmx send failed for ${route.universe.name} → ${route.targetIp}: ${message}`
          )

          if (this.consecutiveSendErrors >= DMX_MAX_SEND_ERRORS) {
            await this.failSafe(
              `DMX output stopped after ${DMX_MAX_SEND_ERRORS} consecutive send errors: ${message}`
            )
            return
          }
        }
      }

      if (sentThisTick > 0) {
        this.lastError = null
      }
    } finally {
      this.tickBusy = false
    }
  }

  private async sendSafetyBlackoutBurst(): Promise<void> {
    const routes = this.resolveRoutes().filter((route) => route.eligible && route.targetIp)
    if (routes.length === 0) return

    for (let pass = 0; pass < 3; pass += 1) {
      for (const route of routes) {
        if (!route.targetIp) continue
        const runtime = this.getRuntime(route.universe.id)
        const sequence = nextSequence(runtime.sequence)
        const packet = createArtDmxPacket(route.universe.portAddress, sequence, ZERO_DMX)
        await artNetEngine.sendUnicastPacket(packet, route.targetIp)
        runtime.sequence = sequence
        runtime.framesSent += 1
        runtime.lastSentAt = Date.now()
        this.packetsSent += 1
        this.framesSent += 1
        this.lastFrameAt = runtime.lastSentAt
      }

      if (pass < 2) await delay(50)
    }
  }

  private async failSafe(message: string): Promise<void> {
    this.stopTimer()
    this.blackout = false
    this.state = 'error'
    this.lastError = message
    await logger.error(`DMX OUTPUT FAILSAFE: ${message}`)
  }

  private resolveRoutes(): ResolvedRoute[] {
    const nodes = artNetEngine.getNodes()
    return this.universes.map((universe) => {
      if (!universe.enabled) {
        return {
          universe,
          node: null,
          eligible: false,
          subscribed: false,
          reason: 'Universe is disabled.',
          targetIp: null
        }
      }

      if (universe.outputMode !== 'unicast') {
        return {
          universe,
          node: null,
          eligible: false,
          subscribed: false,
          reason: 'Art-Net 4 does not allow broadcast ArtDmx. Change this universe to Unicast.',
          targetIp: null
        }
      }

      const node =
        (universe.targetNodeMac
          ? nodes.find((item) => item.mac === universe.targetNodeMac)
          : null) ??
        (universe.targetNodeId
          ? nodes.find((item) => item.id === universe.targetNodeId)
          : null) ??
        (universe.targetNodeIp
          ? nodes.find((item) => item.ip === universe.targetNodeIp)
          : null) ??
        null

      if (!node) {
        return {
          universe,
          node: null,
          eligible: false,
          subscribed: false,
          reason: 'Assigned Art-Net node is not currently discovered.',
          targetIp: universe.targetNodeIp
        }
      }

      if (node.health !== 'healthy') {
        return {
          universe,
          node,
          eligible: false,
          subscribed: false,
          reason: `Target node is ${node.health}; live ArtDmx requires a healthy subscriber.`,
          targetIp: node.ip
        }
      }

      const subscribed = node.ports.some(
        (port) =>
          (port.canInput && port.inputPortAddress === universe.portAddress) ||
          (port.canOutput && port.outputPortAddress === universe.portAddress)
      )

      if (!subscribed) {
        return {
          universe,
          node,
          eligible: false,
          subscribed: false,
          reason:
            'Target node does not advertise this Port-Address in ArtPollReply SwIn/SwOut; ArtDmx is blocked.',
          targetIp: node.ip
        }
      }

      return {
        universe,
        node,
        eligible: true,
        subscribed: true,
        reason: null,
        targetIp: node.ip
      }
    })
  }

  private getRuntime(universeId: string): RouteRuntime {
    let runtime = this.runtime.get(universeId)
    if (!runtime) {
      runtime = {
        sequence: 0,
        framesSent: 0,
        lastSentAt: null,
        lastVersion: null
      }
      this.runtime.set(universeId, runtime)
    }
    return runtime
  }
}

const ZERO_DMX = Array.from({ length: 512 }, () => 0)

function nextSequence(current: number): number {
  if (current < 1 || current >= 255) return 1
  return current + 1
}

function applyMaster(channels: readonly number[], masterPercent: number): number[] {
  if (masterPercent >= 100) return Array.from(channels)
  if (masterPercent <= 0) return ZERO_DMX

  return channels.map((value) =>
    Math.max(0, Math.min(255, Math.round((value * masterPercent) / 100)))
  )
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

export const dmxOutputEngine = new DmxOutputEngine()
