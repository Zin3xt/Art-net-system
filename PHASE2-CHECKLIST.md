# Phase 2 — Network Interface Management

## Implemented

- [x] Native IPv4 adapter enumeration in Electron main process
- [x] Renderer receives sanitized network records through preload IPC
- [x] Ethernet / Wi-Fi / virtual / loopback classification where identifiable
- [x] IPv4 address display
- [x] Subnet mask display
- [x] CIDR display
- [x] Broadcast address calculation
- [x] MAC address captured in native adapter record
- [x] Loopback interfaces cannot be selected for Art-Net
- [x] Preferred Art-Net interface persistence
- [x] Network page auto-refreshes every 2.5 seconds
- [x] Manual refresh control
- [x] Adapter disappearance/reappearance reflected by refresh cycle
- [x] No Art-Net or UDP output is sent in Phase 2

## Manual acceptance tests

- [ ] `npm install` completes
- [ ] `npm run typecheck` passes
- [ ] `npm run build` passes
- [ ] `npm run dev` launches successfully
- [ ] Network page lists the PC's active Ethernet/Wi-Fi IPv4 adapters
- [ ] IPv4 address matches Windows `ipconfig`
- [ ] Subnet mask matches Windows `ipconfig`
- [ ] Broadcast address is correct for the subnet
- [ ] Selecting an interface survives app restart
- [ ] Loopback cannot be selected
- [ ] Disconnecting/reconnecting an adapter updates the list
- [ ] Phase 2 opens no UDP/6454 socket

## Phase 3 handoff

Use `preferredNetworkInterface` to resolve the selected local IPv4 address, then build the Art-Net UDP engine with ArtPoll, ArtPollReply parsing and safe output controls.
