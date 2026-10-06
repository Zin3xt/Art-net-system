# Art-Net Lighting Controller

Electron desktop lighting-control system being developed in phases.

## Current development status

### Phase 1 — Electron Foundation
Implemented:

- Electron + React + TypeScript + Vite
- Tailwind CSS console-style UI
- secure preload/contextBridge API
- context isolation and renderer sandbox
- local settings persistence
- local application logging
- Dashboard and Settings workspaces

### Phase 2 — Network Interface Management
Implemented on `feature/phase2-network-interface-management`:

- native IPv4 network-adapter discovery
- Ethernet / Wi-Fi / virtual / loopback classification where identifiable
- IPv4, CIDR and subnet-mask display
- broadcast-address calculation
- preferred Art-Net NIC selection
- preference persistence
- automatic adapter refresh every 2.5 seconds
- adapter disconnect/reconnect visibility
- loopback protection

Phase 2 does **not** open UDP port 6454 or send Art-Net packets.

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

## Phase 2 acceptance

See `PHASE2-CHECKLIST.md`.

## Next phase

Phase 3 — Art-Net Core Engine:

- resolve the preferred local IPv4 interface
- safe UDP socket lifecycle
- UDP port 6454
- ArtPoll packet encoding
- ArtPollReply parsing
- broadcast discovery
- unicast/broadcast foundation
- packet validation and logging
