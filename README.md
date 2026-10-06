# Art-Net Controller — Phase 1

Electron desktop foundation for the Art-Net lighting control project.

## Included in Phase 1

- Electron + React + TypeScript + Vite
- Tailwind CSS console-style dark UI
- Zustand application navigation state
- Secure preload/contextBridge API
- `contextIsolation: true`
- `nodeIntegration: false`
- sandboxed renderer
- restricted navigation/window creation
- IPC sender-origin validation
- local settings persistence
- local file logging
- Dashboard and Settings workspaces
- placeholders for all planned console modules
- physical lighting output deliberately disabled

## Requirements

Use Node.js 22.12+ (or another version supported by the installed electron-vite version).

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Important safety rule

Phase 1 does **not** open UDP port 6454 or send Art-Net/DMX data. Physical output is introduced only after network selection and Art-Net engine phases are implemented and tested.

## Phase 2 target

Network Interface Management:

- enumerate network adapters
- distinguish Ethernet/Wi-Fi/loopback where possible
- select the Art-Net interface
- show IPv4, subnet mask and broadcast address
- detect adapter changes
- persist preferred interface
