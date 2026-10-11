# Phase 7 — Raw DMX Tester

## Implemented

- [x] Dedicated Raw DMX workspace
- [x] All 512 channels accessible
- [x] 512-channel overview
- [x] Eight 64-channel fader banks
- [x] DMX values 0–255
- [x] Percentage editing 0–100%
- [x] Quick values 0 / 64 / 128 / 192 / 255
- [x] Single-channel selection
- [x] Ctrl/Cmd multi-select
- [x] Shift range selection
- [x] Search by channel number
- [x] Search by persistent channel label
- [x] Select current bank
- [x] Select search results
- [x] Bulk channel update IPC
- [x] Fader batches throttled to about 80 ms
- [x] Pending fader batches pinned to their source universe
- [x] Persistent channel labels
- [x] Persistent channel locks
- [x] Locked channels rejected by native value update logic
- [x] Copy selected channel values
- [x] Paste selected values
- [x] Zero/reset all 512 channels with confirmation
- [x] Non-destructive 0–100% master dimmer
- [x] Master dimmer operates in the realtime output engine
- [x] Stored channel values are unchanged by master scaling
- [x] Live route / target state visible
- [x] Enable / Disable Output available
- [x] Blackout / Release Blackout available
- [x] Phase 6 subscriber and unicast validation remains enforced
- [x] Phase 6 zero-frame shutdown behavior remains enforced

## Persistence / migration

Older universe files without channel labels or locks are migrated in memory with:
- 512 empty labels
- 512 unlocked channel flags

Universe duplication copies:
- current 512 channel values
- labels
- locks

The duplicate remains disabled for output safety.

## Automated acceptance

- [ ] npm install passes
- [ ] npm run typecheck passes
- [ ] npm run build passes

## Windows / ESP32 / fixture acceptance

- [ ] npm run dev opens successfully
- [ ] Raw DMX appears in the sidebar
- [ ] Select the configured ESP32 universe
- [ ] Route reports Ready for ArtDmx
- [ ] All 512 channels appear in the overview
- [ ] Banks 1–64 through 449–512 are accessible
- [ ] Set one safe channel by fader
- [ ] 0–255 value matches the ESP32 DMX buffer
- [ ] Percentage entry maps correctly to 0–255
- [ ] Quick values work
- [ ] Ctrl/Cmd multi-select works
- [ ] Shift range selection works
- [ ] Batch-set multiple selected channels
- [ ] Add a channel label and restart the app; label persists
- [ ] Search finds the saved label
- [ ] Lock a channel and verify value changes are rejected/disabled
- [ ] Restart the app and verify the lock persists
- [ ] Unlock the channel and edit it
- [ ] Copy selected values and paste them to another selection
- [ ] Zero all 512 channels works after confirmation
- [ ] Master at 100% sends stored values unchanged
- [ ] Master at 50% approximately halves transmitted values
- [ ] Master at 0% sends zero levels without erasing stored values
- [ ] Returning master to 100% restores transmitted stored values
- [ ] Output is still disabled on application startup
- [ ] Enable Output still requires confirmation
- [ ] BLACKOUT forces repeated zero ArtDmx frames
- [ ] Releasing Blackout restores current buffer through the master
- [ ] Disable Output sends safety zero burst then stops
- [ ] ESP32 stale/offline state blocks route eligibility
- [ ] No broadcast ArtDmx is transmitted

## First fixture test recommendation

Use one known fixture and one known-safe DMX attribute. Start with:
- Master: 10–25%
- Channel value: low value first
- Blackout button visible and ready

Increase values only after confirming that the expected fixture/channel responds.

## Phase 8 handoff

Phase 8 — Output Safety & Recovery Hardening:
- output watchdog
- ESP32 disconnect / reconnect recovery
- emergency-stop handling
- blackout recovery rules
- route revalidation during live output
- long-run packet timing and stability QA
