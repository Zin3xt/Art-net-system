import { createSocket, type RemoteInfo, type Socket } from 'node:dgram'
import type {
  ArtNetEngineStatus,
  ArtNetNode,
  ArtNetNodeEvent,
  ArtNetNodeEventSeverity,
  ArtNetNodeEventType,
  ArtNetNodeHealth,
  NetworkAdapter
} from '../../shared/types'
import {
  ARTNET_PORT,
  ART_NODE_EVENT_LIMIT,
  ART_NODE_OFFLINE_MS,
  ART_NODE_RETENTION_MS,
  ART_NODE_STALE_MS,
  ART_POLL_INTERVAL_MS
} from './constants'
import { createArtPollPacket } from './packets'
import { parseArtPollReply } from './parser'
import { logger } from '../services/logger'
import { listNetworkAdapters } from '../services/network'
import { readSettings } from '../services/settings'

type EngineState = ArtNetEngineStatus['state']

function monitoringSignature(node: ArtNetNode): string {
  return JSON.stringify({
    ip: node.ip,
    shortName: node.shortName,
    longName: node.longName,
    nodeReport: node.nodeReport,
    firmwareVersion: node.firmwareVersion,
    oemCode: node.oemCode,
    style: node.style,
    mac: node.mac,
    bindIp: node.bindIp,
    bindIndex: node.bindIndex,
    numPorts: node.numPorts,
    ports: node.ports,
    rdmCapable: node.rdmCapable,
    sacnCapable: node.sacnCapable
  })
}

class ArtNetEngine {
  private socket: Socket | null = null
  private pollTimer: NodeJS.Timeout | null = null
  private state: EngineState = 'stopped'
  private selectedAdapter: NetworkAdapter | null = null
  private nodes = new Map<string, ArtNetNode>()
  private events: ArtNetNodeEvent[] = []
  private eventSequence = 0
  private startedAt: number | null = null
  private lastPollAt: number | null = null
  private lastError: string | null = null
  private packetsSent = 0
  private packetsReceived = 0

  getStatus(): ArtNetEngineStatus {
    const nodes = this.getNodes()
    const healthyNodes = nodes.filter((node) => node.health === 'healthy').length
    const staleNodes = nodes.filter((node) => node.health === 'stale').length
    const offlineNodes = nodes.filter((node) => node.health === 'offline').length

    return {
      state: this.state,
      interfaceName: this.selectedAdapter?.name ?? null,
      localAddress: this.selectedAdapter?.address ?? null,
      broadcastAddress: this.selectedAdapter?.broadcast ?? null,
      port: ARTNET_PORT,
      startedAt: this.startedAt,
      lastPollAt: this.lastPollAt,
      packetsSent: this.packetsSent,
      packetsReceived: this.packetsReceived,
      healthyNodes,
      staleNodes,
      offlineNodes,
      onlineNodes: healthyNodes + staleNodes,
      totalNodes: nodes.length,
      lastError: this.lastError
    }
  }

  getNodes(): ArtNetNode[] {
    const now = Date.now()

    for (const [id, node] of this.nodes.entries()) {
      const age = now - node.lastSeenAt

      if (age > ART_NODE_RETENTION_MS) {
        this.addEvent(
          'node-removed',
          'info',
          node,
          `${node.longName} removed from the monitor after retention expired.`
        )
        this.nodes.delete(id)
        continue
      }

      if (this.state !== 'running' || (this.startedAt !== null && node.lastSeenAt < this.startedAt)) {
        node.health = 'offline'
        node.online = false
        continue
      }

      const nextHealth = this.healthForAge(age)
      if (nextHealth !== node.health) {
        const previousHealth = node.health
        node.health = nextHealth
        node.online = nextHealth !== 'offline'

        if (nextHealth === 'stale') {
          this.addEvent(
            'node-stale',
            'warning',
            node,
            `${node.longName} is stale; no recent ArtPollReply has been received.`,
            `Previous health: ${previousHealth}`
          )
        } else if (nextHealth === 'offline') {
          this.addEvent(
            'node-offline',
            'warning',
            node,
            `${node.longName} is offline.`,
            `Last reply was ${age} ms ago.`
          )
        }
      }
    }

    return Array.from(this.nodes.values()).sort((a, b) => {
      const healthOrder: Record<ArtNetNodeHealth, number> = {
        healthy: 0,
        stale: 1,
        offline: 2
      }
      const byHealth = healthOrder[a.health] - healthOrder[b.health]
      if (byHealth !== 0) return byHealth
      return a.ip.localeCompare(b.ip, undefined, { numeric: true })
    })
  }

  getEvents(): ArtNetNodeEvent[] {
    return [...this.events]
  }

  clearEvents(): void {
    this.events = []
  }

