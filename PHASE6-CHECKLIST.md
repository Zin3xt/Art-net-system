# Phase 6 — Realtime DMX Output Engine

## Protocol implementation

- [x] ArtDmx OpCode 0x5000
- [x] Art-Net ID Art-Net\0
- [x] Protocol version 14
- [x] Sequence number 1–255
- [x] Physical field defaults to 0
- [x] SubUni is low byte of the 15-bit Port-Address
- [x] Net is top 7 bits of Port-Address
- [x] Length = 512
- [x] Full 512-channel payload
- [x] UDP 6454 uses the existing selected-interface Art-Net socket

## Art-Net 4 routing

- [x] ArtDmx output is unicast only
- [x] Broadcast universes are blocked from live output
- [x] Controller requires a discovered target node
- [x] Target must be Healthy
- [x] Target must advertise the Port-Address in SwIn or SwOut
- [x] No subscriber = no ArtDmx
- [x] MAC-first ESP32 identity resolution

## Realtime behavior

- [x] 30 Hz scheduler
- [x] Changed universe buffer is transmitted promptly
- [x] Unchanged universe keepalive around 900 ms
- [x] Universe edits refresh the live output snapshot
- [x] Per-universe sequence tracking
- [x] Per-universe frame counters
- [x] Global ArtDmx packet counter

## Safety

- [x] Output always disabled on app startup
- [x] Explicit confirmation before Enable Output
- [x] Blackout sends repeated zero frames every 100 ms
- [x] Release Blackout restores current universe buffers
- [x] Disable Output sends three zero frames before stopping
- [x] Stop Art-Net disables output first
- [x] App quit disables output before Art-Net socket shutdown
- [x] Three consecutive send errors trigger failsafe/error state
- [x] Offline/stale target is blocked
- [x] No broadcast ArtDmx
- [x] Single-channel diagnostic control only; full raw tester deferred to Phase 7

## Automated acceptance

- [x] npm install passes
- [x] npm run typecheck passes
- [x] npm run build passes

## ESP32 prerequisite

The ESP32 ArtPollReply must advertise the same Port-Address the desktop universe uses.

Example first test:
- Desktop universe: Net 0 / Sub-Net 0 / Universe 0
- Port-Address: 0:0:0
- ESP32 SwOut (or SwIn): Universe 0 under Net 0 / Sub-Net 0
- ESP32 health: Healthy
- Universe mode: Unicast
- Universe enabled: Yes

If the ESP32 does not advertise the subscription, the Output page must display **Not subscribed** and must not send ArtDmx.

## Windows / ESP32 hardware acceptance

- [ ] npm run dev launches successfully
- [ ] Output is DISABLED immediately after launch
- [ ] Start Art-Net discovery
- [ ] ESP32 appears Healthy
- [ ] ESP32 advertises the matching Port-Address
- [ ] Output route displays Ready for ArtDmx
- [ ] ArtDmx TX remains 0 before Enable Output
- [ ] Click ENABLE OUTPUT and accept confirmation
- [ ] Initial zero buffer does not unexpectedly illuminate fixtures
- [ ] Set one known-safe diagnostic channel to a low value
- [ ] ESP32 receives correct ArtDmx Port-Address
- [ ] ESP32 receives the correct 512-byte channel payload
- [ ] Sequence increments on transmitted frames
- [ ] Raise diagnostic value and verify the intended DMX channel changes
- [ ] BLACKOUT forces the fixture output to zero
- [ ] Blackout remains zero while active
- [ ] RELEASE BLACKOUT restores the current buffer
- [ ] Disable Output sends zeros then stops
- [ ] Restart application and confirm output is disabled again
- [ ] Disconnect ESP32 and confirm live route is blocked
- [ ] No broadcast ArtDmx is visible in Wireshark / DMX-Workshop

## First hardware test recommendation

Use a fixture/channel that is safe to energize and begin at a low DMX value before testing 255.

## Phase 7 handoff

Phase 7 will replace the single-channel diagnostic control with the full Raw DMX Tester:
- channels 1–512
- sliders / numeric values / percentages
- channel selection and labels
- master controls
- rapid zero/reset tools
