# Phase 4 — Art-Net Node Monitoring

## Implemented

- [x] Dedicated Nodes workspace
- [x] Healthy / Stale / Offline health states
- [x] ESP32-friendly health timing
- [x] Fresh reply required after discovery restart
- [x] First seen / last seen / last changed timestamps
- [x] ArtPollReply response counter per node
- [x] Search by name, IP, MAC, report or style
- [x] Filter nodes by health state
- [x] Selected-node detail panel
- [x] IP, MAC, OEM, firmware, bind IP/index and device style
- [x] RDM / sACN capability indicators
- [x] Input/output Art-Net Port-Address visualization
- [x] Net / Sub-Net / Universe decoding
- [x] Node report display
- [x] Configuration-change detection
- [x] Node discovered event
- [x] Node stale event
- [x] Node offline event
- [x] Node recovered event
- [x] Node changed event
- [x] Node removed event after retention expiry
- [x] Engine start/stop event
- [x] UDP socket error event
- [x] Session event history
- [x] Per-device event history
- [x] Clear monitoring history action
- [x] Maximum event retention capped at 250 events
- [x] App-wide node health counters
- [x] ArtDmx / physical DMX output remains disabled

## Health timing

- Healthy: fresh ArtPollReply within 5.5 seconds
- Stale: no reply for more than 5.5 seconds but not more than 11 seconds
- Offline: no reply for more than 11 seconds
- Removed from retained monitor: no reply for more than 60 seconds

These values are intentionally tolerant enough for ESP32/Wi-Fi development while still detecting a disconnected node quickly.

## Automated acceptance

- [ ] npm install passes
- [ ] npm run typecheck passes
- [ ] npm run build passes

## ESP32 hardware acceptance

- [ ] Start discovery from Network
- [ ] Open Nodes workspace
- [ ] ESP32 appears as Healthy
- [ ] Node name and IP match the ESP32 firmware
- [ ] MAC address matches the ESP32
- [ ] Response counter increases over time
- [ ] Last reply remains current while ESP32 responds
- [ ] Reported output port/universe matches ESP32 configuration
- [ ] Unplug / power off ESP32 and observe Stale
- [ ] Continue waiting and observe Offline
- [ ] Reconnect ESP32 and observe Healthy / Recovered
- [ ] Recovery event appears in device history
- [ ] Change ESP32 Art-Net node name or universe and verify Node Changed event
- [ ] Stop discovery and verify retained devices show Offline
- [ ] Restart discovery and verify a fresh reply is required before Healthy
- [ ] Clear event history works
- [ ] No ArtDmx packets are sent

## Safety

Phase 4 monitors Art-Net discovery information only.

It does not:
- send fixture levels
- send ArtDmx
- output DMX channel data
- change ESP32 configuration

## Phase 5 handoff

Phase 5 will introduce the Universe Engine:
- create/manage universes
- 512-channel buffers
- Art-Net Port-Address assignment
- node destination assignment
- broadcast/unicast selection
- universe enable/disable
- universe status

Physical channel output should still be gated behind explicit Output Enable and Blackout safeguards.
