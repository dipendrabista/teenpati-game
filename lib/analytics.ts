type AnalyticsEvent = {
  type: string;
  ts: number;
  data?: Record<string, any>;
};

let buffer: AnalyticsEvent[] = [];
let flushTimer: number | null = null;

function getOptIn(): boolean {
  try {
    return typeof window !== 'undefined' && localStorage.getItem('analytics_opt_in') === '1';
  } catch {
    return false;
  }
}

export function setOptIn(optIn: boolean): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem('analytics_opt_in', optIn ? '1' : '0');
  } catch {}
}

export function isOptIn(): boolean {
  return getOptIn();
}

export function track(type: string, data?: Record<string, any>): void {
  if (!getOptIn()) return;
  buffer.push({ type, ts: Date.now(), data });
  if (buffer.length >= 20) {
    void flushNow();
    return;
  }
  if (!flushTimer && typeof window !== 'undefined') {
    flushTimer = window.setTimeout(() => {
      flushTimer = null;
      void flushNow();
    }, 10_000);
  }
}

export async function flushNow(): Promise<void> {
  if (!getOptIn()) {
    buffer = [];
    return;
  }
  if (buffer.length === 0) return;
  const batch = buffer.splice(0, buffer.length);
  try {
    const payload = JSON.stringify({ events: batch });
    if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics/ingest', blob);
      return;
    }
    await fetch('/api/analytics/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    });
  } catch {
    // Requeue on failure (best-effort)
    buffer.unshift(...batch);
  }
}

// Convenience helpers
export function trackAction(action: 'CALL' | 'RAISE' | 'FOLD', details?: Record<string, any>): void {
  track('action', { action, ...details });
}

export function trackUX(event: string, details?: Record<string, any>): void {
  track('ux', { event, ...details });
}


