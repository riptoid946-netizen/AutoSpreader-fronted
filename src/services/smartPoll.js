// Poll helper: runs fn immediately, then on an interval — but SKIPS ticks while
// the tab is hidden (mobile data + battery saver) and refreshes instantly when
// the tab becomes visible again. The next tick is scheduled only after fn
// completes, so slow responses never pile up into overlapping requests.
export function smartPoll(fn, intervalMs) {
  let stopped = false;
  let timer = null;
  let running = false;

  const schedule = () => {
    if (stopped) return;
    clearTimeout(timer);
    timer = setTimeout(tick, intervalMs);
  };

  const tick = async () => {
    if (stopped || running) return;
    if (typeof document !== 'undefined' && document.hidden) {
      schedule();
      return;
    }
    running = true;
    try {
      await fn();
    } catch (_) {
      // polling errors are non-fatal; the next tick retries
    } finally {
      running = false;
      schedule();
    }
  };

  const onVisibility = () => {
    if (!stopped && !running && !document.hidden) {
      clearTimeout(timer);
      tick();
    }
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibility);
  }

  tick();

  return () => {
    stopped = true;
    clearTimeout(timer);
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibility);
    }
  };
}
