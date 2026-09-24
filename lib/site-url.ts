/**
 * Resolves the canonical, absolute origin of the deployed site, used as
 * `metadataBase` for Next.js metadata (so relative OG/Twitter image URLs
 * resolve correctly) and for anything else that needs the real public URL.
 *
 * Precedence:
 * 1. `NEXT_PUBLIC_SITE_URL` — an explicit full URL (trailing slash tolerated),
 *    set when a custom domain differs from the Vercel project's own domain.
 * 2. `VERCEL_PROJECT_PRODUCTION_URL` — a Vercel system env var: the project's
 *    production domain, set even in preview deployments (see
 *    https://vercel.com/docs/environment-variables/system-environment-variables).
 * 3. `VERCEL_URL` — the domain of the current deployment.
 * 4. `http://localhost:3000` — local development fallback.
 *
 * Empty/whitespace-only values are ignored, and an invalid
 * `NEXT_PUBLIC_SITE_URL` falls through to the next source instead of
 * throwing.
 */

export interface SiteUrlEnv {
  NEXT_PUBLIC_SITE_URL?: string
  VERCEL_PROJECT_PRODUCTION_URL?: string
  VERCEL_URL?: string
  // Index signature so `process.env` (a much wider type) is assignable:
  // without it, TS2559 rejects the call because `SiteUrlEnv`'s three
  // optional-only properties count as a "weak type" with nothing in common.
  [key: string]: string | undefined
}

const FALLBACK_URL = "http://localhost:3000"

function nonBlank(value: string | undefined): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function tryParseUrl(value: string): URL | null {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

export function resolveSiteUrl(env: SiteUrlEnv): URL {
  const explicit = nonBlank(env.NEXT_PUBLIC_SITE_URL)
  if (explicit) {
    const parsed = tryParseUrl(explicit)
    if (parsed) return parsed
  }

  const productionDomain = nonBlank(env.VERCEL_PROJECT_PRODUCTION_URL)
  if (productionDomain) return new URL(`https://${productionDomain}`)

  const deploymentDomain = nonBlank(env.VERCEL_URL)
  if (deploymentDomain) return new URL(`https://${deploymentDomain}`)

  return new URL(FALLBACK_URL)
}
