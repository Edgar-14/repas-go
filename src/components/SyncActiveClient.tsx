"use client";

import { useEffect, useRef } from 'react';

/**
 * Global Shipday→Firestore synchronizer (client-side)
 * - Fires every 15 seconds
 * - Calls /api/shipday/sync-active (POST)
 * - No UI; silent best-effort
 *
 * Purpose: ensure UI reflects real-time even if webhooks are delayed/misconfigured.
 */
export default function SyncActiveClient() {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const sync = async () => {
      try {
        await fetch('/api/shipday/sync-active', { method: 'POST' });
      } catch {
        // silent
      }
    };

    // Immediate sync on mount
    sync();

    // 15s interval
    timerRef.current = setInterval(sync, 15000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return null;
}
