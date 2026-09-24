import { describe, expect, it } from "vitest"
import * as THREE from "three"
import { toHslColor } from "./color"

describe("toHslColor", () => {
  it("converts a shadcn HSL triple into comma-separated hsl()", () => {
    expect(toHslColor("0 0% 7%")).toBe("hsl(0, 0%, 7%)")
    expect(toHslColor(" 217.2 32.6% 17.5% ")).toBe("hsl(217.2, 32.6%, 17.5%)")
  })

  it("falls back to black for empty or malformed values", () => {
    expect(toHslColor("")).toBe("hsl(0, 0%, 0%)")
    expect(toHslColor("nope")).toBe("hsl(0, 0%, 0%)")
  })

  it("produces strings three.js can parse", () => {
    const color = new THREE.Color(0xffffff)
    color.set(toHslColor("0 0% 7%"))
    expect(color.getHexString()).toBe("121212")
  })
})
