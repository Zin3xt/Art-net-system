import {
  ARTNET_ID,
  ARTNET_PROTOCOL_VERSION,
  DMX_CHANNELS_PER_UNIVERSE,
  OP_DMX,
  OP_POLL
} from './constants'

export function createArtPollPacket(): Buffer {
  const packet = Buffer.alloc(14)

  ARTNET_ID.copy(packet, 0)
  packet.writeUInt16LE(OP_POLL, 8)
  packet.writeUInt8((ARTNET_PROTOCOL_VERSION >> 8) & 0xff, 10)
  packet.writeUInt8(ARTNET_PROTOCOL_VERSION & 0xff, 11)

  // Bit 1 requests ArtPollReply when node conditions change.
  // Diagnostics and Targeted Mode stay disabled.
  packet.writeUInt8(0x02, 12)
  packet.writeUInt8(0x00, 13)

  return packet
}

export function createArtDmxPacket(
  portAddress: number,
  sequence: number,
  channels: readonly number[],
  physical = 0
): Buffer {
  if (!Number.isInteger(portAddress) || portAddress < 0 || portAddress > 0x7fff) {
    throw new Error('ArtDmx Port-Address must be an integer from 0 to 32767.')
  }

  if (!Number.isInteger(sequence) || sequence < 1 || sequence > 255) {
    throw new Error('ArtDmx sequence must be an integer from 1 to 255.')
  }

  if (!Number.isInteger(physical) || physical < 0 || physical > 255) {
    throw new Error('ArtDmx physical port must be an integer from 0 to 255.')
  }

  const data = Buffer.alloc(DMX_CHANNELS_PER_UNIVERSE)
  for (let index = 0; index < DMX_CHANNELS_PER_UNIVERSE; index += 1) {
    const value = Number(channels[index] ?? 0)
    data[index] = Number.isInteger(value) && value >= 0 && value <= 255 ? value : 0
  }

  const packet = Buffer.alloc(18 + DMX_CHANNELS_PER_UNIVERSE)
  ARTNET_ID.copy(packet, 0)
  packet.writeUInt16LE(OP_DMX, 8)
  packet.writeUInt8((ARTNET_PROTOCOL_VERSION >> 8) & 0xff, 10)
  packet.writeUInt8(ARTNET_PROTOCOL_VERSION & 0xff, 11)
  packet.writeUInt8(sequence, 12)
  packet.writeUInt8(physical, 13)
  packet.writeUInt8(portAddress & 0xff, 14)
  packet.writeUInt8((portAddress >> 8) & 0x7f, 15)
  packet.writeUInt8((DMX_CHANNELS_PER_UNIVERSE >> 8) & 0xff, 16)
  packet.writeUInt8(DMX_CHANNELS_PER_UNIVERSE & 0xff, 17)
  data.copy(packet, 18)

  return packet
}
