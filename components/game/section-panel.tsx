"use client"

import { forwardRef, type CSSProperties, type ReactNode } from "react"
import type { CameraMode } from "./use-board-scene"
import type { Stop } from "./board-config"
import { STOP_BG_CLASS } from "./stop-colors"

export interface SectionPanelProps {
  stop: Stop
  top: string
  width: string
  hidden: boolean
  camera: CameraMode
  children: ReactNode
}

/**
 * Right overlay panel that switches on the active stop. Hidden (but still
 * mounted, so scroll position and focus survive) while the token is moving.
 */
export const SectionPanel = forwardRef<HTMLDivElement, SectionPanelProps>(function SectionPanel(
  { stop, top, width, hidden, camera, children },
  ref,
) {
  const transform = hidden
    ? camera === "B"
      ? "perspective(1400px) rotateY(-75deg) translateX(40px)"
      : "translateX(32px)"
    : camera === "B"
      ? "perspective(1400px) rotateY(0deg)"
      : "translateX(0)"

  const style: CSSProperties = {
    top,
    width,
    opacity: hidden ? 0 : 1,
    transform,
    transformOrigin: "right center",
    pointerEvents: hidden ? "none" : "auto",
    transition: "opacity .35s ease, transform .55s cubic-bezier(.2,.8,.2,1)",
  }

  return (
    <div
      ref={ref}
      style={style}
      className="absolute bottom-4 right-4 z-20 overflow-y-auto rounded-xl border bg-background/90 p-7 shadow-[0_20px_50px_-12px_rgb(0_0_0/0.45)] backdrop-blur-md"
    >
      <div className="mb-5 flex items-center gap-2 font-mono text-xs tracking-[0.08em] text-muted-foreground">
        <span className={`h-2.5 w-2.5 rounded-sm ${STOP_BG_CLASS[stop.color]}`} />
        <span>
          CASILLA {String(stop.sq).padStart(2, "0")} · {stop.label.toUpperCase()}
        </span>
      </div>
      {children}
    </div>
  )
})
