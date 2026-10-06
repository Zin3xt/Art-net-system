# Phase 5 — Universe Engine

## Implemented

- [x] Dedicated Universes workspace
- [x] Persistent universe storage in Electron userData
- [x] Exactly 512 channels per universe
- [x] Net validation: 0–127
- [x] Sub-Net validation: 0–15
- [x] Universe validation: 0–15
- [x] 15-bit Port-Address calculation
- [x] Duplicate Port-Address prevention
- [x] Create universe
- [x] Edit universe
- [x] Delete universe
- [x] Duplicate universe
- [x] Duplicated universes start disabled
- [x] Enable / disable universe configuration
- [x] Broadcast destination mode
- [x] Unicast destination mode
- [x] Assign discovered Art-Net / ESP32 node
- [x] Persist target node ID, MAC and last-known IP
- [x] Reset all 512 channels to zero
- [x] Native channel validation: channel 1–512
- [x] Native DMX value validation: 0–255
- [x] Channel buffer summary / preview
- [x] Target missing / offline readiness state
- [x] ArtDmx safety lock displayed in UI
- [x] No ArtDmx serializer in Phase 5
- [x] No physical fixture output in Phase 5

## Automated acceptance

- [x] npm install passes
- [x] npm run typecheck passes
- [x] npm run build passes

Validated by GitHub Actions on the final Phase 5 branch head.

## Windows / ESP32 acceptance

- [ ] npm run dev opens successfully
- [ ] Universes workspace opens from sidebar
- [ ] Create Universe 1 at Port-Address 0:0:0
- [ ] Universe shows 512 configured channels
- [ ] Restart app and confirm universe persists
- [ ] Duplicate Universe 1 creates a new free Port-Address
- [ ] Duplicate starts disabled
- [ ] Attempting duplicate Port-Address is rejected
- [ ] Edit name and address and confirm persistence
- [ ] Select Unicast
- [ ] Assign the discovered ESP32
- [ ] ESP32 IP is displayed as destination
- [ ] Change the ESP32 DHCP IP and confirm the universe resolves the same node by MAC
- [ ] Power off ESP32 and confirm target-offline state
- [ ] Return ESP32 and confirm target status recovers
- [ ] Broadcast mode does not require a target node
- [ ] Enable / Disable universe works
- [ ] Reset Universe sets all 512 channel values to zero
- [ ] Delete Universe removes it from storage
- [ ] No ArtDmx packets are transmitted

## Suggested first ESP32 universe

- Name: Main Stage
- Net: 0
- Sub-Net: 0
- Universe: 0
- Port-Address: 0:0:0
- Output mode: Unicast
- Target: discovered ESP32
- Enabled: Yes
- ArtDmx: Locked

## Safety

Phase 5 creates internal lighting state only. Even an enabled universe must not transmit ArtDmx.

## Phase 6 handoff

Phase 6 will consume the existing universe buffers and add:
- ArtDmx packet serialization
- sequence handling
- dedicated realtime output loop
- broadcast / unicast delivery
- configurable output refresh rate
- explicit global Output Enable
- repeated zero-frame Blackout
- watchdog / safe shutdown behavior
