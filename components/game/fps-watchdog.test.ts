import { describe, expect, it } from "vitest"
import { shouldDegrade } from "./fps-watchdog"

/** Builds an array of `count` frame durations (ms) for a steady `fps`. */
function framesAt(fps: number, count: number): number[] {
  return Array.from({ length: count }, () => 1000 / fps)
}

describe("shouldDegrade", () => {
  it("does not degrade before enough samples have been collected", () => {
    expect(shouldDegrade(framesAt(5, 10), { minSamples: 30 })).toBe(false)
  })

  it("degrades when the average fps stays below the threshold", () => {
    expect(shouldDegrade(framesAt(15, 60), { minFps: 24, minSamples: 30 })).toBe(true)
  })

  it("does not degrade when the average fps meets the threshold", () => {
    expect(shouldDegrade(framesAt(30, 60), { minFps: 24, minSamples: 30 })).toBe(false)
  })

  it("does not degrade on an empty sample set", () => {
    expect(shouldDegrade([], { minSamples: 0 })).toBe(false)
  })

  it("uses the default 24fps / 30-sample thresholds when no options are given", () => {
    expect(shouldDegrade(framesAt(10, 30))).toBe(true)
    expect(shouldDegrade(framesAt(60, 30))).toBe(false)
  })

  it("honors a custom minFps threshold", () => {
    expect(shouldDegrade(framesAt(20, 30), { minFps: 15 })).toBe(false)
    expect(shouldDegrade(framesAt(20, 30), { minFps: 25 })).toBe(true)
  })
})