  async start(): Promise<ArtNetEngineStatus> {
    if (this.state === 'running') return this.getStatus()
    if (this.state === 'starting') throw new Error('Art-Net engine is already starting.')

    this.state = 'starting'
    this.lastError = null

    try {
      const settings = await readSettings()
      if (!settings.preferredNetworkInterface) {
        throw new Error('Select an Art-Net network interface before starting discovery.')
      }

      const adapter = listNetworkAdapters().find(
        (item) => item.name === settings.preferredNetworkInterface && item.usableForArtNet
      )

      if (!adapter) {
        throw new Error(`Selected network interface "${settings.preferredNetworkInterface}" is not currently available.`)
      }

      if (!adapter.broadcast) {
        throw new Error(`Unable to calculate a broadcast address for "${adapter.name}".`)
      }

      const socket = createSocket({ type: 'udp4', reuseAddr: false })
      this.socket = socket
      this.selectedAdapter = adapter

      socket.on('message', (message, remote) => this.handleMessage(message, remote))
      socket.on('error', (error) => {
        this.lastError = error.message
        this.addEvent(
          'socket-error',
          'error',
          null,
          `Art-Net UDP socket error: ${error.message}`
        )
        void logger.error(`Art-Net UDP error: ${error.message}`)
      })

      await this.bindSocket(socket, adapter.address)
      socket.setBroadcast(true)

      this.state = 'running'
      this.startedAt = Date.now()
      this.packetsSent = 0
      this.packetsReceived = 0

      this.addEvent(
        'engine-started',
        'info',
        null,
        `Art-Net discovery started on ${adapter.name}.`,
        `${adapter.address} → ${adapter.broadcast} UDP ${ARTNET_PORT}`
      )

      await logger.info(
        `Art-Net discovery started on ${adapter.name} (${adapter.address}) UDP ${ARTNET_PORT}, broadcast ${adapter.broadcast}.`
      )

      await this.poll()
      this.pollTimer = setInterval(() => {
        void this.poll().catch((error) => {
          const message = error instanceof Error ? error.message : String(error)
          this.lastError = message
          void logger.warn(`ArtPoll transmission failed: ${message}`)
        })
      }, ART_POLL_INTERVAL_MS)

      return this.getStatus()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.lastError = message
      this.state = 'error'
      await this.closeSocket()
      this.addEvent('socket-error', 'error', null, `Unable to start Art-Net discovery: ${message}`)
      await logger.error(`Unable to start Art-Net discovery: ${message}`)
      throw error
    }
  }

  async stop(): Promise<ArtNetEngineStatus> {
    const wasActive = this.state !== 'stopped' || this.socket !== null

    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }

    await this.closeSocket()
    this.state = 'stopped'
    this.startedAt = null
    this.lastPollAt = null
    this.selectedAdapter = null

    for (const node of this.nodes.values()) {
      node.health = 'offline'
      node.online = false
    }

    if (wasActive) {
      this.addEvent('engine-stopped', 'info', null, 'Art-Net discovery stopped.')
      await logger.info('Art-Net discovery stopped.')
    }

    return this.getStatus()
  }

  async poll(): Promise<ArtNetEngineStatus> {
    if (this.state !== 'running' || !this.socket || !this.selectedAdapter?.broadcast) {
      throw new Error('Art-Net discovery is not running.')
    }

    const packet = createArtPollPacket()
    await new Promise<void>((resolve, reject) => {
      this.socket!.send(packet, ARTNET_PORT, this.selectedAdapter!.broadcast!, (error) => {
        if (error) reject(error)
        else resolve()
      })
    })

    this.packetsSent += 1
    this.lastPollAt = Date.now()
    return this.getStatus()
  }

  private async bindSocket(socket: Socket, address: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const onError = (error: Error) => {
        socket.off('listening', onListening)
        reject(error)
      }

      const onListening = () => {
        socket.off('error', onError)
        resolve()
      }

      socket.once('error', onError)
      socket.once('listening', onListening)
      socket.bind(ARTNET_PORT, address)
    })
  }

  private handleMessage(message: Buffer, remote: RemoteInfo): void {
    this.packetsReceived += 1
    const node = parseArtPollReply(message, remote.address)
    if (!node) return

    const previous = this.nodes.get(node.id)
    if (!previous) {
      this.nodes.set(node.id, node)
      this.addEvent(
        'node-discovered',
        'info',
        node,
        `Discovered ${node.longName} at ${node.ip}.`,
        node.mac ? `MAC ${node.mac}` : null
      )
      return
    }

    const changed = monitoringSignature(previous) !== monitoringSignature(node)
    const previousHealth = previous.health
    const now = node.lastSeenAt
    const nextNode: ArtNetNode = {
      ...previous,
      ...node,
      firstSeenAt: previous.firstSeenAt,
      lastSeenAt: now,
      lastChangedAt: changed ? now : previous.lastChangedAt,
      responseCount: previous.responseCount + 1,
      health: 'healthy',
      online: true
    }

    this.nodes.set(node.id, nextNode)

    if (previousHealth === 'stale' || previousHealth === 'offline') {
      this.addEvent(
        'node-recovered',
        'info',
        nextNode,
        `${nextNode.longName} recovered and is responding again.`,
        `Previous health: ${previousHealth}`
      )
    }

    if (changed) {
      this.addEvent(
        'node-changed',
        'info',
        nextNode,
        `${nextNode.longName} changed its ArtPollReply configuration.`,
        'Name, firmware, capability, binding, report, or port mapping changed.'
      )
    }
  }

  private healthForAge(age: number): ArtNetNodeHealth {
    if (age <= ART_NODE_STALE_MS) return 'healthy'
    if (age <= ART_NODE_OFFLINE_MS) return 'stale'
    return 'offline'
  }

  private addEvent(
    type: ArtNetNodeEventType,
    severity: ArtNetNodeEventSeverity,
    node: ArtNetNode | null,
    message: string,
    details: string | null = null
  ): void {
    const timestamp = Date.now()
    const event: ArtNetNodeEvent = {
      id: `${timestamp}-${++this.eventSequence}`,
      timestamp,
      type,
      severity,
      nodeId: node?.id ?? null,
      nodeName: node?.longName ?? null,
      message,
      details
    }

    this.events.unshift(event)
    if (this.events.length > ART_NODE_EVENT_LIMIT) {
      this.events.length = ART_NODE_EVENT_LIMIT
    }
  }

  private async closeSocket(): Promise<void> {
    if (!this.socket) return

    const socket = this.socket
    this.socket = null

    await new Promise<void>((resolve) => {
      try {
        socket.close(() => resolve())
      } catch {
        resolve()
      }
    })
  }
}

export const artNetEngine = new ArtNetEngine()
