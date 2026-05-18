import type { CSSProperties, ReactNode } from "react";

export interface SplitPaneProps {
  left: ReactNode;
  right: ReactNode;
  leftWidth?: string;
  style?: CSSProperties;
}

export function SplitPane({ left, right, leftWidth = "40%", style }: SplitPaneProps) {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        background: "var(--color-bg-base)",
        overflow: "hidden",
        ...style,
      }}
    >
      <aside
        style={{
          width: leftWidth,
          flexShrink: 0,
          borderRight: "1px solid var(--color-border-subtle)",
          overflowY: "auto",
        }}
      >
        {left}
      </aside>
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "var(--space-4)",
        }}
      >
        {right}
      </main>
    </div>
  );
}
