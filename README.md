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

### Phase 3 — Art-Net Core Discovery
- UDP 6454
- ArtPoll / ArtPollReply
- node discovery and parsing

### Phase 4 — Art-Net Node Monitoring
- Healthy / Stale / Offline device health
- ESP32 monitoring
- port mapping and event history

### Phase 5 — Universe Engine
- persistent 512-channel buffers
- 15-bit Port-Address configuration
- ESP32 assignment
- universe create/edit/reset/duplicate

### Phase 6 — Realtime DMX Output Engine
Implemented on `feature/phase6-realtime-dmx-output`:

- ArtDmx OpCode `0x5000`
- Art-Net protocol version 14
- full 512-channel ArtDmx frames
- sequence numbers 1–255
- Port-Address encoded into SubUni + Net
- dedicated 30 Hz output scheduler
- changed frames transmit promptly
- unchanged data keepalive around 900 ms
- Art-Net 4 unicast-only output
- subscriber validation using ArtPollReply SwIn/SwOut-derived port mappings
- ESP32 target resolution by MAC / node ID / current IP
- explicit operator **ENABLE OUTPUT**
- output always disabled at application startup
- repeated Blackout zero frames every 100 ms
- disabling output sends a three-frame zero burst before stopping
- safe shutdown sends zero burst before closing Art-Net
- stop Art-Net automatically disables output first
- three consecutive send errors trigger output failsafe
- live route / subscription / sequence / frame counters
- single-channel diagnostic setter for Phase 6 hardware testing

## Important Art-Net 4 behavior

Current Art-Net 4 requires ArtDmx to be **unicast to subscribers**. Broadcast ArtDmx is not allowed.

A node is considered subscribed when the Port-Address is advertised in the node's ArtPollReply SwIn or SwOut information. Therefore the ESP32 firmware must report the universe it consumes, for example Port-Address `0:0:0`, before Phase 6 will transmit ArtDmx to it.

Legacy Phase 5 universes saved as `broadcast` are retained for migration but are blocked from live output. Edit them and convert to Unicast.

## Run

```bash
npm install
npm run typecheck
npm run dev
```

## Phase 6 test workflow

1. Start Art-Net discovery from **Network**.
2. Confirm the ESP32 is Healthy in **Nodes**.
3. Confirm its reported output/input Port-Address matches the universe.
4. Configure the universe as **Unicast**, Enabled, and assigned to the ESP32.
5. Open **Output** and confirm the route says **Ready for ArtDmx**.
6. Use the single-channel diagnostic control to keep the initial value at 0.
7. Explicitly click **ENABLE OUTPUT**.
8. Test a known safe DMX channel/value.
9. Test **BLACKOUT**.
10. Disable output before disconnecting hardware.

## Safety

Output never starts automatically. An explicit action is required after every launch.

If output is disabled or the app is closing, the controller attempts a short zero-frame safety burst before stopping transmission.

## Acceptance checklists

- `PHASE1-CHECKLIST.md`
- `PHASE2-CHECKLIST.md`
- `PHASE3-CHECKLIST.md`
- `PHASE4-CHECKLIST.md`
- `PHASE5-CHECKLIST.md`
- `PHASE6-CHECKLIST.md`

## Next phase

Phase 7 — Raw DMX Tester:
- 512-channel interface
- direct 0–255 values and percentages
- channel search / labels / selection
- master and reset tools
