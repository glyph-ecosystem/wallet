import { useEffect, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  style?: CSSProperties;
}

const EASE_OUT = [0, 0, 0.2, 1] as const;

export function Modal({ open, onClose, children, style }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12, ease: EASE_OUT }}
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            zIndex: 50,
          }}
        >
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border-strong)",
              borderRadius: "var(--radius-card) var(--radius-card) 0 0",
              padding: "var(--space-6)",
              maxHeight: "80vh",
              overflowY: "auto",
              ...style,
            }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
