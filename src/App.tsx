import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { router } from "@/router";
import { useDeepLink } from "@/hooks/use-deep-link";
import { usePersistedStore } from "@/store/persisted";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5_000,
      refetchOnWindowFocus: true,
    },
  },
});

function ThemeApplier() {
  const theme = usePersistedStore((s) => s.settings.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      root.setAttribute("data-theme", mq.matches ? "dark" : "light");
      const handler = (e: MediaQueryListEvent) =>
        root.setAttribute("data-theme", e.matches ? "dark" : "light");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
    root.setAttribute("data-theme", theme);
  }, [theme]);

  return null;
}

function GlobalListeners() {
  useDeepLink();
  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeApplier />
      <GlobalListeners />
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
