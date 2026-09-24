/**
 * Pure QR-matrix helper: turns an arbitrary string (the shared URL) into an
 * SVG path `d` string of 1x1 squares, one per dark module, plus the total
 * viewBox size. No DOM/SVG element is built here on purpose, so this module
 * stays unit-testable in isolation (see qr.test.ts); `<ShareQr>` renders the
 * actual `<svg>` from this data.
 */

import * as QRCode from "qrcode"

/** Modules of quiet zone (blank margin) on every side of the QR symbol. */
const QUIET_ZONE = 4

/**
 * Fixed QR colors: always dark modules on a light background, regardless of
 * the site's theme. A QR code inverted for dark mode is unreliable to scan,
 * so this is a deliberate exception to the "theme tokens only" rule.
 */
export const QR_DARK = "#000000"
export const QR_LIGHT = "#ffffff"

export interface QrMatrix {
  /** Length of one side of the square viewBox, in modules (quiet zone included). */
  readonly size: number
  /** SVG path `d` string covering every dark module, offset by the quiet zone. */
  readonly path: string
}

/**
 * Encodes `value` as a QR symbol (error correction level "M", a common
 * middle ground between symbol size and damage tolerance) and returns the
 * SVG path for its dark modules, offset by a 4-module quiet zone on every
 * side so the code stays scannable right up to the edge of its viewBox.
 */
export function buildQrMatrixPath(value: string): QrMatrix {
  const qr = QRCode.create(value, { errorCorrectionLevel: "M" })
  const moduleCount = qr.modules.size
  const size = moduleCount + QUIET_ZONE * 2

  let path = ""
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (!qr.modules.get(row, col)) continue
      const x = col + QUIET_ZONE
      const y = row + QUIET_ZONE
      path += `M${x},${y}h1v1h-1z`
    }
  }

  return { size, path }
}
