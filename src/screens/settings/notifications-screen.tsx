import { motion } from "motion/react";
import { stepMotion } from "@/lib/animations";
import { AppShell } from "@/layouts/app-shell";
import { SettingsPageHeader } from "@/components/settings-page-header";
import { SettingsSwitch } from "@/components/settings-switch";
import { usePersistedStore } from "@/store/persisted";

function Divider() {
  return <div style={{ height: 1, background: "var(--color-border-subtle)" }} />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontFamily: "var(--font-sans)", fontSize: "var(--text-caption)",
      fontWeight: 600, color: "var(--color-text-disabled)",
      textTransform: "none", letterSpacing: "0.06em",
    }}>
      {children}
    </span>
  );
}

export default function NotificationsScreen() {
  const enabled = usePersistedStore((s) => s.settings.notificationsEnabled);
  const onReceived = usePersistedStore((s) => s.settings.notifyOnReceived);
  const onSent = usePersistedStore((s) => s.settings.notifyOnSent);
  const onConfirmed = usePersistedStore((s) => s.settings.notifyOnConfirmed);
  const onMissedConfirmations = usePersistedStore((s) => s.settings.notifyOnMissedConfirmations);
  const notifyWhenLocked = usePersistedStore((s) => s.settings.notifyWhenLocked);
  const hideToTray = usePersistedStore((s) => s.settings.hideToTray);
  const updateSettings = usePersistedStore((s) => s.updateSettings);

  return (
    <AppShell fullBleed contentStyle={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <motion.div {...stepMotion} style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <SettingsPageHeader title="Notifications" />

        {/* Master toggle */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <SettingsSwitch label="Notifications" description="Show desktop notifications for wallet events" checked={enabled} onChange={() => updateSettings({ notificationsEnabled: !enabled })} />
        </div>

        <Divider />

        {/* Notify when */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <SectionLabel>Notify when</SectionLabel>
          <SettingsSwitch label="QU received" description="Balance increases on any account" checked={onReceived} onChange={() => updateSettings({ notifyOnReceived: !onReceived })} disabled={!enabled} />
          <Divider />
          <SettingsSwitch label="Transaction sent" description="Send, contract call, or burn is broadcast" checked={onSent} onChange={() => updateSettings({ notifyOnSent: !onSent })} disabled={!enabled} />
          <Divider />
          <SettingsSwitch label="Transaction confirmed" description="Pending transaction confirms on chain" checked={onConfirmed} onChange={() => updateSettings({ notifyOnConfirmed: !onConfirmed })} disabled={!enabled} />
          <Divider />
          <SettingsSwitch label="Missed confirmations" description="Pending transaction fails or expires" checked={onMissedConfirmations} onChange={() => updateSettings({ notifyOnMissedConfirmations: !onMissedConfirmations })} disabled={!enabled} />
        </div>

        <Divider />

        {/* Behavior */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <SectionLabel>Behavior</SectionLabel>
          <SettingsSwitch label="Hide to tray on close" description="Keep Glyph running in the system tray" checked={hideToTray} onChange={() => updateSettings({ hideToTray: !hideToTray })} />
          <Divider />
          <SettingsSwitch label="Notify when locked" description="Allow notifications while the vault is locked" checked={notifyWhenLocked} onChange={() => updateSettings({ notifyWhenLocked: !notifyWhenLocked })} disabled={!enabled} />
        </div>
      </motion.div>
    </AppShell>
  );
}
