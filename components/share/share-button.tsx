"use client"

import { Share2 } from "lucide-react"

import { Button } from "@/components/ui/button"

export interface ShareButtonProps {
  /** "icon": ghost icon button for the navbar's desktop action group. "menu-item": plain text link for the mobile menu. */
  variant?: "icon" | "menu-item"
  className?: string
  /** Called on click — the actual share logic lives in `useShare()`, so this component stays a stateless trigger. */
  onShare: () => void
}

/**
 * Thin, stateless trigger for the share flow: both the desktop icon button
 * and the mobile menu entry call the same `onShare` (from `useShare()`), so
 * the two surfaces can't drift apart.
 */
export function ShareButton({ variant = "icon", className, onShare }: ShareButtonProps) {
  if (variant === "icon") {
    return (
      <Button variant="ghost" size="icon" aria-label="Compartir" title="Compartir" className={className} onClick={onShare}>
        <Share2 className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    )
  }

  return (
    <button
      type="button"
      onClick={onShare}
      className={className ?? "text-left text-sm font-medium transition-colors hover:text-primary"}
    >
      Compartir
    </button>
  )
}
