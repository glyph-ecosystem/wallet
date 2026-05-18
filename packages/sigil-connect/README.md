# @sigil/connect

TypeScript SDK for integrating web and Node.js apps with the [Sigil wallet](https://github.com/alez04/sigil.app) via the Sigil Request Protocol (SRP v1).

No browser extension required. Works from any web page, CLI script, or server-side app.

---

## Install

```sh
npm install @sigil/connect
# or
bun add @sigil/connect
```

---

## Quick start

### Browser — with a server-side callback endpoint

```ts
import { buildSigilRequest, openSigilRequest } from "@sigil/connect";

const { uri } = buildSigilRequest(
  {
    type: "transfer",
    dapp: { name: "My App", origin: "https://myapp.example.com" },
    to: "DESTINATIONIDENTITYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    amount: 1_000_000,
    exp: Math.floor(Date.now() / 1000) + 300, // 5 min expiry
  },
  "https://myapp.example.com/sigil-callback" // your server endpoint
);

await openSigilRequest(uri);
// Sigil opens on the user's desktop, they approve, and your server receives the POST.
```

Your server receives a `POST /sigil-callback` with this JSON body:

```json
{
  "status": "signed",
  "nonce": "...",
  "type": "transfer",
  "identity": "SENDERIDENTITY...",
  "tx_hash": "...",
  "target_tick": 12345678
}
```

---

### Node.js — full local callback flow

For CLI tools or desktop apps that can bind a local port:

```ts
import { buildSigilRequest, openSigilRequest, waitForCallback } from "@sigil/connect";

// 1. Start the local callback server BEFORE opening the URI
const server = await waitForCallback({ timeout: 60_000 });

// 2. Build the URI pointing at the local server
const { uri } = buildSigilRequest(
  {
    type: "transfer",
    dapp: { name: "My CLI Tool", origin: "https://myapp.example.com" },
    to: "DESTINATIONIDENTITYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    amount: 1_000_000,
  },
  server.callbackUrl // e.g. "http://127.0.0.1:54321/sigil-callback"
);

// 3. Open Sigil
await openSigilRequest(uri);

// 4. Wait for the user to approve or reject
const response = await server.result;

if (response.status === "signed") {
  console.log("tx hash:", response.tx_hash);
} else {
  console.log("rejected:", response.reason);
}
```

---

## Request types

### Transfer

```ts
buildSigilRequest({
  type: "transfer",
  dapp: { name: "My App", origin: "https://myapp.example.com" },
  to: "DESTINATIONIDENTITY...",
  amount: 10_000_000,      // QU (integer, no fees)
  tick_offset: 10,         // optional — targetTick = currentTick + tick_offset (default 10)
  from: "SENDERIDENTITY",  // optional — hint which account to use
});
```

### Smart contract call

```ts
buildSigilRequest({
  type: "sc_call",
  dapp: { name: "Qearn", origin: "https://qearn.qubic.org" },
  contract_index: 9,          // Qearn = 9
  input_type: 1,
  amount: 10_000_000,
  payload: "<base64-encoded binary>", // optional SC input payload
});
```

### Sign message (off-chain)

No transaction is broadcast — only a SchnorrQ signature over the message.

```ts
buildSigilRequest({
  type: "sign_message",
  dapp: { name: "Qubic Auth", origin: "https://myapp.qubic.org" },
  message: "Sign in to Qubic Auth\n\nNonce: r3k9mxpq",
});
```

Callback body on approval:

```json
{
  "status": "signed",
  "identity": "...",
  "signature": "<base64 64-byte SchnorrQ signature>",
  "public_key": "<base64 32-byte public key>"
}
```

### Connect (identity reveal)

Ask the user which account to associate with your dApp and pre-approve permissions:

```ts
buildSigilRequest({
  type: "connect",
  dapp: { name: "My App", origin: "https://myapp.example.com" },
  permissions: ["transfer", "sc_call"],
});
```

Callback body on approval:

```json
{
  "status": "connected",
  "identity": "USERIDENTITY...",
  "permissions": ["transfer", "sc_call"]
}
```

---

## API reference

### `buildSigilRequest(options, callbackUrl?)`

| Param | Type | Description |
|---|---|---|
| `options` | `SigilRequestOptions` | Request payload. `nonce` auto-generated if omitted. `exp` is unix seconds. |
| `callbackUrl` | `string?` | URL for Sigil to POST the result to. |

Returns `{ uri: string; nonce: string }`.

---

### `openSigilRequest(uri)`

Opens the `sigil://` URI. In browsers, sets `window.location.href`. In Node.js, uses `open` / `start` / `xdg-open`.

---

### `waitForCallback(options?)` — Node.js only

| Option | Type | Default | Description |
|---|---|---|---|
| `timeout` | `number` | `60000` | Max ms to wait for the POST callback. |
| `port` | `number` | random | Local port to bind. |

Returns `Promise<CallbackServer>`:

| Field | Type | Description |
|---|---|---|
| `callbackUrl` | `string` | `http://127.0.0.1:<port>/sigil-callback` — pass to `buildSigilRequest`. |
| `result` | `Promise<SigilResponse>` | Resolves on callback POST, rejects on timeout. |
| `close()` | `() => void` | Shuts the server down early. |

---

## Rejected / error responses

```json
{ "status": "rejected", "nonce": "...", "type": "transfer", "reason": "user_rejected" }
{ "status": "error",    "nonce": "...", "type": "transfer", "reason": "broadcast_failed", "message": "RPC unreachable" }
```

---

## Protocol

Full spec: [PROTOCOL.md](../../planning/PROTOCOL.md)
