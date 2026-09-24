"use client"

import * as React from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShareQr } from "@/components/share/share-qr"
import { shareFileName } from "@/lib/share"

export interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The shareable URL to display, encode and copy. */
  url: string
}

type CopyFeedback = "idle" | "copied" | "manual"

/** How long the copy-link feedback message stays visible. */
const COPY_FEEDBACK_MS = 2000

/** Square canvas/export size for the downloaded PNG, in pixels. */
const PNG_EXPORT_SIZE = 1024

/** Triggers a browser download of `blob` as `fileName`, cleaning up its object URL. */
function downloadBlob(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = objectUrl
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(objectUrl)
}

/**
 * Dialog shown on desktop (and anywhere `navigator.share` isn't available or
 * the pointer isn't coarse — see `getShareStrategy`): a QR code of the
 * current URL, a copy-link input, and PNG/SVG downloads of the QR. Loaded
 * with `next/dynamic({ ssr: false })` by `<ShareButton>` so `qrcode` and
 * Radix Dialog are only fetched once the visitor actually opens it.
 */
export function ShareDialog({ open, onOpenChange, url }: ShareDialogProps) {
  const svgRef = React.useRef<SVGSVGElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [copyFeedback, setCopyFeedback] = React.useState<CopyFeedback>("idle")
  const feedbackTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    return () => {
      if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current)
    }
  }, [])

  const showFeedback = (feedback: CopyFeedback) => {
    setCopyFeedback(feedback)
    if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current)
    feedbackTimeout.current = setTimeout(() => setCopyFeedback("idle"), COPY_FEEDBACK_MS)
  }

  const handleCopy = async () => {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard API unavailable")
      await navigator.clipboard.writeText(url)
      showFeedback("copied")
    } catch {
      inputRef.current?.select()
      showFeedback("manual")
    }
  }

  /** Serializes the rendered QR `<svg>` into a standalone, namespaced markup string. */
  const serializeQrSvg = (): string | null => {
    const svg = svgRef.current
    if (!svg) return null
    const clone = svg.cloneNode(true) as SVGSVGElement
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg")
    return new XMLSerializer().serializeToString(clone)
  }

  const handleDownloadSvg = () => {
    const markup = serializeQrSvg()
    if (!markup) return
    downloadBlob(new Blob([markup], { type: "image/svg+xml" }), `${shareFileName(url)}.svg`)
  }

  const handleDownloadPng = () => {
    const markup = serializeQrSvg()
    if (!markup) return

    const svgObjectUrl = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml" }))
    const image = new window.Image()
    image.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = PNG_EXPORT_SIZE
      canvas.height = PNG_EXPORT_SIZE
      const context = canvas.getContext("2d")
      if (context) {
        context.drawImage(image, 0, 0, PNG_EXPORT_SIZE, PNG_EXPORT_SIZE)
        canvas.toBlob((blob) => {
          if (blob) downloadBlob(blob, `${shareFileName(url)}.png`)
        }, "image/png")
      }
      URL.revokeObjectURL(svgObjectUrl)
    }
    image.onerror = () => URL.revokeObjectURL(svgObjectUrl)
    image.src = svgObjectUrl
  }

  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function"

  const handleMoreOptions = async () => {
    try {
      await navigator.share({ title: document.title, url })
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-sm sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartir esta página</DialogTitle>
          <DialogDescription>Escanea el código o copia el enlace para compartir esta vista.</DialogDescription>
        </DialogHeader>

        <div className="flex justify-center">
          <div className="rounded-lg bg-white p-3">
            <ShareQr ref={svgRef} value={url} className="h-52 w-52" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Input ref={inputRef} readOnly value={url} aria-label="Enlace para compartir" />
          <Button type="button" onClick={handleCopy} className="shrink-0">
            Copiar enlace
          </Button>
        </div>
        <p aria-live="polite" className="min-h-5 text-sm text-muted-foreground">
          {copyFeedback === "copied" && "¡Enlace copiado!"}
          {copyFeedback === "manual" && "Copia el enlace manualmente"}
        </p>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={handleDownloadPng}>
            Descargar PNG
          </Button>
          <Button type="button" variant="outline" onClick={handleDownloadSvg}>
            Descargar SVG
          </Button>
          {canNativeShare && (
            <Button type="button" variant="ghost" onClick={handleMoreOptions}>
              Más opciones
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
