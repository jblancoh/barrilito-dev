import { describe, expect, it } from "vitest"
import { buildShareUrl, getShareStrategy, parseStopHash } from "./share"

describe("parseStopHash", () => {
  it("accepts a hash with the leading '#'", () => {
    expect(parseStopHash("#projects")).toBe("projects")
  })

  it("accepts a bare stop key without '#'", () => {
    expect(parseStopHash("projects")).toBe("projects")
  })

  it("trims surrounding whitespace before matching", () => {
    expect(parseStopHash("  #skills  ")).toBe("skills")
  })

  it("is case-sensitive against the real stop keys", () => {
    expect(parseStopHash("#Projects")).toBeNull()
    expect(parseStopHash("#PROJECTS")).toBeNull()
  })

  it("returns null for an empty string", () => {
    expect(parseStopHash("")).toBeNull()
  })

  it("returns null for a lone '#'", () => {
    expect(parseStopHash("#")).toBeNull()
  })

  it("returns null for an unknown key", () => {
    expect(parseStopHash("#not-a-stop")).toBeNull()
  })

  it("matches every real stop key from board-config", () => {
    for (const key of ["about", "skills", "projects", "services", "info", "contact"] as const) {
      expect(parseStopHash(`#${key}`)).toBe(key)
    }
  })
})

describe("buildShareUrl", () => {
  it("keeps origin, pathname and hash", () => {
    expect(buildShareUrl("https://example.com/path#projects")).toBe("https://example.com/path#projects")
  })

  it("removes the mode query param", () => {
    expect(buildShareUrl("https://example.com/?mode=lite")).toBe("https://example.com/")
  })

  it("removes mode while keeping other query params, regardless of order", () => {
    expect(buildShareUrl("https://example.com/?a=1&mode=full&b=2")).toBe("https://example.com/?a=1&b=2")
  })

  it("keeps other query params when there is no mode param", () => {
    expect(buildShareUrl("https://example.com/?a=1&b=2")).toBe("https://example.com/?a=1&b=2")
  })

  it("removes mode and keeps the hash together", () => {
    expect(buildShareUrl("https://example.com/?mode=lite#skills")).toBe("https://example.com/#skills")
  })
})

describe("getShareStrategy", () => {
  it("uses native share only when both native share and a coarse pointer are available", () => {
    expect(getShareStrategy({ hasNativeShare: true, isCoarsePointer: true })).toBe("native")
  })

  it("falls back to the dialog when native share is unavailable, even on a coarse pointer", () => {
    expect(getShareStrategy({ hasNativeShare: false, isCoarsePointer: true })).toBe("dialog")
  })

  it("falls back to the dialog on a fine pointer, even when native share is available", () => {
    expect(getShareStrategy({ hasNativeShare: true, isCoarsePointer: false })).toBe("dialog")
  })

  it("falls back to the dialog when neither is available", () => {
    expect(getShareStrategy({ hasNativeShare: false, isCoarsePointer: false })).toBe("dialog")
  })
})
