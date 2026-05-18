import { FullPage } from "@/layouts/full-page";

export default function App() {
  return (
    <FullPage>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-mono-sm)",
          color: "var(--color-text-secondary)",
          letterSpacing: "0.1em",
        }}
      >
        SIGIL
      </span>
    </FullPage>
  );
}
