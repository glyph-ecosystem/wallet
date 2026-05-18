import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/layouts/app-shell";
import { Button } from "@/components/button";
import { Divider } from "@/components/divider";
import { RequestHeader } from "@/components/request/request-header";
import { usePersistedStore } from "@/store/persisted";
import { useSessionStore } from "@/store/session";
import { useAutoLock } from "@/hooks/use-auto-lock";

interface SigilEnvelope {
  request: {
    type: "transfer" | "sc_call" | "sign_message" | "connect";
    dapp: { name: string; origin: string; icon?: string };
    nonce: string;
    exp?: number;
    [key: string]: unknown;
  };
  callback: string | null;
}

function parseEnvelope(raw: string | null): SigilEnvelope | null {
  if (!raw) return null;
  try {
    const env = JSON.parse(raw) as SigilEnvelope;
    if (!env.request?.type || !env.request?.dapp?.origin) return null;
    return env;
  } catch {
    return null;
  }
}

const TYPE_LABEL: Record<string, string> = {
  transfer: "Send QU",
  sc_call: "Contract call",
  sign_message: "Sign message",
  connect: "Connect",
};

export default function RequestScreen() {
  const navigate = useNavigate();
  useAutoLock();

  const approvedDapps = usePersistedStore((s) => s.settings.approvedDapps);
  const pendingRequest = useSessionStore((s) => s.pendingRequest);
  const setPendingRequest = useSessionStore((s) => s.setPendingRequest);

  const envelope = parseEnvelope(pendingRequest);

  // Redirect away if there is nothing to show
  useEffect(() => {
    if (!envelope) navigate("/dashboard", { replace: true });
  }, [envelope, navigate]);

  function reject() {
    setPendingRequest(null);
    navigate("/dashboard", { replace: true });
  }

  if (!envelope) return null;

  const { request } = envelope;
  const typeLabel = TYPE_LABEL[request.type] ?? request.type;

  const statusBar = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
      <button
        onClick={reject}
        style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: "var(--text-mono-sm)", color: "var(--color-text-secondary)", letterSpacing: "0.05em", padding: 0 }}
      >
        ← BACK
      </button>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-label)", fontWeight: 500, color: "var(--color-text-primary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {typeLabel}
      </span>
      <span style={{ width: 40 }} />
    </div>
  );

  return (
    <AppShell statusBar={statusBar} contentStyle={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <RequestHeader dapp={request.dapp} approvedDapps={approvedDapps} />

      <Divider />

      <div style={{ textAlign: "center", padding: "var(--space-8) 0", fontFamily: "var(--font-mono)", fontSize: "var(--text-mono-sm)", color: "var(--color-text-disabled)", letterSpacing: "0.05em" }}>
        [{request.type.toUpperCase()} REQUEST]
      </div>

      <Button variant="danger" shape="sharp" onClick={reject}>Reject</Button>
    </AppShell>
  );
}
