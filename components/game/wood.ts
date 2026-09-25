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

/** Minimum lightness gap, in percent, between any two neighbouring planks (wrap-around included). */
export const MIN_ADJACENT_STEP = 3

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

/**
 * Per-plank shades for a barrel of `count` staves. Planks alternate darker/lighter around the
 * middle lightness so neighbours never blend into one plank; the barrel is cyclic, so with an odd
 * count the last plank sits exactly on the middle to stay apart from both of its neighbours.
 */
export function woodPlankShades(count: number, seed: number): HslShade[] {
  const rand = seededRandom(seed)
  const [hMin, hMax] = WOOD_HUE_RANGE
  const [lMin, lMax] = WOOD_LIGHTNESS_RANGE
  const mid = (lMin + lMax) / 2
  const maxSpread = (lMax - lMin) / 2
  return Array.from({ length: count }, (_, k) => {
    const isOddSeam = count % 2 === 1 && k === count - 1
    const side = k % 2 === 0 ? -1 : 1
    const spread = MIN_ADJACENT_STEP + rand() * (maxSpread - MIN_ADJACENT_STEP)
    return {
      h: hMin + rand() * (hMax - hMin),
      s: 42 + rand() * 18,
      l: isOddSeam ? mid : mid + side * spread,
    }
  })
}
