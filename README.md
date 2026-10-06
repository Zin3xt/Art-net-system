# Art-Net Lighting Controller

Electron desktop lighting-control system being developed in phases.

## Current development status

### Phase 1 — Electron Foundation
Implemented:
- Electron + React + TypeScript + Vite
- Tailwind console UI
- secure preload/contextBridge
- local settings and logging

### Phase 2 — Network Interface Management
Implemented:
- IPv4 adapter discovery
- Art-Net NIC selection
- IP / CIDR / subnet / broadcast information
- interface persistence and reconnect visibility

### Phase 3 — Art-Net Core Discovery Engine
Implemented:
- UDP 6454 lifecycle
- ArtPoll and ArtPollReply
- automatic and manual discovery
- node identity / capability / port parsing
- packet counters
- safe Start / Stop

### Phase 4 — Art-Net Node Monitoring
Implemented on `feature/phase4-node-monitoring`:
- dedicated Nodes workspace
- Healthy / Stale / Offline states
- ESP32-friendly health timing
- first / last seen and last changed timestamps
- response count per node
- node search and health filters
- detailed node information
- Art-Net port / universe mapping
- RDM / sACN capability indicators
- node configuration-change detection
- discovery / stale / offline / recovery / change events
- engine and socket event history
- per-device history
- session monitoring history capped at 250 events

**ArtDmx and physical DMX output are still disabled.**

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

## Current workflow

1. Open **Network**.
2. Select the NIC connected to the ESP32 / Art-Net network.
3. Click **Start discovery**.
4. Open **Nodes**.
5. Select the ESP32 to inspect health, capabilities, port mapping and history.

## Health states

- Healthy: reply within 5.5 seconds
- Stale: reply older than 5.5 seconds and up to 11 seconds
- Offline: no reply for more than 11 seconds
- Retained for up to 60 seconds before removal

## Acceptance checklists

- `PHASE1-CHECKLIST.md`
- `PHASE2-CHECKLIST.md`
- `PHASE3-CHECKLIST.md`
- `PHASE4-CHECKLIST.md`

## Safety

The application currently sends Art-Net discovery traffic only. It does not send ArtDmx or fixture/channel levels.

## Next phase

Phase 5 — Universe Engine:
- create and manage universes
- 512-channel buffers
- Port-Address assignment
- node destination mapping
- broadcast/unicast mode
- universe enable/disable and status
