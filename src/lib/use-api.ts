import { useCallback, useEffect, useState } from "react";
import { api, ApiClientError } from "@/lib/api";

interface ApiState<T> {
  data: T | null;
  error: ApiClientError | null;
  loading: boolean;
  reload: () => void;
  setData: (data: T) => void;
}

/** Loads JSON from the API with loading / error state. Pass `null` to skip the request. */
export function useApi<T>(path: string | null): ApiState<T> {
  const [state, setState] = useState<{ path: string | null; data: T | null; error: ApiClientError | null }>({
    path: null,
    data: null,
    error: null,
  });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    api<T>(path)
      .then((data) => {
        if (!cancelled) setState({ path, data, error: null });
      })
      .catch((error) => {
        if (cancelled) return;
        const wrapped =
          error instanceof ApiClientError ? error : new ApiClientError("Something went wrong.", 0);
        setState({ path, data: null, error: wrapped });
      });
    return () => {
      cancelled = true;
    };
  }, [path, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const setData = useCallback((data: T) => setState((s) => ({ ...s, data, error: null })), []);
  const current = state.path === path;

  return {
    data: current ? state.data : null,
    error: current ? state.error : null,
    loading: Boolean(path) && !current,
    reload,
    setData,
  };
}
