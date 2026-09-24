import { describe, expect, it } from "vitest"
import { isModestDevice } from "./device-tier"

describe("isModestDevice", () => {
  it("is modest when hardwareConcurrency is 4 or fewer cores", () => {
    expect(isModestDevice({ hardwareConcurrency: 4, viewportWidth: 1440 })).toBe(true)
    expect(isModestDevice({ hardwareConcurrency: 2, viewportWidth: 1440 })).toBe(true)
  })

  it("is not modest with plenty of cores and a wide viewport", () => {
    expect(isModestDevice({ hardwareConcurrency: 8, viewportWidth: 1440 })).toBe(false)
  })

  it("is modest on a narrow viewport regardless of core count", () => {
    expect(isModestDevice({ hardwareConcurrency: 8, viewportWidth: 600 })).toBe(true)
  })

  it("defaults to not modest when hardwareConcurrency is unknown and the viewport is wide", () => {
    expect(isModestDevice({ viewportWidth: 1440 })).toBe(false)
  })

  it("treats exactly 900px as wide (matches the board's own narrow-layout breakpoint)", () => {
    expect(isModestDevice({ hardwareConcurrency: 8, viewportWidth: 900 })).toBe(false)
    expect(isModestDevice({ hardwareConcurrency: 8, viewportWidth: 899 })).toBe(true)
  })
})
