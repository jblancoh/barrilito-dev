import { describe, expect, it, vi } from "vitest"
import { subscribeCoarsePointer } from "./pointer-media"

type Listener = () => void

function modernQuery(matches: boolean) {
  const listeners = new Set<Listener>()
  return {
    query: {
      matches,
      addEventListener: vi.fn((_: string, l: Listener) => listeners.add(l)),
      removeEventListener: vi.fn((_: string, l: Listener) => listeners.delete(l)),
    },
    listeners,
  }
}

describe("subscribeCoarsePointer", () => {
  it("reports the current value and follows changes", () => {
    const { query, listeners } = modernQuery(true)
    const onChange = vi.fn()
    const unsubscribe = subscribeCoarsePointer({ matchMedia: () => query }, onChange)
    expect(onChange).toHaveBeenLastCalledWith(true)
    query.matches = false
    listeners.forEach((l) => l())
    expect(onChange).toHaveBeenLastCalledWith(false)
    unsubscribe()
    expect(listeners.size).toBe(0)
  })

  it("falls back to addListener on legacy Safari", () => {
    const listeners = new Set<Listener>()
    const query = {
      matches: true,
      addListener: vi.fn((l: Listener) => listeners.add(l)),
      removeListener: vi.fn((l: Listener) => listeners.delete(l)),
    }
    const onChange = vi.fn()
    const unsubscribe = subscribeCoarsePointer({ matchMedia: () => query }, onChange)
    expect(onChange).toHaveBeenLastCalledWith(true)
    expect(listeners.size).toBe(1)
    unsubscribe()
    expect(listeners.size).toBe(0)
  })

  it("reports false when matchMedia is unavailable", () => {
    const onChange = vi.fn()
    const unsubscribe = subscribeCoarsePointer({}, onChange)
    expect(onChange).toHaveBeenLastCalledWith(false)
    expect(() => unsubscribe()).not.toThrow()
  })
})
