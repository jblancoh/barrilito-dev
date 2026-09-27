import type { MetadataRoute } from "next"
import { buildSitemap } from "@/lib/seo"
import { resolveSiteUrl } from "@/lib/site-url"

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemap(resolveSiteUrl(process.env))
}
