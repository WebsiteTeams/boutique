import { useSyncExternalStore } from "react";

/**
 * A tiny localStorage-backed store designed for `useSyncExternalStore`.
 *
 * - The server (and the first client render) see `fallback`, so hydration
 *   never mismatches; React then re-renders with the stored value.
 * - Corrupt or unexpected stored data is passed through `parse`, which must
 *   return a safe value — malformed storage can never crash the app.
 * - Changes made in another tab are picked up via the `storage` event.
 */
export interface PersistentStore<T> {
  get: () => T;
  set: (next: T | ((prev: T) => T)) => void;
  subscribe: (listener: () => void) => () => void;
  fallback: T;
}

export function createPersistentStore<T>(
  key: string,
  fallback: T,
  parse: (raw: unknown) => T
): PersistentStore<T> {
  let value = fallback;
  let loaded = false;
  const listeners = new Set<() => void>();

  const load = () => {
    loaded = true;
    try {
      const raw = window.localStorage.getItem(key);
      value = raw == null ? fallback : parse(JSON.parse(raw));
    } catch {
      value = fallback;
    }
  };

  const get = () => {
    if (!loaded) load();
    return value;
  };

  const set: PersistentStore<T>["set"] = (next) => {
    value = typeof next === "function" ? (next as (prev: T) => T)(get()) : next;
    loaded = true;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage full or unavailable (private mode): keep working in memory.
    }
    listeners.forEach((l) => l());
  };

  const subscribe: PersistentStore<T>["subscribe"] = (listener) => {
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => {
      if (event.key === key || event.key === null) {
        load();
        listener();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  };

  return { get, set, subscribe, fallback };
}

export function usePersistentStore<T>(store: PersistentStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, () => store.fallback);
}

const noopSubscribe = () => () => {};

/** False during SSR and hydration, true afterwards — for gating storage-dependent UI. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}
