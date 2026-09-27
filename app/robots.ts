import type { MetadataRoute } from "next"
import { buildRobots } from "@/lib/seo"
import { resolveSiteUrl } from "@/lib/site-url"

export default function robots(): MetadataRoute.Robots {
  return buildRobots(resolveSiteUrl(process.env))
}
