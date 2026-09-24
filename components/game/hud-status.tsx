"use client"

import { Dices, Undo2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { STOPS } from "./board-config"
import { STOP_BG_CLASS, STOP_RING_CLASS } from "./stop-colors"

export interface HudStatusProps {
  sq: number
  statusText: string
  nextLabel: string
  canForward: boolean
  canBack: boolean
  showRail: boolean
  currentStopIndex: number
  onForward: () => void
  onBack: () => void
  onSelectStop: (stopIndex: number) => void
}

/** Top-left status card (dice + casilla counter + controls) and the stop rail below it. */
export function HudStatus({
  sq,
  statusText,
  nextLabel,
  canForward,
  canBack,
  showRail,
  currentStopIndex,
  onForward,
  onBack,
  onSelectStop,
}: HudStatusProps) {
  return (
    <div className="absolute left-4 top-20 z-20 flex w-[232px] flex-col gap-3">
      <div className="flex flex-col gap-3 rounded-xl border bg-card/90 p-3.5 shadow-[0_10px_30px_-12px_rgb(0_0_0/0.4)] backdrop-blur-[10px]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/[0.12]">
            <Dices className="h-[22px] w-[22px] text-primary" />
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="font-mono text-[11px] tracking-[0.08em] text-muted-foreground">
              CASILLA {String(sq).padStart(2, "0")} / 25
            </div>
            <div className="text-[15px] font-semibold">{statusText}</div>
          </div>
        </div>
        <div className="text-[13px] text-muted-foreground">{nextLabel}</div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onForward}
            disabled={!canForward}
            className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md bg-primary text-xs font-medium text-primary-foreground transition-opacity hover:bg-primary/90 disabled:opacity-40"
          >
            Tirar dado
          </button>
          <button
            type="button"
            onClick={onBack}
            disabled={!canBack}
            aria-label="Regresar"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-input bg-transparent transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-40"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="font-mono text-[11px] text-muted-foreground">Scroll ↓ tira · Scroll ↑ regresa</div>
      </div>

      {showRail && (
        <div className="flex flex-col gap-0.5 py-1">
          {STOPS.map((s, index) => {
            const visited = index <= currentStopIndex
            const isCurrent = index === currentStopIndex
            return (
              <button
                key={s.sq}
                type="button"
                onClick={() => onSelectStop(index)}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors hover:bg-muted/60",
                  isCurrent ? "font-semibold text-foreground" : "font-medium text-muted-foreground",
                )}
              >
                <span className="w-5 font-mono text-[11px] text-muted-foreground">
                  {String(s.sq).padStart(2, "0")}
                </span>
                <span
                  className={cn(
                    "h-2.5 w-2.5 shrink-0 rounded-full",
                    visited ? STOP_BG_CLASS[s.color] : "bg-muted",
                    isCurrent && "ring-[3px] ring-offset-0",
                    isCurrent && STOP_RING_CLASS[s.color],
                  )}
                />
                <span>{s.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
