/** Pure helpers for the barrel token's procedural wood look (no DOM / three.js). */

export interface HslShade {
  h: number
  s: number
  l: number
}

/** Warm oak/brown hues, in degrees. */
export const WOOD_HUE_RANGE: readonly [number, number] = [22, 34]
/** Plank lightness, in percent: dark enough to read as wood, light enough to show grain. */
export const WOOD_LIGHTNESS_RANGE: readonly [number, number] = [30, 46]

const MIN_ADJACENT_STEP = 3

/** Small deterministic PRNG (mulberry32) so the texture looks the same on every load. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Per-plank shades for a barrel of `count` staves; adjacent planks always differ in lightness. */
export function woodPlankShades(count: number, seed: number): HslShade[] {
  const rand = seededRandom(seed)
  const [hMin, hMax] = WOOD_HUE_RANGE
  const [lMin, lMax] = WOOD_LIGHTNESS_RANGE
  const mid = (lMin + lMax) / 2
  return Array.from({ length: count }, (_, k) => {
    // Alternate darker/lighter around the middle so neighbours never blend into one plank.
    const side = k % 2 === 0 ? -1 : 1
    const spread = MIN_ADJACENT_STEP / 2 + rand() * ((lMax - lMin) / 2 - MIN_ADJACENT_STEP / 2)
    return {
      h: hMin + rand() * (hMax - hMin),
      s: 42 + rand() * 18,
      l: mid + side * spread,
    }
  })
}
