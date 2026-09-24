"use client"

import { cn } from "@/lib/utils"

export type ShortcutTone = "secondary" | "chart5" | "destructive"

const TONE_CLASSES: Record<ShortcutTone, { border: string; bg: string; hoverBg: string; text: string }> = {
  secondary: {
    border: "border-secondary",
    bg: "bg-secondary/10",
    hoverBg: "hover:bg-secondary/20",
    text: "text-secondary",
  },
  chart5: {
    border: "border-chart5",
    bg: "bg-chart5/10",
    hoverBg: "hover:bg-chart5/20",
    text: "text-chart5",
  },
  destructive: {
    border: "border-destructive",
    bg: "bg-destructive/10",
    hoverBg: "hover:bg-destructive/20",
    text: "text-destructive",
  },
}

export interface ShortcutCardProps {
  /** e.g. "02 ▲ 22" or "24 ▼ 12" */
  code: string
  title: string
  subtitle: string
  tone: ShortcutTone
  onClick: () => void
}

/** Ladder ("▲") or snake ("▼") call-to-action card shown at the bottom of a section panel. */
export function ShortcutCard({ code, title, subtitle, tone, onClick }: ShortcutCardProps) {
  const t = TONE_CLASSES[tone]
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3.5 rounded-xl border border-dashed p-3.5 text-left transition-colors",
        t.border,
        t.bg,
        t.hoverBg,
      )}
    >
      <span className={cn("whitespace-nowrap font-mono text-sm font-semibold", t.text)}>{code}</span>
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <span className="text-sm text-muted-foreground">{subtitle}</span>
      </span>
    </button>
  )
}
