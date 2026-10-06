import { ARTNET_ID, ARTNET_PROTOCOL_VERSION, OP_POLL } from './constants'

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
