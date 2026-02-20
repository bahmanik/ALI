/**
 * Minimal "run-once" helper for async initializers.
 *
 * - First call runs `init()`.
 * - Subsequent calls return the same Promise.
 * - If `init()` throws, callers all observe the same rejection.
 */
export function startOnce<T>(init: () => Promise<T> | T): () => Promise<T> {
  let started: Promise<T> | undefined;

  return () => {
    if (!started) started = Promise.resolve().then(init);
    return started;
  };
}
