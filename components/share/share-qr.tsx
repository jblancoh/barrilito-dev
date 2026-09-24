import * as React from "react"

import { buildQrMatrixPath, QR_DARK, QR_LIGHT } from "@/lib/qr"

export interface ShareQrProps extends React.SVGAttributes<SVGSVGElement> {
  /** The value encoded into the QR code — typically the current shareable URL. */
  value: string
}

/**
 * Renders `value` as a QR code. Always dark-on-light, even in dark mode: a
 * QR scanner relies on high, predictable contrast, so this is a deliberate
 * exception to the app's "theme tokens only" rule (colors come from
 * lib/qr.ts, not the theme). forwardRef so callers (the share dialog's
 * download buttons) can serialize the underlying `<svg>` directly.
 */
export const ShareQr = React.forwardRef<SVGSVGElement, ShareQrProps>(
  ({ value, "aria-label": ariaLabel, ...props }, ref) => {
    const { size, path } = React.useMemo(() => buildQrMatrixPath(value), [value])

    return (
      <svg
        ref={ref}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={ariaLabel ?? "Código QR para compartir esta página"}
        shapeRendering="crispEdges"
        {...props}
      >
        <rect x={0} y={0} width={size} height={size} fill={QR_LIGHT} />
        <path d={path} fill={QR_DARK} />
      </svg>
    )
  }
)
ShareQr.displayName = "ShareQr"
