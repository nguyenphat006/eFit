/**
 * Try the real API call. If it fails (network error, 4xx/5xx, anything thrown),
 * return the provided fallback value instead so the UI can still render.
 *
 * Intent: when developing offline / backend down → mock data keeps UI alive.
 * When backend works → caller gets real data, identical shape.
 */
export async function withFallback<T>(
  promise: Promise<T>,
  fallback: T,
  label?: string,
): Promise<T> {
  try {
    return await promise;
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(
        `[mock-fallback]${label ? ` ${label}` : ''}: API unreachable, using mock data.`,
        err instanceof Error ? err.message : err,
      );
    }
    return fallback;
  }
}
