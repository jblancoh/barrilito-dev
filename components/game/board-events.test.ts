import { afterEach, describe, expect, it, vi } from "vitest"
import { decideNavigation, navigateToStop } from "./board-events"

describe("decideNavigation", () => {
  it("dispatches a board event when a board listener is registered", () => {
    expect(decideNavigation("skills", true, false)).toEqual({ kind: "dispatch", stopKey: "skills" })
  })

  it("dispatches regardless of reduced motion when a board listener exists", () => {
    expect(decideNavigation("skills", true, true)).toEqual({ kind: "dispatch", stopKey: "skills" })
  })

  it("falls back to a smooth scroll when no board listener is registered", () => {
    expect(decideNavigation("contact", false, false)).toEqual({
      kind: "scroll",
      stopKey: "contact",
      behavior: "smooth",
    })
  })

  it("scrolls without animation when reduced motion is preferred and no board listener exists", () => {
    expect(decideNavigation("contact", false, true)).toEqual({
      kind: "scroll",
      stopKey: "contact",
      behavior: "auto",
    })
  })
})

describe("navigateToStop (scroll branch)", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("syncs the hash with replaceState, never pushState, keeping path, query and history state", () => {
    const replaceState = vi.fn()
    const pushState = vi.fn()
    const scrollIntoView = vi.fn()
    const state = { __NA: true }
    vi.stubGlobal("window", {
      location: { href: "https://example.com/?mode=lite#about" },
      history: { state, replaceState, pushState },
      matchMedia: () => ({ matches: false }),
    })
    vi.stubGlobal("document", { getElementById: () => ({ scrollIntoView }) })

    navigateToStop("projects")

    expect(replaceState).toHaveBeenCalledWith(state, "", "/?mode=lite#projects")
    expect(pushState).not.toHaveBeenCalled()
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" })
  })
})
