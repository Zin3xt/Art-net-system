# Phase 3 — Art-Net Core Discovery Engine

## Implemented

- [x] Art-Net UDP port constant `0x1936` / `6454`
- [x] Art-Net packet ID validation (`Art-Net\0`)
- [x] ArtPoll encoder using OpCode `0x2000`
- [x] Art-Net protocol version 14
- [x] 14-byte minimum ArtPoll packet
- [x] Selected IPv4 NIC binding
- [x] Directed broadcast using the selected adapter broadcast address
- [x] Automatic ArtPoll every 2.75 seconds
- [x] Manual Scan Now / ArtPoll
- [x] ArtPollReply OpCode `0x2100` parser
- [x] Minimum 207-byte ArtPollReply validation
- [x] Node IP, short name, long name and report parsing
- [x] OEM code, firmware version, style and MAC parsing
- [x] Input/output Port-Address parsing
- [x] RDM and sACN capability indicators
- [x] Node online/offline tracking
- [x] UDP packet TX/RX counters
- [x] Secure IPC start / stop / poll / status / node APIs
- [x] Interface selection locked while discovery is running
- [x] UDP socket closes when discovery stops
- [x] UDP socket shutdown is requested when the desktop app quits
- [x] ArtDmx / DMX output is not implemented in Phase 3

## Automated acceptance

- [x] `npm install` passes
- [x] `npm run typecheck` passes
- [x] `npm run build` passes

Validated by GitHub Actions on the Phase 3 feature branch.

## Windows / hardware acceptance

- [ ] `npm run dev` opens without a black screen
- [ ] Select the Ethernet NIC connected to the Art-Net network
- [ ] Start Discovery changes engine state to `running`
- [ ] Bottom status shows `UDP 6454 LIVE`
- [ ] TX counter increases every ~2.75 seconds
- [ ] A connected Art-Net node appears after ArtPoll
- [ ] Node IP matches the physical Art-Net device
- [ ] Node short/long name is displayed when supplied
- [ ] MAC address is displayed when supplied
- [ ] Output Port-Address is displayed correctly
- [ ] RDM capability is shown correctly when supported
- [ ] Disconnecting the node eventually marks it offline
- [ ] Reconnecting the node returns it online
- [ ] Stop closes discovery and shows `UDP OFF`
- [ ] Adapter selection becomes editable again after Stop
- [ ] Wireshark / DMX-Workshop confirms ArtPoll / ArtPollReply only
- [ ] No ArtDmx packets are transmitted

## Port conflict test

If UDP 6454 is already owned exclusively by another application, the engine should fail safely and show the socket error instead of crashing the app.

Close software such as another Art-Net controller if it prevents binding to port 6454.

## Phase 4 handoff

Phase 4 will build the persistent Art-Net node discovery/monitoring experience on top of this engine, including richer node health, change detection and network diagnostics. Physical DMX data remains reserved for the later Universe / realtime-output phases.
