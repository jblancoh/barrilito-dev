import { HomeSwitch } from "@/components/game/home-switch"
import { buildJsonLd, serializeJsonLd } from "@/lib/seo"
import { resolveSiteUrl } from "@/lib/site-url"

export default function Home() {
  const jsonLd = serializeJsonLd(buildJsonLd(resolveSiteUrl(process.env)))

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <HomeSwitch />
    </>
  )
}
