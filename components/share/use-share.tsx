"use client"

import * as React from "react"
import dynamic from "next/dynamic"

import { buildShareUrl, getShareStrategy } from "@/lib/share"

// Loaded on first open, not on page load: this pulls in `qrcode` and Radix
// Dialog, which most visitors (the ones who get the native share sheet)
// never need.
const ShareDialog = dynamic(() => import("@/components/share/share-dialog").then((m) => m.ShareDialog), {
  ssr: false,
})

export interface UseShareResult {
  /** Shares the current page: the native OS share sheet where available, the QR/copy-link dialog otherwise. */
  share: () => void
  /**
   * The (lazily mounted) share dialog element. Render it once, above
   * anything that might unmount while the share flow is in progress — in
   * particular the navbar's collapsible mobile menu, which closes right
   * when a "Compartir" tap would open this dialog.
   */
  dialog: React.ReactNode
}

/**
 * Owns the share dialog's open state, independent of whatever UI triggered
 * it. `<ShareButton>` stays a thin, stateless trigger; callers that render
 * it inside something transient (a mobile menu that closes on click) still
 * get a dialog that survives the click.
 */
export function useShare(): UseShareResult {
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [hasOpenedDialog, setHasOpenedDialog] = React.useState(false)
  const [shareUrl, setShareUrl] = React.useState("")
  // Radix only restores focus to a <DialogTrigger>; this dialog is opened
  // programmatically, so remember the element that started the share.
  const returnFocusRef = React.useRef<HTMLElement | null>(null)

  const share = React.useCallback(async () => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
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

    setShareUrl(url)
    setHasOpenedDialog(true)
    setDialogOpen(true)
  }, [])

  const restoreFocus = React.useCallback((event: Event) => {
    const target = returnFocusRef.current
    // The mobile menu entry is gone by now (the menu closed); fall back to Radix's default then.
    if (!target?.isConnected) return
    event.preventDefault()
    target.focus()
  }, [])

  const dialog = hasOpenedDialog ? (
    <ShareDialog open={dialogOpen} onOpenChange={setDialogOpen} url={shareUrl} onCloseAutoFocus={restoreFocus} />
  ) : null

  return { share, dialog }
}
