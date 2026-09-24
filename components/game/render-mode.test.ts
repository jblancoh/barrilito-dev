import { describe, expect, it } from "vitest"
import { detectRenderMode, type RenderEnv } from "./render-mode"

const capableEnv: RenderEnv = {
  webgl: true,
  reducedMotion: false,
}

describe("detectRenderMode", () => {
  it("returns full when the device is capable and nothing overrides it", () => {
    expect(detectRenderMode(capableEnv)).toBe("full")
  })

  it("prefers a valid override over everything else", () => {
    expect(detectRenderMode({ ...capableEnv, override: "lite" })).toBe("lite")
    expect(detectRenderMode({ ...capableEnv, webgl: false, override: "full" })).toBe("full")
  })

  it("ignores an invalid override and falls through to the stored preference", () => {
    expect(detectRenderMode({ ...capableEnv, override: "bogus", stored: "lite" })).toBe("lite")
  })

  it("prefers a valid stored preference over the heuristic", () => {
    expect(detectRenderMode({ ...capableEnv, webgl: false, stored: "full" })).toBe("full")
  })

  it("ignores an invalid stored value and falls through to the heuristic", () => {
    expect(detectRenderMode({ ...capableEnv, stored: "bogus" })).toBe("full")
  })

  it("degrades to lite when WebGL is unavailable", () => {
    expect(detectRenderMode({ ...capableEnv, webgl: false })).toBe("lite")
  })

  it("degrades to lite when the user prefers reduced motion", () => {
    expect(detectRenderMode({ ...capableEnv, reducedMotion: true })).toBe("lite")
  })

  it("degrades to lite when the browser requests Save-Data", () => {
    expect(detectRenderMode({ ...capableEnv, saveData: true })).toBe("lite")
  })

  it("degrades to lite when device memory is 2GB or less", () => {
    expect(detectRenderMode({ ...capableEnv, deviceMemory: 2 })).toBe("lite")
    expect(detectRenderMode({ ...capableEnv, deviceMemory: 4 })).toBe("full")
  })

  it("degrades to lite when hardware concurrency is 2 or fewer cores", () => {
    expect(detectRenderMode({ ...capableEnv, hardwareConcurrency: 2 })).toBe("lite")
    expect(detectRenderMode({ ...capableEnv, hardwareConcurrency: 8 })).toBe("full")
  })
})
