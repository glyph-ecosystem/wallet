import type { CSSProperties, ReactNode } from "react";

export interface AppShellProps {
  children: ReactNode;
  statusBar?: ReactNode;
  bottomNav?: ReactNode;
  contentStyle?: CSSProperties;
}

export function AppShell({ children, statusBar, bottomNav, contentStyle }: AppShellProps) {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--color-bg-base)",
        overflow: "hidden",
      }}
    >
      {statusBar && (
        <header
          style={{
            flexShrink: 0,
            height: 44,
            display: "flex",
            alignItems: "center",
            padding: "0 var(--space-4)",
            borderBottom: "1px solid var(--color-border-subtle)",
          }}
        >
          {statusBar}
        </header>
      )}

      <main
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "var(--space-4)",
          ...contentStyle,
        }}
      >
        {children}
      </main>

      {bottomNav && (
        <nav
          style={{
            flexShrink: 0,
            height: 56,
            display: "flex",
            borderTop: "1px solid var(--color-border-subtle)",
          }}
        >
          {bottomNav}
        </nav>
      )}
    </div>
  );
}
