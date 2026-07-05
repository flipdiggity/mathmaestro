'use client';

import { useEffect } from 'react';

// Auto-refresh on new deploys. Each page is stamped at build time with the git
// SHA it was built from; this watcher compares it against what production is
// currently serving (/api/version) and force-reloads when they differ — so a
// tab someone left open (or a cached page) picks up updates without anyone
// knowing what "clear your cache" means.
//
// Checks happen when the tab regains focus/visibility and every 5 minutes.
// Reloads are polite: deferred while the user is actively interacting (typing,
// uploading), and guarded by sessionStorage so a stale edge can't loop us.

const BUILT_SHA = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA;
const CHECK_INTERVAL_MS = 5 * 60_000;
const IDLE_BEFORE_RELOAD_MS = 30_000;

export function UpdateWatcher() {
  useEffect(() => {
    if (!BUILT_SHA) return; // local dev / non-Vercel build — nothing to compare

    let lastActivity = Date.now();
    let newSha: string | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    const markActivity = () => {
      lastActivity = Date.now();
    };

    const maybeReload = () => {
      if (disposed || !newSha) return;
      const guardKey = `mm-reloaded-${newSha}`;
      if (sessionStorage.getItem(guardKey)) return; // already tried once this session
      const idle = Date.now() - lastActivity >= IDLE_BEFORE_RELOAD_MS;
      if (idle || document.visibilityState === 'hidden') {
        sessionStorage.setItem(guardKey, '1');
        window.location.reload();
      } else {
        // User is mid-interaction — try again shortly.
        retryTimer = setTimeout(maybeReload, IDLE_BEFORE_RELOAD_MS);
      }
    };

    const check = async () => {
      try {
        const res = await fetch('/api/version', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as { commit?: string | null };
        if (data.commit && data.commit !== BUILT_SHA) {
          newSha = data.commit;
          maybeReload();
        }
      } catch {
        // offline / transient — next check will retry
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') check();
    };

    window.addEventListener('pointerdown', markActivity, { passive: true });
    window.addEventListener('keydown', markActivity, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    const interval = setInterval(check, CHECK_INTERVAL_MS);
    check();

    return () => {
      disposed = true;
      window.removeEventListener('pointerdown', markActivity);
      window.removeEventListener('keydown', markActivity);
      document.removeEventListener('visibilitychange', onVisibility);
      clearInterval(interval);
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  return null;
}
