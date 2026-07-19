import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { transition } from "@/lib/animations";
import { HomeSmile, CardSend, CardReceive, MoneyBag, ClockCircle, Settings } from "@solar-icons/react";

export type BottomNavTab = "home" | "send" | "receive" | "earn" | "history" | "settings";

const TABS = [
  { id: "home" as BottomNavTab,     label: "Home",     icon: HomeSmile,     path: "/dashboard" },
  { id: "send" as BottomNavTab,     label: "Send",     icon: CardSend,      path: "/send" },
  { id: "receive" as BottomNavTab,  label: "Receive",  icon: CardReceive,   path: "/receive" },
  { id: "earn" as BottomNavTab,     label: "Earn",     icon: MoneyBag,      path: "/earn" },
  { id: "history" as BottomNavTab,  label: "History",  icon: ClockCircle,   path: "/history" },
  { id: "settings" as BottomNavTab, label: "Settings", icon: Settings,      path: "/settings" },
];

export function BottomNav({ active }: { active: BottomNavTab }) {
  const navigate = useNavigate();
  return (
    <nav
      aria-label="Primary"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--space-1)",
        width: "100%",
        maxWidth: 420,
        boxSizing: "border-box",
        padding: "var(--space-2)",
        background: "rgba(28, 28, 30, 0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRadius: "var(--radius-pill)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
      }}
    >
      {TABS.map(({ id, label, icon: Icon, path }) => {
        const isActive = id === active;
        return (
          <button
            key={id}
            type="button"
            onClick={() => { if (!isActive) navigate(path); }}
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              flex: "1 1 0",
              alignItems: "center",
              justifyContent: "center",
              gap: "1px",
              height: 46,
              padding: isActive ? "0 10px" : "0 8px",
              background: "none",
              borderRadius: "var(--radius-pill)",
              border: "none",
              cursor: "pointer",
              color: isActive ? "var(--color-accent)" : "var(--color-text-secondary)",
              transition: "color 200ms ease-in-out",
              minWidth: 44,
            }}
            onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = "var(--color-text-display)"; }}
            onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = "var(--color-text-secondary)"; }}
          >
            {isActive && (
              <motion.span
                layoutId="nav-pill"
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(204, 252, 251, 0.1)",
                  borderRadius: "var(--radius-pill)",
                }}
                transition={transition.navPill}
              />
            )}
            <span style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={22} weight={isActive ? "BoldDuotone" : "Linear"} aria-hidden="true" />
            </span>
          </button>
        );
      })}
    </nav>
  );
}
