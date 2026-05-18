import type { CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";

export type ToastVariant = "success" | "warning" | "error" | "neutral";

export interface ToastProps {
  message: string | null;
  variant?: ToastVariant;
  style?: CSSProperties;
}

const VARIANT_COLOR: Record<ToastVariant, string> = {
  success: "var(--color-status-success)",
  warning: "var(--color-status-warning)",
  error: "var(--color-status-error)",
  neutral: "var(--color-text-secondary)",
};

const EASE_OUT = [0, 0, 0.2, 1] as const;

export function Toast({ message, variant = "neutral", style }: ToastProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.12, ease: EASE_OUT }}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-mono-sm)",
            color: VARIANT_COLOR[variant],
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            padding: "var(--space-3) var(--space-4)",
            borderBottom: "1px solid var(--color-border-subtle)",
            ...style,
          }}
        >
          [{message.toUpperCase()}]
        </motion.div>
      )}
    </AnimatePresence>
  );
}
