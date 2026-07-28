import { useEffect, useRef, useCallback } from "react";

export function useAutoRefresh(
  fetchFn: () => Promise<void>,
  intervalMs: number | null,
  enabled: boolean
) {
  const fnRef = useRef(fetchFn);
  fnRef.current = fetchFn;

  const abortRef = useRef<AbortController | null>(null);

  const tick = useCallback(async () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      await fnRef.current();
    } catch {
      // ignore aborted / failed requests
    }
    if (ctrl.signal.aborted) return;
    abortRef.current = null;
  }, []);

  useEffect(() => {
    if (!enabled || intervalMs === null) return;
    const id = setInterval(tick, intervalMs);
    return () => {
      clearInterval(id);
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, [enabled, intervalMs, tick]);
}
