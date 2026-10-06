export const IPC = {
  APP_INFO: 'app:get-info',
  APP_PING: 'app:ping',
  SETTINGS_GET: 'settings:get',
  SETTINGS_SAVE: 'settings:save',
  NETWORK_LIST: 'network:list-adapters',
  ARTNET_START: 'artnet:start',
  ARTNET_STOP: 'artnet:stop',
  ARTNET_POLL: 'artnet:poll',
  ARTNET_STATUS: 'artnet:status',
  ARTNET_NODES: 'artnet:nodes',
  LOG_INFO: 'log:info',
  LOG_WARN: 'log:warn',
  LOG_ERROR: 'log:error'
} as const
