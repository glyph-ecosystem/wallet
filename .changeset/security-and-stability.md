---
"sigil": patch
---

Security hardening and stability fixes.

- Disabled `withGlobalTauri`, `devtools`, and set a Content Security Policy in production builds
- Pending requests are now cleared on the Rust side after every approve, reject, or auto-reject — prevents stale requests from replaying after a crash
- Auto-lock now clears any pending deep-link request, preventing stale requests from re-appearing after unlock
- Disk write failures in the persisted store are now logged and retried instead of being silently swallowed
- Burn screen now checks balance before allowing the confirmation step
