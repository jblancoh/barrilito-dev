import { describe, expect, it } from "vitest"
import { decideNavigation } from "./board-events"

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
