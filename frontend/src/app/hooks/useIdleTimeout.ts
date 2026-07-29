import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

const IDLE_TIMEOUT = 15 * 60 * 1000;
const WARNING_BEFORE = 60 * 1000;

const ACTIVITY_EVENTS = [
  "mousemove", "mousedown", "click", "keydown",
  "touchstart", "scroll", "wheel",
];

export function useIdleTimeout(
  enabled: boolean,
  onTimeout: () => void
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTimeoutRef = useRef(onTimeout);
  const enabledRef = useRef(enabled);
  onTimeoutRef.current = onTimeout;
  enabledRef.current = enabled;

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (warnTimerRef.current) {
      clearTimeout(warnTimerRef.current);
      warnTimerRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    clearTimers();
    if (!enabledRef.current) return;

    warnTimerRef.current = setTimeout(() => {
      toast.warning("Sesi akan berakhir 1 menit lagi karena tidak ada aktivitas", {
        id: "idle-warning",
        duration: 60_000,
        action: {
          label: "Saya disini",
          onClick: () => resetTimer(),
        },
      });
    }, IDLE_TIMEOUT - WARNING_BEFORE);

    timerRef.current = setTimeout(() => {
      toast.dismiss("idle-warning");
      onTimeoutRef.current();
    }, IDLE_TIMEOUT);
  }, [clearTimers]);

  useEffect(() => {
    if (!enabled) {
      clearTimers();
      return;
    }

    resetTimer();

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, resetTimer, { passive: true });
    }
    document.addEventListener("visibilitychange", resetTimer);

    return () => {
      clearTimers();
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, resetTimer);
      }
      document.removeEventListener("visibilitychange", resetTimer);
    };
  }, [enabled, resetTimer, clearTimers]);
}
