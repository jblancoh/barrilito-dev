/**
 * Maintenance-mode routing, decided by `proxy.ts` from
 * `NEXT_PUBLIC_MAINTENANCE_MODE`. Kept pure so the decision is testable
 * without a request.
 *
 * During maintenance every page answers with the maintenance content on its
 * own URL as `503 Service Unavailable` + `Retry-After`: Google treats that as
 * temporary downtime and keeps the page indexed, whereas redirecting to a
 * `noindex` page for long could drop the home page from the index.
 */

export const MAINTENANCE_PATH = "/maintenance"

/** How long crawlers should wait before retrying (one hour). */
export const MAINTENANCE_RETRY_AFTER_SECONDS = 3600

export type MaintenanceAction =
  | { type: "next" }
  | { type: "redirect"; destination: string }
  | { type: "rewrite"; destination: string; status: 503; retryAfterSeconds: number }

export function resolveMaintenanceAction(pathname: string, maintenanceEnabled: boolean): MaintenanceAction {
  if (maintenanceEnabled) {
    if (pathname === MAINTENANCE_PATH) return { type: "next" }
    return {
      type: "rewrite",
      destination: MAINTENANCE_PATH,
      status: 503,
      retryAfterSeconds: MAINTENANCE_RETRY_AFTER_SECONDS,
    }
  }

  if (pathname === MAINTENANCE_PATH) return { type: "redirect", destination: "/" }
  return { type: "next" }
}
