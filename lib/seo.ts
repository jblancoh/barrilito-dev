import type { MetadataRoute } from "next"
import { contactInfo, profile, socialLinks } from "./content"
import { SITE_DESCRIPTION } from "./site-metadata"

/**
 * Pure builders for the crawler-facing files (`app/robots.ts`,
 * `app/sitemap.ts`) and the home page's JSON-LD structured data. They take
 * the resolved site URL (see `lib/site-url.ts`) so every absolute URL they
 * emit points at the real public origin.
 */

const SITE_NAME = "BarrilitoDev"
const LOGO_PATH = "/assets/barrildevb.png"

function absolute(path: string, siteUrl: URL): string {
  return new URL(path, siteUrl.origin).toString()
}

/**
 * No `disallow` for /maintenance: its `noindex` meta keeps it out of the
 * index, and crawlers can only read that meta if they may fetch the page.
 */
export function buildRobots(siteUrl: URL): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: absolute("/sitemap.xml", siteUrl),
  }
}

/** Board stops are `#hash` anchors on the home page, so the home is the only URL. */
export function buildSitemap(siteUrl: URL): MetadataRoute.Sitemap {
  return [{ url: absolute("/", siteUrl), changeFrequency: "monthly", priority: 1 }]
}

/**
 * "Villahermosa, Tabasco, México" → locality + region; the site is
 * Mexico-based. Blank parts are dropped, and a blank location yields no
 * address at all rather than an empty `PostalAddress`.
 */
export function postalAddress(location: string) {
  const [locality, region] = location.split(",").map((part) => part.trim())
  if (!locality && !region) return undefined
  return {
    "@type": "PostalAddress",
    ...(locality ? { addressLocality: locality } : {}),
    ...(region ? { addressRegion: region } : {}),
    addressCountry: "MX",
  }
}

export function buildJsonLd(siteUrl: URL): Record<string, unknown> {
  const home = absolute("/", siteUrl)
  const personId = `${home}#person`
  const address = postalAddress(contactInfo.location)

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": personId,
        name: profile.name,
        alternateName: [profile.nickname, SITE_NAME],
        jobTitle: profile.title,
        description: profile.bioShort,
        url: home,
        image: absolute(LOGO_PATH, siteUrl),
        sameAs: Object.values(socialLinks),
        ...(address ? { address } : {}),
      },
      {
        "@type": "WebSite",
        "@id": `${home}#website`,
        url: home,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: "es-MX",
        author: { "@id": personId },
      },
    ],
  }
}

/**
 * JSON for an inline `<script type="application/ld+json">`. `<` is escaped
 * as `<` (still valid JSON) so no value can close the script tag.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}
