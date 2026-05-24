# Sigil Testing Guide

Manual release checklist for Sigil `0.8.x`. This document is meant to be practical: start with a short smoke pass, then run the feature suites that match the release.

## Scope

Run this guide before shipping desktop builds for:
- Linux
- macOS
- Windows

At minimum, every release should get:
- the smoke pass
- one full wallet lifecycle test
- one deep-link test pass
- one export/import pass
- one security/lock pass

## Test Environments

Use both when possible:
- `bun run tauri dev` for rapid iteration
- installed release bundle for protocol-handler, notification, updater, and packaging checks

Important notes:
- `sigil://` deep links should be validated on an installed build, because OS protocol registration is installer-driven.
- Linux quick unlock depends on a working secure-storage environment.
- Deep-link `dapp.origin` must be an `https://` URL.
- Callback URLs must use `https://`, except `http://localhost` or `http://127.0.0.1` for local development callbacks.

## Preflight

Before starting:
- confirm the app launches without onboarding regressions
- confirm the active RPC endpoint is reachable
- confirm a throwaway vault can be created or imported
- confirm desktop notifications are allowed on the OS

Recommended local checks before manual testing:

```bash
npm exec tsc -- --noEmit
cargo check --manifest-path src-tauri/Cargo.toml
```

## Smoke Pass

Run this first on every platform.

- Launch the app with existing state and verify it opens to lock screen, not onboarding.
- Unlock with the correct password.
- Confirm dashboard loads balance, identity, and recent activity without errors.
- Copy the active identity and verify clipboard copy works.
- Open `Send`, `Receive`, `History`, `Settings`, and return to dashboard.
- Lock the app manually from `Settings -> Security`, then unlock again.
- Export contacts or a vault and verify the native save dialog opens.
- Quit and relaunch the app. Verify the same vault and settings are still present.

## Test Data

Use disposable test data only.

- Use a throwaway Qubic seed with small funds.
- Keep at least two identities available:
  - one active wallet identity
  - one recipient identity
- Keep one exported vault JSON file for import testing.
- Keep one contacts export JSON file for import testing.

## Wallet Lifecycle

### Create vault

- Start from a clean state.
- Create a new vault.
- Verify seed reveal and spot-check flow work.
- Set a password with at least 10 characters.
- Confirm the app lands on dashboard after creation.

Expected:
- vault metadata persists after restart
- relaunch goes to lock screen, not onboarding

### Import seed

- Import a valid seed into a new vault.
- Verify the seed input is masked.
- Unlock the imported vault.
- Confirm the resulting identity matches the expected account.

### Import vault file

- Import a previously exported vault JSON file.
- Verify wrong password fails cleanly.
- Verify correct password imports the vault and preserves accounts.

### Multi-account vault

- Add a second account to the active vault.
- Confirm both accounts appear in the vault view and switcher.
- Remove a non-primary account if the flow is available.
- Verify balances and identities switch correctly on dashboard.

### Seed reveal

- Open a vault account detail view.
- Trigger seed reveal.
- Verify the reveal is gated and not shown by default.
- Verify the displayed seed matches the account being inspected.

## Locking And Session Safety

### Password unlock

- Lock the app.
- Enter a wrong password and verify unlock fails without navigation.
- Enter the correct password and verify dashboard opens.

### Auto-lock timeout

- Set auto-lock to `1 minute`.
- Leave the app idle until it locks.
- Unlock and verify normal navigation resumes.

### Lock on sleep

- Enable `Lock on sleep`.
- Put the machine to sleep or lock the screen.
- Resume and verify Sigil is on the lock screen.

### Lock on window blur

- Enable `Lock on window blur`.
- Switch away from the app.
- Verify Sigil locks immediately.

Important:
- if debug mode is enabled, the UI should clearly warn that blur-lock is bypassed

### Quick unlock / biometric unlock

Run the platform-appropriate path:
- macOS / Windows: biometric unlock
- Linux: quick unlock via secure storage

Verify:
- enable flow requires the current vault password
- lock screen shows the platform-appropriate unlock action after enablement
- successful quick unlock returns to dashboard
- disabling the feature removes the shortcut path

