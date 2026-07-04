import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";

// Module-level store so Sheet portals outside the tree still work
let openCount = 0;
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}
function getSnapshot() {
  return openCount;
}

function increment() {
  openCount++;
  listeners.forEach((l) => l());
}
function decrement() {
  openCount = Math.max(0, openCount - 1);
  listeners.forEach((l) => l());
}

interface SheetStateCtx {
  openCount: number;
  increment: () => void;
  decrement: () => void;
}

const SheetStateContext = createContext<SheetStateCtx>({
  openCount: 0,
  increment,
  decrement,
});

export function SheetStateProvider({ children }: { children: ReactNode }) {
  const ctx = useMemo(() => ({ openCount: 0, increment, decrement }), []);
  return (
    <SheetStateContext.Provider value={ctx}>
      {children}
    </SheetStateContext.Provider>
  );
}

/** Use inside the Sheet component to register open/close. */
export function useSheetRegister() {
  const { increment: inc, decrement: dec } = useContext(SheetStateContext);
  return { onOpen: inc, onClose: dec };
}

/** Subscribe to whether any sheet is currently open. */
export function useSheetsOpen(): boolean {
  const count = useSyncExternalStore(subscribe, getSnapshot);
  return count > 0;
}
