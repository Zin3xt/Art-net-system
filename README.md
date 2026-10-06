# Art-Net Lighting Controller

Electron desktop lighting-control system being developed in phases.

## Current development status

### Phase 1 — Electron Foundation
- Electron + React + TypeScript + Vite
- secure renderer/preload/main architecture
- local settings and logging

### Phase 2 — Network Interface Management
- native IPv4 adapter discovery
- Art-Net NIC selection
- IP / CIDR / subnet / broadcast information

### Phase 3 — Art-Net Core Discovery
- UDP 6454 lifecycle
- ArtPoll / ArtPollReply
- node discovery and packet parsing

### Phase 4 — Art-Net Node Monitoring
- Healthy / Stale / Offline device health
- ESP32 monitoring
- port mapping and node capabilities
- monitoring event history

### Phase 5 — Universe Engine
Implemented on `feature/phase5-universe-engine`:

- persistent universe definitions in Electron userData
- exactly 512 channels per universe
- Net range 0–127
- Sub-Net range 0–15
- Universe range 0–15
- calculated 15-bit Art-Net Port-Address
- duplicate Port-Address prevention
- create / edit / delete / duplicate universes
- universe enable / disable flag
- broadcast or unicast destination mode
- discovered ESP32 / Art-Net node assignment for unicast
- persisted node ID, MAC and last-known IP
- MAC-first ESP32 target resolution so DHCP IP changes can recover
- 512-channel zero/reset buffer
- native channel value validation 0–255
- channel buffer preview
- universe readiness / target-offline indicators
- duplicate universes are created disabled for safety

**ArtDmx serialization and physical output are not implemented in Phase 5.**

## Requirements

Use Node.js 22.12+ or another version supported by the installed electron-vite release.

## Run

```bash
npm install
npm run typecheck
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Phase 5 workflow

1. Open **Network** and start Art-Net discovery.
2. Confirm the ESP32 appears under **Nodes**.
3. Open **Universes**.
4. Create a universe.
5. Set Net / Sub-Net / Universe.
6. Choose **Unicast** to assign the ESP32, or **Broadcast** for subnet broadcast mode.
7. Enable the universe configuration.
8. The universe remains marked **ArtDmx locked** until the realtime output phase.

## Art-Net addressing

A Port-Address is a 15-bit value composed of:

- Net: 0–127
- Sub-Net: 0–15
- Universe: 0–15

Each logical universe contains 512 DMX channel values.

## Persistence

Universe configuration and channel buffers are stored in Electron's userData directory as `universes.json`.

## Acceptance checklists

- `PHASE1-CHECKLIST.md`
- `PHASE2-CHECKLIST.md`
- `PHASE3-CHECKLIST.md`
- `PHASE4-CHECKLIST.md`
- `PHASE5-CHECKLIST.md`

## Safety

Phase 5 still sends discovery traffic only. It does not send ArtDmx or fixture/channel levels to the ESP32.

## Next phase

Phase 6 — Realtime DMX Output Engine:
- ArtDmx serialization
- dedicated output loop
- configurable output frame rate
- explicit Output Enable
- repeated Blackout frames
- broadcast / unicast transmission
- output watchdog and graceful shutdown
