import { useCallback, useEffect, useRef, useState } from 'react';
import { subscribe } from '../utils/events';

/**
 * Runs an async loader and tracks loading / error / data. Re-runs when `deps`
 * change, on reload(), and when any of the given event topics fire.
 * Stale responses from superseded calls are ignored.
 */
export function useAsync(loader, deps = [], { topics = [], enabled = true } = {}) {
  const [state, setState] = useState({ data: undefined, error: null, loading: enabled, loadedAt: null });
  const callId = useRef(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const run = useCallback(() => {
    if (!enabled) return;
    callId.current += 1;
    const id = callId.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.resolve()
      .then(() => loaderRef.current())
      .then(
        (data) => {
          if (id === callId.current) setState({ data, error: null, loading: false, loadedAt: new Date().toISOString() });
        },
        (error) => {
          if (id === callId.current) setState((s) => ({ ...s, error, loading: false }));
        }
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  useEffect(() => {
    run();
    return () => {
      // Invalidate in-flight calls when deps change or on unmount.
      callId.current += 1;
    };
  }, [run]);

  const topicKey = topics.join('|');
  useEffect(() => {
    if (!topicKey) return undefined;
    const unsubs = topicKey.split('|').map((t) => subscribe(t, run));
    return () => unsubs.forEach((u) => u());
  }, [topicKey, run]);

  return { ...state, reload: run, setData: (updater) => setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater })) };
}
