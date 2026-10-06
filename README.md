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

### Phase 2 — Network Interface Management
Implemented:

- native IPv4 network-adapter discovery
- Ethernet / Wi-Fi / virtual / loopback classification where identifiable
- IPv4, CIDR, subnet mask and broadcast information
- preferred Art-Net NIC selection and persistence
- adapter refresh / reconnect visibility
- loopback protection

### Phase 3 — Art-Net Core Discovery Engine
Implemented on `feature/phase3-artnet-core-engine`:

- UDP 6454 lifecycle bound to the selected local NIC
- ArtPoll packet creation
- ArtPoll broadcast every 2.75 seconds
- manual ArtPoll / Scan Now
- ArtPollReply validation and parsing
- discovered-node list
- node names, IP, MAC, style, firmware and OEM information
- Art-Net input/output Port-Address parsing
- RDM / sACN capability indicators
- online/offline node tracking
- packet TX/RX counters
- Start / Stop discovery controls
- safe port-binding and runtime error reporting

**Phase 3 is discovery only. It does not transmit ArtDmx or physical DMX values.**

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

## Acceptance checklists

- `PHASE1-CHECKLIST.md`
- `PHASE2-CHECKLIST.md`
- `PHASE3-CHECKLIST.md`

## Phase 3 workflow

1. Open **Network**.
2. Select the Ethernet or Wi-Fi adapter connected to the Art-Net network.
3. Click **Start discovery**.
4. The application binds UDP port 6454 to that adapter.
5. ArtPoll is broadcast every 2.75 seconds.
6. ArtPollReply packets populate the discovered-node list.
7. Click **Stop** before changing the selected NIC.

## Safety

ArtDmx is deliberately not implemented yet. Phase 3 sends only discovery traffic.

## Next phase

Phase 4 — Art-Net Node Discovery & Monitoring:

- richer node-health state
- device change detection
- node-detail view
- port/subscription visualization
- diagnostics and event history
