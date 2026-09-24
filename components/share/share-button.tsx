"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { Share2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { buildShareUrl, getShareStrategy } from "@/lib/share"

// Loaded on first open, not on page load: this pulls in `qrcode` and Radix
// Dialog, which most visitors (the ones who get the native share sheet)
// never need.
const ShareDialog = dynamic(() => import("@/components/share/share-dialog").then((m) => m.ShareDialog), {
  ssr: false,
})

export interface ShareButtonProps {
  /** "icon": ghost icon button for the navbar's desktop action group. "menu-item": plain text link for the mobile menu. */
  variant?: "icon" | "menu-item"
  className?: string
  /** Called right when the share action starts, before native share or the dialog — lets the navbar close its mobile menu. */
  onBeforeShare?: () => void
}

/**
 * Shares the current page: the native OS share sheet on devices that
 * support it (phones/tablets), otherwise the QR/copy-link dialog. The same
 * click handler backs both the desktop icon button and the mobile menu
 * entry so the two surfaces can't drift apart.
 */
export function ShareButton({ variant = "icon", className, onBeforeShare }: ShareButtonProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [hasOpenedDialog, setHasOpenedDialog] = React.useState(false)
  const [shareUrl, setShareUrl] = React.useState("")

  const openDialog = (url: string) => {
    setShareUrl(url)
    setHasOpenedDialog(true)
    setDialogOpen(true)
  }

  const handleShare = async () => {
    onBeforeShare?.()

    const url = buildShareUrl(window.location.href)
    const strategy = getShareStrategy({
      hasNativeShare: typeof navigator.share === "function",
      isCoarsePointer: window.matchMedia("(pointer: coarse)").matches,
    })

    if (strategy === "native") {
      try {
        await navigator.share({ title: document.title, url })
        return
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return
        // Any other error (permission denied, no share target, …) falls
        // back to the dialog below instead of leaving the visitor stuck.
      }
    }

    openDialog(url)
  }

  return (
    <>
      {variant === "icon" ? (
        <Button variant="ghost" size="icon" aria-label="Compartir" title="Compartir" className={className} onClick={handleShare}>
          <Share2 className="h-[1.2rem] w-[1.2rem]" />
        </Button>
      ) : (
        <button
          type="button"
          onClick={handleShare}
          className={className ?? "text-left text-sm font-medium transition-colors hover:text-primary"}
        >
          Compartir
        </button>
      )}
      {hasOpenedDialog && <ShareDialog open={dialogOpen} onOpenChange={setDialogOpen} url={shareUrl} />}
    </>
  )
}
