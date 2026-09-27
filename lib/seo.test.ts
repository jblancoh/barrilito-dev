import { describe, expect, it } from "vitest"
import { profile, socialLinks } from "./content"
import { buildJsonLd, buildRobots, buildSitemap, serializeJsonLd } from "./seo"
import { SITE_DESCRIPTION } from "./site-metadata"

const siteUrl = new URL("https://barrilito.dev")

type Node = Record<string, unknown>

function graphNode(type: string): Node {
  const graph = buildJsonLd(siteUrl)["@graph"] as Node[]
  const node = graph.find((entry) => entry["@type"] === type)
  if (!node) throw new Error(`missing ${type} node`)
  return node
}

describe("buildRobots", () => {
  // /maintenance stays crawlable on purpose: its `noindex` meta only works if
  // crawlers can fetch the page, which a robots.txt disallow would prevent.
  it("allows crawling the whole site", () => {
    expect(buildRobots(siteUrl).rules).toEqual({ userAgent: "*", allow: "/" })
  })

  it("points crawlers to the absolute sitemap URL", () => {
    expect(buildRobots(siteUrl).sitemap).toBe("https://barrilito.dev/sitemap.xml")
  })

  it("keeps the origin when the site URL carries a path", () => {
    expect(buildRobots(new URL("https://barrilito.dev/some/path")).sitemap).toBe(
      "https://barrilito.dev/sitemap.xml",
    )
  })
})

describe("buildSitemap", () => {
  it("lists only the home page (sections are #hash anchors, not separate URLs)", () => {
    const sitemap = buildSitemap(siteUrl)
    expect(sitemap).toHaveLength(1)
    expect(sitemap[0]).toMatchObject({ url: "https://barrilito.dev/", priority: 1 })
  })
})

describe("buildJsonLd", () => {
  it("uses the schema.org context with a graph of a Person and a WebSite", () => {
    const data = buildJsonLd(siteUrl)
    expect(data["@context"]).toBe("https://schema.org")
    expect((data["@graph"] as Node[]).map((node) => node["@type"])).toEqual(["Person", "WebSite"])
  })

  it("describes the person from the site content", () => {
    const person = graphNode("Person")
    expect(person).toMatchObject({
      "@id": "https://barrilito.dev/#person",
      name: profile.name,
      jobTitle: profile.title,
      url: "https://barrilito.dev/",
      image: "https://barrilito.dev/assets/barrildevb.png",
    })
    expect(person.alternateName).toEqual(expect.arrayContaining([profile.nickname, "BarrilitoDev"]))
  })

  it("links every social profile through sameAs", () => {
    expect(graphNode("Person").sameAs).toEqual(Object.values(socialLinks))
  })

  it("derives the address from the contact location", () => {
    expect(graphNode("Person").address).toEqual({
      "@type": "PostalAddress",
      addressLocality: "Villahermosa",
      addressRegion: "Tabasco",
      addressCountry: "MX",
    })
  })

  it("describes the website in Mexican Spanish, authored by the person", () => {
    expect(graphNode("WebSite")).toMatchObject({
      "@id": "https://barrilito.dev/#website",
      url: "https://barrilito.dev/",
      name: "BarrilitoDev",
      description: SITE_DESCRIPTION,
      inLanguage: "es-MX",
      author: { "@id": "https://barrilito.dev/#person" },
    })
  })
})

describe("serializeJsonLd", () => {
  it("round-trips as JSON", () => {
    const data = buildJsonLd(siteUrl)
    expect(JSON.parse(serializeJsonLd(data))).toEqual(data)
  })

  it("escapes < so the payload can never close its <script> tag", () => {
    const serialized = serializeJsonLd({ name: "</script><script>alert(1)</script>" })
    expect(serialized).not.toContain("<")
    expect(JSON.parse(serialized)).toEqual({ name: "</script><script>alert(1)</script>" })
  })
})
