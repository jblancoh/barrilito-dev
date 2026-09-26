import { describe, expect, it } from "vitest"
import { classifySwipe, inputHint } from "./touch-gesture"

const swipe = (startX: number, startY: number, endX: number, endY: number) =>
  classifySwipe({ startX, startY, endX, endY, viewportWidth: 390 })

describe("classifySwipe", () => {
  it("ignores a vertical scroll gesture", () => {
    expect(swipe(200, 600, 200, 200)).toBeNull()
    expect(swipe(200, 200, 205, 600)).toBeNull()
  })

  it("ignores a diagonal gesture that is not clearly horizontal", () => {
    expect(swipe(250, 400, 150, 330)).toBeNull()
  })

  it("ignores a short horizontal gesture below the threshold", () => {
    expect(swipe(200, 400, 150, 400)).toBeNull()
  })

  it("rolls forward on a left swipe", () => {
    expect(swipe(300, 400, 200, 420)).toBe("forward")
  })

  it("goes back on a right swipe", () => {
    expect(swipe(100, 400, 200, 390)).toBe("back")
  })

  it("ignores swipes that start at a side edge (system back gesture)", () => {
    expect(swipe(10, 400, 150, 400)).toBeNull()
    expect(swipe(380, 400, 240, 400)).toBeNull()
  })
})

describe("inputHint", () => {
  it("explains wheel controls for fine pointers", () => {
    expect(inputHint(false)).toBe("Scroll ↓ tira · Scroll ↑ regresa")
  })

  it("explains swipe controls for touch screens", () => {
    expect(inputHint(true)).toBe("Desliza ← tira · → regresa")
  })
})
