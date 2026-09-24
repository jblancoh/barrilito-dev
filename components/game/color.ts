const FALLBACK = "hsl(0, 0%, 0%)"

/**
 * Converts a shadcn CSS variable triple ("217.2 32.6% 17.5%") into comma-separated
 * `hsl(h, s%, l%)`. three.js r160 `Color.setStyle` only parses the comma form and silently
 * leaves the color untouched otherwise; Canvas 2D accepts both.
 */
export function toHslColor(raw: string): string {
  const parts = raw.trim().split(/[\s,]+/).filter(Boolean)
  if (parts.length < 3) return FALLBACK
  const [h, s, l] = parts
  if (!/^-?\d*\.?\d+$/.test(h) || !/%$/.test(s) || !/%$/.test(l)) return FALLBACK
  return `hsl(${h}, ${s}, ${l})`
}
