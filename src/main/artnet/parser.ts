import { ARTNET_ID, ARTNET_PORT, OP_POLL_REPLY } from './constants'
import type { ArtNetNode, ArtNetPort } from '../../shared/types'

function readCString(buffer: Buffer, offset: number, length: number): string {
  const end = Math.min(offset + length, buffer.length)
  const slice = buffer.subarray(offset, end)
  const zero = slice.indexOf(0)
  return slice.subarray(0, zero >= 0 ? zero : slice.length).toString('utf8').trim()
}

function bytesToIp(bytes: Buffer): string {
  if (bytes.length < 4) return '0.0.0.0'
  return `${bytes[0]}.${bytes[1]}.${bytes[2]}.${bytes[3]}`
}

function bytesToMac(bytes: Buffer): string | null {
  if (bytes.length < 6 || bytes.every((byte) => byte === 0)) return null
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join(':')
    .toUpperCase()
}

function styleName(style: number): string {
  const styles: Record<number, string> = {
    0x00: 'Node',
    0x01: 'Controller',
    0x02: 'Media Server',
    0x03: 'Router',
    0x04: 'Backup',
    0x05: 'Configuration',
    0x06: 'Visualiser'
  }
  return styles[style] ?? `Unknown (0x${style.toString(16).padStart(2, '0')})`
}

function buildPortAddresses(
  netSwitch: number,
  subSwitch: number,
  portTypes: number[],
  swIn: number[],
  swOut: number[]
): ArtNetPort[] {
  return portTypes.map((type, index) => {
    const canInput = (type & 0x40) !== 0
    const canOutput = (type & 0x80) !== 0
    const base = ((netSwitch & 0x7f) << 8) | ((subSwitch & 0x0f) << 4)

    return {
      index: index + 1,
      canInput,
      canOutput,
      inputPortAddress: canInput ? base | (swIn[index] & 0x0f) : null,
      outputPortAddress: canOutput ? base | (swOut[index] & 0x0f) : null,
      protocol: type & 0x3f
    }
  })
}

export function isArtNetPacket(buffer: Buffer): boolean {
  return buffer.length >= 10 && buffer.subarray(0, 8).equals(ARTNET_ID)
}

export function parseArtPollReply(buffer: Buffer, remoteAddress: string, now = Date.now()): ArtNetNode | null {
  if (buffer.length < 207 || !isArtNetPacket(buffer)) return null
  if (buffer.readUInt16LE(8) !== OP_POLL_REPLY) return null

  const reportedIp = bytesToIp(buffer.subarray(10, 14))
  const port = buffer.readUInt16LE(14)
  if (port !== ARTNET_PORT) return null

  const firmwareVersion = (buffer[16] << 8) | buffer[17]
  const netSwitch = buffer[18]
  const subSwitch = buffer[19]
  const oemCode = (buffer[20] << 8) | buffer[21]
  const status1 = buffer[23]
  const shortName = readCString(buffer, 26, 18)
  const longName = readCString(buffer, 44, 64)
  const nodeReport = readCString(buffer, 108, 64)
  const numPorts = Math.min(((buffer[172] << 8) | buffer[173]), 4)
  const portTypes = Array.from(buffer.subarray(174, 178))
  const swIn = Array.from(buffer.subarray(186, 190))
  const swOut = Array.from(buffer.subarray(190, 194))
  const style = buffer[200]
  const mac = bytesToMac(buffer.subarray(201, 207))
  const bindIp = buffer.length >= 211 ? bytesToIp(buffer.subarray(207, 211)) : null
  const bindIndex = buffer.length >= 212 ? buffer[211] : 0
  const status2 = buffer.length >= 213 ? buffer[212] : 0

  const ports = buildPortAddresses(netSwitch, subSwitch, portTypes, swIn, swOut).slice(0, numPorts)

  return {
    id: `${reportedIp}|${bindIndex}|${mac ?? remoteAddress}`,
    ip: reportedIp,
    remoteAddress,
    port,
    shortName: shortName || '(unnamed)',
    longName: longName || shortName || '(unnamed Art-Net node)',
    nodeReport,
    firmwareVersion,
    oemCode,
    style,
    styleName: styleName(style),
    mac,
    bindIp: bindIp === '0.0.0.0' ? null : bindIp,
    bindIndex,
    numPorts,
    ports,
    rdmCapable: (status1 & 0x02) !== 0,
    sacnCapable: (status2 & 0x10) !== 0,
    firstSeenAt: now,
    lastSeenAt: now,
    lastChangedAt: now,
    responseCount: 1,
    health: 'healthy',
    online: true
  }
}
