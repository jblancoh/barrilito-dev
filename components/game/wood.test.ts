import { describe, expect, it } from "vitest"
import { MIN_ADJACENT_STEP, WOOD_HUE_RANGE, WOOD_LIGHTNESS_RANGE, woodPlankShades } from "./wood"

describe("woodPlankShades", () => {
  it("returns one shade per plank", () => {
    expect(woodPlankShades(10, 7)).toHaveLength(10)
  })

  it("is deterministic for the same seed", () => {
    expect(woodPlankShades(10, 7)).toEqual(woodPlankShades(10, 7))
  })

  it("varies with the seed", () => {
    expect(woodPlankShades(10, 7)).not.toEqual(woodPlankShades(10, 8))
  })

  it("keeps every shade within the wood hue and lightness range", () => {
    for (const shade of woodPlankShades(24, 3)) {
      expect(shade.h).toBeGreaterThanOrEqual(WOOD_HUE_RANGE[0])
      expect(shade.h).toBeLessThanOrEqual(WOOD_HUE_RANGE[1])
      expect(shade.l).toBeGreaterThanOrEqual(WOOD_LIGHTNESS_RANGE[0])
      expect(shade.l).toBeLessThanOrEqual(WOOD_LIGHTNESS_RANGE[1])
      expect(shade.s).toBeGreaterThan(0)
      expect(shade.s).toBeLessThanOrEqual(100)
    }
  })

  it.each([9, 10, 11])("keeps every adjacent pair apart, including the wrap-around seam (%i planks)", (count) => {
    const shades = woodPlankShades(count, 7)
    shades.forEach((shade, k) => {
      const next = shades[(k + 1) % shades.length]
      expect(Math.abs(shade.l - next.l)).toBeGreaterThanOrEqual(MIN_ADJACENT_STEP)
    })
  })
})
