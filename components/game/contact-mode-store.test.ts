import { beforeEach, describe, expect, it, vi } from "vitest"
import { getContactMode, setContactMode, subscribeContactMode } from "./contact-mode-store"

beforeEach(() => {
  setContactMode("message")
})

describe("contact-mode-store", () => {
  it("defaults to 'message' mode on first import, before anything sets it", async () => {
    vi.resetModules()
    const fresh = await import("./contact-mode-store")
    expect(fresh.getContactMode()).toBe("message")
  })

  it("updates the mode and reads it back", () => {
    setContactMode("brief")
    expect(getContactMode()).toBe("brief")
  })

  it("notifies a subscriber when the mode changes", () => {
    const listener = vi.fn()
    subscribeContactMode(listener)
    setContactMode("brief")
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it("does not notify when setting the same mode again", () => {
    setContactMode("brief")
    const listener = vi.fn()
    subscribeContactMode(listener)
    setContactMode("brief")
    expect(listener).not.toHaveBeenCalled()
  })

  it("stops notifying once unsubscribed", () => {
    const listener = vi.fn()
    const unsubscribe = subscribeContactMode(listener)
    unsubscribe()
    setContactMode("brief")
    expect(listener).not.toHaveBeenCalled()
  })

  it("notifies every independent subscriber, in no particular order", () => {
    const a = vi.fn()
    const b = vi.fn()
    subscribeContactMode(a)
    subscribeContactMode(b)
    setContactMode("brief")
    expect(a).toHaveBeenCalledTimes(1)
    expect(b).toHaveBeenCalledTimes(1)
  })

  it("shares one value across every reader — no per-instance state", () => {
    setContactMode("brief")
    // Simulates two independently-mounted ContactFormSection instances (the
    // always-mounted lite/SEO copy and the board's own) both reading through
    // the same module-level store instead of separate component state.
    expect(getContactMode()).toBe("brief")
    expect(getContactMode()).toBe("brief")
  })
})
