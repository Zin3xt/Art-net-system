# Phase 1 Acceptance Checklist

- [x] Electron application shell exists
- [x] React + TypeScript renderer exists
- [x] Vite/electron-vite build configuration exists
- [x] Tailwind CSS is wired into renderer
- [x] Console-style navigation shell exists
- [x] Dashboard workspace exists
- [x] Settings workspace exists
- [x] Future module placeholders exist
- [x] `nodeIntegration` disabled
- [x] `contextIsolation` enabled
- [x] renderer sandbox enabled
- [x] preload exposes a narrow API only
- [x] IPC sender origin is validated
- [x] window creation is denied by default
- [x] unexpected navigation is denied
- [x] local settings persistence implemented
- [x] local logger implemented
- [x] startup output setting defaults to OFF
- [x] no UDP/Art-Net output exists yet

## Manual verification after `npm install`

- [ ] `npm run dev` launches the desktop window
- [ ] Dashboard renders without console errors
- [ ] Bottom status bar shows `IPC ready`
- [ ] Settings can be saved and reloaded
- [ ] settings.json is created in Electron userData
- [ ] application log file is created in Electron userData/logs
- [ ] external navigation/window creation remains blocked
- [ ] `npm run build` succeeds
