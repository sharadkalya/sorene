'use client';

import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/**
 * True only after hydration. Use it to gate client-only UI (e.g. localStorage-
 * backed Redux state) so the server-rendered HTML matches the first client
 * render and React doesn't hit a hydration mismatch.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