## Clipboard Safety

- Copy a wallet identity.
- Paste it once to confirm it copied correctly.
- Wait for the configured clipboard timeout and confirm the clipboard is cleared.
- Lock the app and confirm the clipboard is cleared immediately.
- Repeat once with clipboard timeout set to `Never` and confirm lock still clears it.

## Send And Receive

### Receive

- Open `Receive`.
- Verify the active identity is shown and copyable.
- Verify the QR code renders with sufficient contrast and margin for scanning.
- Scan it from another device if available.

### Send QU

- Send a small amount to a valid recipient identity.
- Verify review details show sender, recipient, and amount.
- Approve the transaction.
- Confirm pending transaction appears immediately.
- Confirm it later settles or fails cleanly.

### Guardrails

Verify all of these:
- invalid identity is rejected
- non-positive amount is rejected
- insufficient balance is blocked
- pending transfer guard prevents conflicting sends when applicable

### Send many

- Add multiple recipients.
- Verify totals update correctly.
- Verify the flow blocks overdrafts.
- Approve and confirm the summary reflects recipient count and totals.

### Burn

- Open the burn flow.
- Verify the irreversible-action warning is prominent.
- Confirm a small burn can be reviewed and signed.

## Qearn

- Open the Qearn flow.
- Verify current positions load without layout or query issues.
- Lock a small amount.
- If test funds and epoch state allow it, test unlock as well.
- Confirm the resulting transactions appear in history.

## Contacts And Exports

### Contacts

- Add a new contact manually.
- Use that contact from the send flow.
- Export contacts and verify the native save dialog opens.
- Re-import the exported file and verify entries are preserved.

### Vault export

- Export the active vault.
- Verify the native save dialog opens.
- Verify the resulting file is created successfully.
- Re-import the exported vault in a clean state or another vault list.

### Error handling

- Cancel the native save dialog and verify the app stays stable.
- If possible, test a write failure case and verify the error is surfaced cleanly.

## History, Notifications, And Settings

### History

- Open transaction history.
- Verify recent transfers, burns, or Qearn actions appear.
- Verify memo and pending states render without layout issues.

### Notifications

- Enable notifications.
- Trigger a transaction confirmation notification if possible.
- Verify notification text is readable and free of raw markup.
- On Linux installed builds, verify desktop metadata is correct and notifications are attributed to Sigil.

### Settings

Verify these screens open and persist changes:
- Security
- Contacts
- Notifications
- Appearance
- Network

On `Network`, verify:
- RPC endpoint validation rejects malformed values
- debug mode toggles persist

## Deep-Link Testing

Run these on an installed build.

### Test page

Serve a local test page:

```bash
npx serve . -p 8080
```

Use this HTML as a simple launcher:

```html
<!DOCTYPE html>
<html>
<body>
<script>
function toBase64Url(str) {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function request(type, params = {}, callback = 'http://localhost:9999/cb') {
  const payload = toBase64Url(JSON.stringify({
    type,
    nonce: crypto.randomUUID().replace(/-/g, '') + 'ABCD',
    dapp: {
      name: 'Sigil Test Page',
      origin: 'https://example.test'
    },
    exp: Math.floor(Date.now() / 1000) + 300,
    ...params
  }));

  const a = document.createElement('a');
  a.href = `sigil://v1/request?d=${payload}${callback ? `&cb=${encodeURIComponent(callback)}` : ''}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

const RECIPIENT = 'UVYAOYTNYCRBVFBHNFIJUEOUEPEDIDUWWEAXKFSJEBJVASCQEROJOVOEEATL';
</script>

