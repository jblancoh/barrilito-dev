import { afterEach, describe, expect, it, vi } from "vitest"
import { decideNavigation, navigateToStop, shouldIgnoreBoardInput } from "./board-events"

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

describe("shouldIgnoreBoardInput", () => {
  const baseInput = {
    targetTag: null as string | null,
    targetIsContentEditable: false,
    targetInDialog: false,
    modalOpen: false,
  }

  it("lets ordinary input through when nothing dialog- or form-related is going on", () => {
    expect(shouldIgnoreBoardInput(baseInput)).toBe(false)
  })

  it("ignores input while any modal dialog is open, even if the event target is outside it", () => {
    expect(shouldIgnoreBoardInput({ ...baseInput, modalOpen: true })).toBe(true)
  })

  it("ignores input whose event target is inside a dialog", () => {
    expect(shouldIgnoreBoardInput({ ...baseInput, targetInDialog: true })).toBe(true)
  })

  it("ignores input targeting an INPUT, TEXTAREA or SELECT element", () => {
    expect(shouldIgnoreBoardInput({ ...baseInput, targetTag: "INPUT" })).toBe(true)
    expect(shouldIgnoreBoardInput({ ...baseInput, targetTag: "TEXTAREA" })).toBe(true)
    expect(shouldIgnoreBoardInput({ ...baseInput, targetTag: "SELECT" })).toBe(true)
  })

  it("ignores input targeting a contenteditable element", () => {
    expect(shouldIgnoreBoardInput({ ...baseInput, targetIsContentEditable: true })).toBe(true)
  })

  it("does not ignore input targeting an unrelated element like a BUTTON or DIV", () => {
    expect(shouldIgnoreBoardInput({ ...baseInput, targetTag: "BUTTON" })).toBe(false)
    expect(shouldIgnoreBoardInput({ ...baseInput, targetTag: "DIV" })).toBe(false)
  })
})
