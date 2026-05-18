import { useState } from "react";
import { Button } from "@/components/button";
import { useSessionStore } from "@/store/session";
import { usePersistedStore } from "@/store/persisted";
import { useTickInfo } from "@/hooks/use-tick-info";
import { estimateTargetTick, getRpcClient } from "@/lib/rpc";
import { SC_DESTINATION } from "@qubic.org/wallet";
import type { ApproveResult } from "./transfer-preview";

export interface ScCallRequest {
  contract_index: number;
  input_type: number;
  amount?: number;
  payload?: string; // base64-encoded binary
  tick_offset?: number;
  [key: string]: unknown;
}

interface ScCallPreviewProps {
  request: ScCallRequest;
  onApprove: (result: ApproveResult) => void;
  onReject: () => void;
}

const CONTRACT_NAMES: Record<number, string> = {
  9: "Qearn",
};

function formatAmount(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function base64ToHex(b64: string): string {
  try {
    const binary = atob(b64);
    return Array.from(binary, (c) => c.charCodeAt(0).toString(16).padStart(2, "0")).join(" ");
  } catch {
    return "[invalid payload]";
  }
}

function base64ToBytes(b64: string): Uint8Array {
  try {
    const binary = atob(b64);
    return Uint8Array.from(binary, (c) => c.charCodeAt(0));
  } catch {
    return new Uint8Array(0);
  }
}

export function ScCallPreview({ request, onApprove, onReject }: ScCallPreviewProps) {
  const [processing, setProcessing] = useState(false);
  const [txError, setTxError] = useState("");
  const [showPayload, setShowPayload] = useState(false);

  const wallets = useSessionStore((s) => s.wallets);
  const settings = usePersistedStore((s) => s.settings);
  const vault = usePersistedStore((s) => s.vaults.find((v) => v.id === s.settings.activeVaultId));
  const addPendingTx = usePersistedStore((s) => s.addPendingTx);
  const { data: tickInfo } = useTickInfo();

  const wallet = wallets[settings.activeAccountIndex] ?? null;
  const identity = wallet?.identity ?? "";
  const accountName = vault?.accounts[settings.activeAccountIndex]?.name ?? "Account";
  const tickOffset = request.tick_offset ?? 10;
  const targetTick = tickInfo ? estimateTargetTick(tickInfo.tick ?? 0, tickOffset) : null;
  const contractName = CONTRACT_NAMES[request.contract_index] ?? `CONTRACT #${request.contract_index}`;
  const hasAmount = (request.amount ?? 0) > 0;
  const payloadHex = request.payload ? base64ToHex(request.payload) : null;
  const payloadByteCount = request.payload ? Math.ceil((request.payload.length * 3) / 4) : 0;

  async function approve() {
    if (!wallet || !tickInfo) return;
    setProcessing(true);
    setTxError("");
    try {
      const amount = BigInt(request.amount ?? 0);
      const tick = estimateTargetTick(tickInfo.tick ?? 0, tickOffset);
      const payloadBytes = request.payload ? base64ToBytes(request.payload) : new Uint8Array(0);

      const { encoded, hash } = await wallet.buildScTransaction({
        inputType: request.input_type,
        payload: payloadBytes,
        amount,
        targetTick: tick,
        currentTick: tickInfo.tick,
      });

      const result = await getRpcClient().live.broadcastTransaction(encoded);
      if (!result.ok) throw result.error;

      addPendingTx({
        hash,
        source: identity,
        destination: SC_DESTINATION,
        amount: amount.toString(),
        targetTick: tick,
        broadcastAt: Date.now(),
      });

      onApprove({ txHash: hash, targetTick: tick, identity });
    } catch (e) {
      setTxError(e instanceof Error ? e.message : "Broadcast failed.");
      setProcessing(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* Contract — primary element */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-sans)", fontWeight: 300, fontSize: "var(--text-display)", color: "var(--color-text-display)", letterSpacing: "-0.02em", lineHeight: 1 }}>
          {contractName}
        </div>
        {hasAmount && (
          <div style={{ marginTop: "var(--space-3)", fontFamily: "var(--font-mono)", fontSize: "var(--text-mono-lg)", color: "var(--color-text-secondary)" }}>
            {formatAmount(request.amount!)} QU
          </div>
        )}
      </div>

      {/* Detail rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <Row label="From" value={`${accountName} · ${truncate(identity)}`} />
        <Row label="Input type" value={String(request.input_type)} />
        <Row label="Target tick" value={targetTick ? String(targetTick) : "—"} />
        {!hasAmount && <Row label="Amount" value="None" />}
        <Row label="Fee" value="None" />
      </div>

      {/* Payload — collapsible */}
      {payloadHex !== null && (
        <div>
          <button
            onClick={() => setShowPayload((v) => !v)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: "var(--space-2)" }}
          >
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-mono-sm)", color: "var(--color-text-secondary)", letterSpacing: "0.05em" }}>
              {showPayload ? "[HIDE PAYLOAD]" : `[SHOW PAYLOAD · ${payloadByteCount}B]`}
            </span>
          </button>
          {showPayload && (
            <div style={{ marginTop: "var(--space-2)", fontFamily: "var(--font-mono)", fontSize: "var(--text-mono-sm)", color: "var(--color-text-disabled)", letterSpacing: "0.05em", wordBreak: "break-all", lineHeight: 1.6 }}>
              {payloadHex}
            </div>
          )}
        </div>
      )}

      {txError && (
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-mono-sm)", color: "var(--color-status-error)", letterSpacing: "0.05em" }}>
          [{txError}]
        </div>
      )}

      <Button onClick={approve} loading={processing} disabled={!wallet || !tickInfo}>
        Sign and send
      </Button>
      <Button variant="danger" shape="sharp" onClick={onReject}>
        Reject
      </Button>
    </div>
  );
}

function truncate(id: string): string {
  if (!id || id.length <= 20) return id;
  return `${id.slice(0, 10)}...${id.slice(-10)}`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-4)" }}>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-label)", fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-mono-sm)", color: "var(--color-text-primary)", letterSpacing: "0.05em", textAlign: "right", wordBreak: "break-all" }}>
        {value}
      </span>
    </div>
  );
}
