import { describe, expect, it } from "vitest"
import { buildQrMatrixPath, QR_DARK, QR_LIGHT } from "./qr"

describe("buildQrMatrixPath", () => {
  it("is deterministic for the same input", () => {
    const first = buildQrMatrixPath("https://example.com/#projects")
    const second = buildQrMatrixPath("https://example.com/#projects")
    expect(second).toEqual(first)
  })

  it("grows the matrix size as the encoded value gets longer", () => {
    const short = buildQrMatrixPath("https://a.co")
    const long = buildQrMatrixPath(`https://example.com/${"a".repeat(200)}`)
    expect(long.size).toBeGreaterThan(short.size)
  })

  it("produces a non-empty svg path", () => {
    const { path } = buildQrMatrixPath("https://example.com")
    expect(path.length).toBeGreaterThan(0)
  })

  it("keeps every dark module inside the 4-module quiet zone", () => {
    const { path } = buildQrMatrixPath("https://example.com")
    const coordinates = Array.from(path.matchAll(/M(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)).map((match) => [
      Number(match[1]),
      Number(match[2]),
    ])
    expect(coordinates.length).toBeGreaterThan(0)
    for (const [x, y] of coordinates) {
      expect(x).toBeGreaterThanOrEqual(4)
      expect(y).toBeGreaterThanOrEqual(4)
    }
  })

  it("exposes fixed, theme-independent colors", () => {
    expect(QR_DARK).toBe("#000000")
    expect(QR_LIGHT).toBe("#ffffff")
  })
})
