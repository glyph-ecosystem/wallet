import { useNavigate } from "react-router-dom";
import { AppShell } from "@/layouts/app-shell";
import { usePersistedStore, type AppSettings } from "@/store/persisted";
import { useAutoLock } from "@/hooks/use-auto-lock";

type Theme = AppSettings["theme"];

interface ThemeDef {
  id: Theme;
  label: string;
  bg: string;
  surface: string;
  text: string;
  border: string;
  accent: string;
}

const THEMES: ThemeDef[] = [
  { id: "dark",     label: "Nothing",   bg: "#000000", surface: "#181818", text: "#ffffff", border: "#2a2a2a", accent: "#ffffff" },
  { id: "graphite", label: "Graphite",  bg: "#111111", surface: "#242424", text: "#f0f0f0", border: "#333333", accent: "#f0f0f0" },
  { id: "midnight", label: "Midnight",  bg: "#050810", surface: "#111828", text: "#dde8ff", border: "#1a2640", accent: "#7898dd" },
  { id: "light",    label: "Light",     bg: "#f5f3ef", surface: "#e5e1da", text: "#0a0a0a", border: "#c8c4bc", accent: "#0a0a0a" },
  { id: "system",   label: "System",    bg: "#000000", surface: "#181818", text: "#ffffff", border: "#2a2a2a", accent: "#888888" },
];

function ThemeCard({ def, selected, onSelect }: { def: ThemeDef; selected: boolean; onSelect: () => void }) {
  const isSystem = def.id === "system";

  return (
    <button
      onClick={onSelect}
      style={{
        background: "none",
        border: `1px solid ${selected ? "var(--color-text-display)" : "var(--color-border-strong)"}`,
        borderRadius: "var(--radius-card)",
        padding: 0,
        cursor: "pointer",
        overflow: "hidden",
        width: "100%",
        textAlign: "left",
        outline: "none",
      }}
    >
      {/* Preview area */}
      <div
        style={{
          background: def.bg,
          height: 72,
          padding: "8px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 5,
          position: "relative",
          borderBottom: `1px solid ${def.border}`,
        }}
      >
        {isSystem ? (
          <>
            {/* Half dark / half light split for system */}
            <div style={{ position: "absolute", inset: 0, display: "flex" }}>
              <div style={{ flex: 1, background: "#000000" }} />
              <div style={{ flex: 1, background: "#f5f3ef" }} />
            </div>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "#888888", letterSpacing: "0.05em" }}>
                AUTO
              </span>
            </div>
          </>
        ) : (
          <>
            {/* Mock status bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ width: 20, height: 3, borderRadius: 2, background: def.text, opacity: 0.7 }} />
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
            </div>
            {/* Mock balance */}
            <div style={{ width: 44, height: 5, borderRadius: 2, background: def.text, opacity: 0.9, marginTop: 4 }} />
            <div style={{ width: 20, height: 3, borderRadius: 2, background: def.text, opacity: 0.3 }} />
            {/* Mock button */}
            <div style={{ width: 28, height: 6, borderRadius: 2, border: `1px solid ${def.border}`, marginTop: "auto" }} />
          </>
        )}
      </div>

      {/* Label row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--space-2) var(--space-3)",
          background: "var(--color-bg-surface)",
        }}
      >
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-label)", fontWeight: 500, color: "var(--color-text-primary)" }}>
          {def.label}
        </span>
        {selected && (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-mono-sm)", color: "var(--color-text-display)", letterSpacing: "0.05em" }}>
            ✓
          </span>
        )}
      </div>
    </button>
  );
}

export default function AppearanceScreen() {
  const navigate = useNavigate();
  useAutoLock();

  const theme = usePersistedStore((s) => s.settings.theme);
  const updateSettings = usePersistedStore((s) => s.updateSettings);

  const statusBar = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
      <button
        onClick={() => navigate("/settings")}
        style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: "var(--text-mono-sm)", color: "var(--color-text-secondary)", letterSpacing: "0.05em", padding: 0 }}
      >
        ← BACK
      </button>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-label)", fontWeight: 500, color: "var(--color-text-primary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Appearance
      </span>
      <span style={{ width: 40 }} />
    </div>
  );

  return (
    <AppShell statusBar={statusBar} contentStyle={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>

      <div>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-body)", fontWeight: 500, color: "var(--color-text-primary)" }}>
          Theme
        </div>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-label)", color: "var(--color-text-secondary)", marginTop: "var(--space-1)" }}>
          Changes apply instantly
        </div>
      </div>

      {/* 2-column grid for the first 4 themes */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)" }}>
        {THEMES.filter((t) => t.id !== "system").map((def) => (
          <ThemeCard
            key={def.id}
            def={def}
            selected={theme === def.id}
            onSelect={() => updateSettings({ theme: def.id })}
          />
        ))}
      </div>

      {/* System option — full width */}
      {THEMES.filter((t) => t.id === "system").map((def) => (
        <ThemeCard
          key={def.id}
          def={def}
          selected={theme === def.id}
          onSelect={() => updateSettings({ theme: def.id })}
        />
      ))}

    </AppShell>
  );
}