<button onclick="request('transfer', { to: RECIPIENT, amount: 1 })">Transfer</button>
<button onclick="request('connect')">Connect</button>
<button onclick="request('sign_message', { message: 'Hello Sigil' })">Sign message</button>
<button onclick="request('verify_message', { message: 'Hello Sigil', signature: 'AAAA', public_key: 'BBBB' })">Verify invalid</button>
<button onclick="request('sc_call', { contract_index: 9, input_type: 1, amount: 10000000 })">Qearn lock</button>
<button onclick="request('transfer', { to: RECIPIENT, amount: 1 }, null)">Transfer without callback</button>
</body>
</html>
```

For callback inspection:

```bash
nc -l 9999
```

### Protocol registration

Verify OS handling:
- macOS: `open "sigil://v1/request?..."`
- Linux: `xdg-open "sigil://v1/request?..."`
- Windows: open a `sigil://` URL from the browser or Run dialog

### Request queueing

- Trigger multiple deep links back-to-back.
- Verify requests are queued instead of one overwriting another.
- Approve or reject one and confirm the next request appears.

### Transfer request

- Trigger a valid transfer request.
- Verify the review screen shows the amount and destination.
- Approve and confirm the callback receives a `signed` result.
- Reject and confirm the callback receives a `rejected` result.

### Connect request

- Trigger `connect` without permissions.
- Approve and confirm the callback returns identity and an empty permission list.
- Trigger `connect` with permissions such as `transfer` and `sign_message`.
- Confirm the result reflects the granted permissions.

### Sign message

- Trigger a valid `sign_message` request.
- Approve and confirm the callback contains `signature` and `public_key`.
- Trigger the same request without a callback and confirm the app shows a copyable result instead.

### Verify message

- Trigger a deliberately invalid `verify_message` request.
- Confirm the result is shown cleanly as invalid.
- If you have a real signed sample, verify a valid signature path too.

### Smart contract call

- Trigger a Qearn lock call.
- Confirm the sheet decodes it as a Qearn action instead of showing only raw fields.
- Approve and confirm the callback returns a signed transaction result.

### Negative cases

Verify each fails safely:
- malformed base64 payload
- invalid JSON payload
- expired request
- non-HTTPS `dapp.origin`
- callback URL outside allowed policy
- oversized `sign_message`
- duplicate nonce replay

### Locked-app behavior

- Close the app fully and trigger a deep link.
- Verify the app opens, requests unlock if needed, and then shows the pending request.
- Trigger a deep link while the app is already open but locked.
- Verify the request is still available after unlock.

## Persistence And Restart

- Create or import a vault in `bun run tauri dev`.
- Quit the app fully.
- Relaunch with `bun run tauri dev`.
- Verify the vault still exists and the app goes to lock screen.

Repeat once on an installed build:
- verify persisted state survives restart
- verify settings survive restart
- verify pending-safe behavior is intact after relaunch

## Platform-Specific Checks

### Windows

- protocol handler works from browser or Run dialog
- biometric unlock works if Windows Hello is configured
- save dialogs and notifications look native

### macOS

- protocol handler works with `open`
- biometric unlock works when Touch ID or supported system auth is available
- notification permission prompts and delivery behave correctly

### Linux

- protocol handler works with `xdg-open`
- quick unlock works when secure storage is available
- installed package registers desktop metadata correctly for notifications
- `bun run tauri dev` preserves state across restarts

## Release Exit Criteria

Do not ship if any of these fail:
- existing users are sent to onboarding unexpectedly
- unlock fails with the correct password
- vault export or import is broken
- clipboard is not cleared on lock
- deep-link approval screen is bypassed, skipped, or corrupted
- callback policy accepts an invalid target
- transactions can be signed with the wrong account or wrong details
- app crashes on launch, lock, unlock, export, or deep-link handling

## Minimal Release Checklist

- [ ] App launches with existing state intact
- [ ] Lock and unlock work
- [ ] Auto-lock and sleep-lock work
- [ ] Clipboard clears on timer and on lock
- [ ] Receive QR is readable
- [ ] Basic send works
- [ ] Send-many guardrails work
- [ ] Qearn flow loads and signs correctly
- [ ] Contacts export/import works
- [ ] Vault export/import works
- [ ] Notifications work
- [ ] Deep-link transfer approve path works
- [ ] Deep-link rejection path works
- [ ] Deep-link no-callback path works
- [ ] Deep-link queueing works
- [ ] Restart persistence works in `tauri dev`
- [ ] Restart persistence works in installed build
