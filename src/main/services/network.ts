import { networkInterfaces } from 'node:os'
import type { NetworkAdapter, NetworkAdapterType } from '../../shared/types'

function ipv4ToUint(address: string): number | null {
  const parts = address.split('.').map(Number)
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return null
  }

  return (((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3]) >>> 0
}

function uintToIpv4(value: number): string {
  return [
    (value >>> 24) & 255,
    (value >>> 16) & 255,
    (value >>> 8) & 255,
    value & 255
  ].join('.')
}

export function calculateBroadcastAddress(address: string, netmask: string): string | null {
  const ip = ipv4ToUint(address)
  const mask = ipv4ToUint(netmask)
  if (ip === null || mask === null) return null

  const network = (ip & mask) >>> 0
  const broadcast = (network | (~mask >>> 0)) >>> 0
  return uintToIpv4(broadcast)
}

function classifyInterface(name: string, internal: boolean): NetworkAdapterType {
  if (internal) return 'loopback'

  const lower = name.toLowerCase()
  if (/wi-?fi|wireless|wlan|802\.11/.test(lower)) return 'wifi'
  if (/ethernet|eth\d*|enp\d|eno\d|enx|lan/.test(lower)) return 'ethernet'
  if (/vpn|tun|tap|wireguard|wg\d|tailscale|zerotier/.test(lower)) return 'virtual'
  return 'other'
}

export function listNetworkAdapters(): NetworkAdapter[] {
  const adapters: NetworkAdapter[] = []

  for (const [name, entries] of Object.entries(networkInterfaces())) {
    if (!entries) continue

    for (const entry of entries) {
      if (entry.family !== 'IPv4') continue

      const type = classifyInterface(name, entry.internal)
      adapters.push({
        id: `${name}|${entry.address}`,
        name,
        type,
        address: entry.address,
        netmask: entry.netmask,
        broadcast: calculateBroadcastAddress(entry.address, entry.netmask),
        cidr: entry.cidr ?? null,
        mac: entry.mac || null,
        internal: entry.internal,
        usableForArtNet: !entry.internal && entry.address !== '0.0.0.0'
      })
    }
  }

  return adapters.sort((a, b) => {
    if (a.usableForArtNet !== b.usableForArtNet) return a.usableForArtNet ? -1 : 1
    return a.name.localeCompare(b.name) || a.address.localeCompare(b.address)
  })
}
