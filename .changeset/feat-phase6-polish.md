---
"sigil": minor
---

Polish and request-screen improvements.

**Features**
- Directional page transitions (slide left/right based on route depth), balance counter animation, lock/unlock fade+scale animation
- Request screen: account picker lets user choose signing account when dApp omits `from`; `from`-identity resolution validates the requested identity is in the active vault and shows an error if not
- Deep-link with no vault → redirects to setup screen instead of crashing

**Fixes**
- Pending transactions now resolve against `getLastProcessedTick` (archive) instead of network tick, giving sub-second confirmation vs. up to 30s
- 4-position seed-phrase spot-check replaces the previous 55-tap grid backup flow
- Deep-link callback validator now accepts `http://localhost` and `http://127.0.0.1` for local development
- Store IPC timeout raised to 1500 ms (safety net 3 s) to prevent hydration failures in debug builds
- Settings screen gains a back button in the header
- `window.__TAURI__` exposed globally for DevTools console testing (`withGlobalTauri: true`)
- Updated app icons across all platforms and sizes
