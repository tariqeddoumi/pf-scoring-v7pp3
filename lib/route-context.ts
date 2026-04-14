/**
 * Utilities for dynamic Next.js App Router route handlers.
 *
 * Next.js has changed the typing of route params across versions.
 * In some environments the route context exposes `params` directly,
 * while in newer builds it may expose `params` as a Promise.
 *
 * This helper normalizes both cases so route handlers remain compatible
 * and easier to maintain.
 */
export type RouteContext<TParams extends Record<string, string> = Record<string, string>> = {
  params?: TParams | Promise<TParams>;
};

/**
 * Resolve dynamic route params regardless of whether Next.js provides
 * them synchronously or asynchronously.
 */
export async function resolveRouteParams<TParams extends Record<string, string>>(
  context: RouteContext<TParams> | undefined
): Promise<TParams> {
  if (!context || !context.params) {
    return {} as TParams;
  }

  return await Promise.resolve(context.params);
}
