import { describe, expect, it } from "vitest"
import { buildShareUrl, getShareStrategy, parseStopHash, shouldSyncStopHash, withStopHash } from "./share"

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

describe("withStopHash", () => {
  it("replaces an existing hash with the given stop key", () => {
    expect(withStopHash("https://example.com/path?x=1#old", "projects")).toBe("/path?x=1#projects")
  })

  it("adds a hash to a URL that had none", () => {
    expect(withStopHash("https://example.com/path", "contact")).toBe("/path#contact")
  })

  it("keeps the pathname and query string exactly as they were", () => {
    expect(withStopHash("https://example.com/", "about")).toBe("/#about")
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

describe("shouldSyncStopHash", () => {
  it("does not add a hash while the board sits on its initial stop and the URL has none", () => {
    expect(shouldSyncStopHash({ currentHash: "", stopKey: "about", onInitialStop: true })).toBe(false)
  })

  it("syncs once the board leaves the initial stop", () => {
    expect(shouldSyncStopHash({ currentHash: "", stopKey: "skills", onInitialStop: false })).toBe(true)
  })

  it("syncs when returning to the initial stop after the URL already carries a hash", () => {
    expect(shouldSyncStopHash({ currentHash: "#skills", stopKey: "about", onInitialStop: true })).toBe(true)
  })

  it("leaves a foreign fragment untouched while the board sits on its initial stop", () => {
    expect(shouldSyncStopHash({ currentHash: "#main-content", stopKey: "about", onInitialStop: true })).toBe(false)
    expect(shouldSyncStopHash({ currentHash: "#", stopKey: "about", onInitialStop: true })).toBe(false)
  })

  it("replaces a foreign fragment once the board moves off its initial stop", () => {
    expect(shouldSyncStopHash({ currentHash: "#main-content", stopKey: "skills", onInitialStop: false })).toBe(true)
  })

  it("skips the write when the hash already matches the stop", () => {
    expect(shouldSyncStopHash({ currentHash: "#projects", stopKey: "projects", onInitialStop: false })).toBe(false)
  })
})
