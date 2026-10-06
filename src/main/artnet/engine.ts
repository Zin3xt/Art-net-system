import { createSocket, type RemoteInfo, type Socket } from 'node:dgram'
import type { ArtNetEngineStatus, ArtNetNode, NetworkAdapter } from '../../shared/types'
import {
  ARTNET_PORT,
  ART_NODE_OFFLINE_MS,
  ART_NODE_RETENTION_MS,
  ART_POLL_INTERVAL_MS
} from './constants'
import { createArtPollPacket } from './packets'
import { parseArtPollReply } from './parser'
import { logger } from '../services/logger'
import { listNetworkAdapters } from '../services/network'
import { readSettings } from '../services/settings'

type EngineState = ArtNetEngineStatus['state']

class ArtNetEngine {
  private socket: Socket | null = null
  private pollTimer: NodeJS.Timeout | null = null
  private state: EngineState = 'stopped'
  private selectedAdapter: NetworkAdapter | null = null
  private nodes = new Map<string, ArtNetNode>()
  private startedAt: number | null = null
  private lastPollAt: number | null = null
  private lastError: string | null = null
  private packetsSent = 0
  private packetsReceived = 0

  getStatus(): ArtNetEngineStatus {
    const nodes = this.getNodes()
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
      onlineNodes: nodes.filter((node) => node.online).length,
      totalNodes: nodes.length,
      lastError: this.lastError
    }
  }

  getNodes(): ArtNetNode[] {
    const now = Date.now()

    for (const [id, node] of this.nodes.entries()) {
      const age = now - node.lastSeenAt
      if (age > ART_NODE_RETENTION_MS) {
        this.nodes.delete(id)
        continue
      }

      node.online = age <= ART_NODE_OFFLINE_MS
    }

    return Array.from(this.nodes.values()).sort((a, b) => {
      if (a.online !== b.online) return a.online ? -1 : 1
      return a.ip.localeCompare(b.ip, undefined, { numeric: true })
    })
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
        void logger.error(`Art-Net UDP error: ${error.message}`)
      })

      await this.bindSocket(socket, adapter.address)
      socket.setBroadcast(true)

      this.state = 'running'
      this.startedAt = Date.now()
      this.packetsSent = 0
      this.packetsReceived = 0

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
      await logger.error(`Unable to start Art-Net discovery: ${message}`)
      throw error
    }
  }

  async stop(): Promise<ArtNetEngineStatus> {
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
      node.online = false
    }

    await logger.info('Art-Net discovery stopped.')
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
    this.nodes.set(node.id, {
      ...previous,
      ...node,
      lastSeenAt: node.lastSeenAt,
      online: true
    })
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
