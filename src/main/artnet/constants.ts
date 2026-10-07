export const ARTNET_PORT = 0x1936
export const ARTNET_ID = Buffer.from([0x41, 0x72, 0x74, 0x2d, 0x4e, 0x65, 0x74, 0x00])
export const ARTNET_PROTOCOL_VERSION = 14

export const OP_POLL = 0x2000
export const OP_POLL_REPLY = 0x2100
export const OP_DMX = 0x5000

export const ART_POLL_INTERVAL_MS = 2750
export const ART_POLL_REPLY_WINDOW_MS = 3000
export const ART_NODE_STALE_MS = 5500
export const ART_NODE_OFFLINE_MS = 11000
export const ART_NODE_RETENTION_MS = 60000
export const ART_NODE_EVENT_LIMIT = 250

export const DMX_CHANNELS_PER_UNIVERSE = 512
export const DMX_OUTPUT_TICK_HZ = 30
export const DMX_KEEPALIVE_MS = 900
export const DMX_BLACKOUT_REPEAT_MS = 100
export const DMX_MAX_SEND_ERRORS = 3
