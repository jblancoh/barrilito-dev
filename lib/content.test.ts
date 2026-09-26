import { describe, expect, it } from "vitest"
import { community, contactInfo, featuredCases, offer, pillars, profile, secondaryCases, tools } from "./content"

const allCases = [...featuredCases, ...secondaryCases]

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") {
    out.push(value)
  } else if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out)
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectStrings(item, out)
  }
  return out
}

describe("content invariants", () => {
  it("has exactly 4 featured cases", () => {
    expect(featuredCases).toHaveLength(4)
  })

  it("never links to a placeholder '#' anchor", () => {
    for (const c of allCases) {
      expect(c.link).not.toBe("#")
    }
  })

  it("never references the generic /placeholder.svg image", () => {
    for (const c of allCases) {
      expect(c.image).not.toBe("/placeholder.svg")
      if (c.image) expect(c.image).not.toContain("/placeholder.svg")
    }
  })

  it("gives every offered service a non-empty description", () => {
    expect(offer.services.length).toBeGreaterThan(0)
    for (const service of offer.services) {
      expect(service.description.trim().length).toBeGreaterThan(0)
    }
  })

  it("never mentions vibecoding anywhere in the public copy", () => {
    const haystack = collectStrings({ profile, pillars, tools, featuredCases, secondaryCases, offer, community, contactInfo })
      .join(" \n ")
      .toLowerCase()
    expect(haystack).not.toContain("vibecod")
  })

  it("stores a WhatsApp-ready phone number in the contact data", () => {
    expect(contactInfo.phone.replace(/\D/g, "")).toBe("529933600042")
  })

  it("never repeats the phone number in the rest of the public copy", () => {
    const { phone, ...publicContact } = contactInfo
    const digits = phone.replace(/\D/g, "")
    const haystack = collectStrings({ profile, pillars, tools, featuredCases, secondaryCases, offer, community, publicContact })
      .map((text) => text.replace(/\D/g, ""))
      .join(" ")
    expect(haystack).not.toContain(digits.slice(-10))
  })
})
