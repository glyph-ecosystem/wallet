// ─── Types ────────────────────────────────────────────────────────────────────

export interface DappInfo {
  name: string;
  origin: string;
  icon?: string;
}

interface RequestBase {
  dapp: DappInfo;
  from?: string;
  nonce?: string;
  exp?: number;
}

export interface TransferRequestOptions extends RequestBase {
  type: "transfer";
  to: string;
  amount: number;
  tick_offset?: number;
}

export interface ScCallRequestOptions extends RequestBase {
  type: "sc_call";
  contract_index: number;
  input_type: number;
  amount?: number;
  payload?: string; // base64-encoded binary
  tick_offset?: number;
}

export interface SignMessageRequestOptions extends RequestBase {
  type: "sign_message";
  message: string;
  data?: string; // base64-encoded raw bytes; if absent, signs message UTF-8 bytes
}

export interface ConnectRequestOptions extends RequestBase {
  type: "connect";
  permissions?: ("transfer" | "sc_call" | "sign_message")[];
}

export type SigilRequestOptions =
  | TransferRequestOptions
  | ScCallRequestOptions
  | SignMessageRequestOptions
  | ConnectRequestOptions;

export interface BuildResult {
  /** The full sigil:// URI to open. */
  uri: string;
  /** The nonce embedded in the request — use this with waitForCallback. */
  nonce: string;
}

export interface SigilResponse {
  status: "signed" | "connected" | "rejected" | "error";
  nonce: string;
  type: string;
  identity?: string;
  // transfer / sc_call
  tx_hash?: string;
  target_tick?: number;
  // sign_message
  signature?: string;
  public_key?: string;
  // connect
  permissions?: string[];
  // rejected / error
  reason?: string;
  message?: string;
}

export interface CallbackServer {
  /** Pass this URL as the second argument to buildSigilRequest. */
  callbackUrl: string;
  /** Resolves when Sigil POSTs the result, or rejects on timeout. */
  result: Promise<SigilResponse>;
  /** Shuts down the server early (called automatically after result settles). */
  close: () => void;
}

// ─── Build ────────────────────────────────────────────────────────────────────

function generateNonce(): string {
  // globalThis.crypto is available in Node.js 19+ and all modern browsers.
  const bytes = new Uint8Array(12);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function base64urlEncode(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Encodes a Sigil request into a `sigil://` URI.
 *
 * @param options      - Request payload. `nonce` is auto-generated if omitted.
 * @param callbackUrl  - Where Sigil should POST the result.
 *                       Required for all types except `connect`.
 *                       Use the `callbackUrl` from `waitForCallback` for local flows.
 *
 * @example
 * ```ts
 * const { uri, nonce } = buildSigilRequest(
 *   { type: 'transfer', dapp: { name: 'My App', origin: 'https://myapp.example.com' },
 *     to: 'DESTINATION...', amount: 1_000_000 },
 *   'https://myapp.example.com/sigil-callback'
 * );
 * ```
 */
export function buildSigilRequest(
  options: SigilRequestOptions,
  callbackUrl?: string
): BuildResult {
  const nonce = options.nonce ?? generateNonce();
  const payload: Record<string, unknown> = { ...options, nonce };

  const encoded = base64urlEncode(JSON.stringify(payload));
  let uri = `sigil://v1/request?d=${encoded}`;
  if (callbackUrl) {
    uri += `&cb=${encodeURIComponent(callbackUrl)}`;
  }

  return { uri, nonce };
}

// ─── Open ─────────────────────────────────────────────────────────────────────

/**
 * Opens a `sigil://` URI, triggering the OS to launch or focus Sigil.
 *
 * - Browser: sets `window.location.href`.
 * - Node.js: uses the platform-appropriate open command (`open`, `start`, `xdg-open`).
 */
export async function openSigilRequest(uri: string): Promise<void> {
  if (typeof window !== "undefined") {
    window.location.href = uri;
    return;
  }

  const [{ exec }, { platform }] = await Promise.all([
    import("child_process"),
    import("os"),
  ]);

  const p = platform();
  const cmd =
    p === "darwin"
      ? `open '${uri}'`
      : p === "win32"
        ? `start "" "${uri}"`
        : `xdg-open '${uri}'`;

  await new Promise<void>((resolve, reject) => {
    exec(cmd, (err) => (err ? reject(err) : resolve()));
  });
}

// ─── Callback server (Node.js only) ──────────────────────────────────────────

/**
 * Starts a local HTTP server on `127.0.0.1` that waits for Sigil to POST
 * the signing result back. **Node.js only.**
 *
 * Call this _before_ `openSigilRequest` so the server is ready when Sigil responds.
 *
 * @param options.timeout - Max ms to wait for the callback (default: 60 000).
 * @param options.port    - Specific port to bind; defaults to a random available port.
 *
 * @throws In browser environments — point `callbackUrl` at a server you control instead.
 *
 * @example
 * ```ts
 * const server = await waitForCallback({ timeout: 60_000 });
 * const { uri } = buildSigilRequest(
 *   { type: 'transfer', dapp: { name: 'My App', origin: 'https://myapp.example.com' },
 *     to: 'DESTINATION...', amount: 1_000_000 },
 *   server.callbackUrl
 * );
 * await openSigilRequest(uri);
 * const response = await server.result; // { status: 'signed', tx_hash: '...', ... }
 * ```
 */
export async function waitForCallback(options?: {
  timeout?: number;
  port?: number;
}): Promise<CallbackServer> {
  if (typeof window !== "undefined") {
    throw new Error(
      "@sigil/connect: waitForCallback is Node.js only. " +
        "In browser apps, set callbackUrl to a server endpoint you control " +
        "and handle the POST there."
    );
  }

  const { createServer } = await import("http");
  const { timeout = 60_000, port: preferredPort = 0 } = options ?? {};

  let resolveResult!: (r: SigilResponse) => void;
  let rejectResult!: (e: Error) => void;
  const result = new Promise<SigilResponse>((res, rej) => {
    resolveResult = res;
    rejectResult = rej;
  });

  const server = createServer((req, res) => {
    if (req.method !== "POST") {
      res.writeHead(405).end();
      return;
    }
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString()) as SigilResponse;
        res.writeHead(200, { "Content-Type": "application/json" }).end("{}");
        cleanup();
        resolveResult(body);
      } catch {
        res.writeHead(400).end();
      }
    });
  });

  const timer = setTimeout(() => {
    cleanup();
    rejectResult(new Error(`@sigil/connect: callback timed out after ${timeout}ms`));
  }, timeout);

  function cleanup() {
    clearTimeout(timer);
    server.close();
  }

  await new Promise<void>((resolve, reject) => {
    server.listen(preferredPort, "127.0.0.1", () => resolve());
    server.on("error", reject);
  });

  const addr = server.address() as { port: number };
  const callbackUrl = `http://127.0.0.1:${addr.port}/sigil-callback`;

  return { callbackUrl, result, close: cleanup };
}
