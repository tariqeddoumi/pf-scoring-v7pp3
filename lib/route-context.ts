/**
 * Utilities for dynamic Next.js App Router route handlers.
 *
 * Next.js 15 route handler context expects `params` to be provided
 * asynchronously as a Promise.
 */
export type RouteContext<TParams extends Record<string, string> = Record<string, string>> = {
  params: Promise<TParams>;
};

/**
 * Resolve dynamic route params from Next.js route context.
 */
export async function resolveRouteParams<TParams extends Record<string, string>>(
  context: RouteContext<TParams>
): Promise<TParams> {
  return await context.params;
}
