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

### Phase 7 — Raw DMX Tester
Implemented on `feature/phase7-raw-dmx-tester`:

- dedicated **Raw DMX** operator workspace
- all 512 channels accessible from a full-universe overview
- eight 64-channel fader banks
- direct 0–255 editing
- direct 0–100% editing
- quick values: 0 / 64 / 128 / 192 / 255
- single selection, Ctrl/Cmd multi-select and Shift range selection
- channel search by number or persistent label
- batch updates through one validated IPC transaction
- fader updates throttled into ~80 ms batches
- persistent per-channel labels
- persistent server-enforced channel locks
- copy/paste selected channel values
- zero/reset full universe
- runtime 0–100% master dimmer
- master scaling is non-destructive to stored DMX values
- live route / target status
- Output Enable / Disable and Blackout always visible
- existing Phase 6 unicast/subscriber/output safety rules remain mandatory

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

## Phase 7 test workflow

1. Start Art-Net discovery from **Network**.
2. Confirm the ESP32 is Healthy and subscribed to the selected Port-Address.
3. Open **Raw DMX** and select the universe.
4. Confirm the route says **Ready for ArtDmx**.
5. Keep the master low for the first physical test.
6. Explicitly enable output.
7. Move one known-safe channel and verify the intended fixture response.
8. Test multi-select, quick values, labels and channel locks.
9. Test the non-destructive master dimmer.
10. Test **BLACKOUT**, release it, then disable output.

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
- `PHASE7-CHECKLIST.md`

## Next phase

Phase 8 — Output Safety & Recovery Hardening:
- watchdog and reconnect recovery
- ESP32 disconnect behavior
- emergency-stop and blackout recovery
- long-run output timing / packet QA
