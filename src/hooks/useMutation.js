import { useCallback, useRef, useState } from 'react';

/** Wraps a write operation; prevents duplicate submissions while pending. */
export function useMutation(fn) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const inFlight = useRef(false);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const mutate = useCallback(async (...args) => {
    if (inFlight.current) return undefined;
    inFlight.current = true;
    setPending(true);
    setError(null);
    try {
      return await fnRef.current(...args);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }, []);

  return { mutate, pending, error, reset: () => setError(null) };
}
