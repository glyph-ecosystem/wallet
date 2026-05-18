import type { CSSProperties } from "react";

export interface DividerProps {
  style?: CSSProperties;
}

export function Divider({ style }: DividerProps) {
  return (
    <hr
      style={{
        border: "none",
        borderTop: "1px solid var(--color-border-subtle)",
        ...style,
      }}
    />
  );
}
