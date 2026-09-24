/**
 * Pure helpers for the share feature: turning the current URL into a
 * shareable link, deciding how to offer sharing, and matching a `#hash`
 * against a real board stop. No DOM access here on purpose, so this module
 * stays unit-testable in isolation (see share.test.ts); the browser-only
 * edges (reading `window.location`, `navigator.share`, pointer media
 * queries) live in the components that call into this module.
 */

import { STOPS, type StopKey } from "../components/game/board-config"

const STOP_KEYS: ReadonlySet<string> = new Set(STOPS.map((s) => s.key))

/**
 * Parses a URL hash (with or without the leading `#`) into a known
 * `StopKey`, or `null` when it's empty, `"#"`, or doesn't match any real
 * stop. The match is case-sensitive against the stop keys in board-config.
 */
export function parseStopHash(hash: string): StopKey | null {
  const trimmed = hash.trim()
  const key = trimmed.startsWith("#") ? trimmed.slice(1) : trimmed
  return STOP_KEYS.has(key) ? (key as StopKey) : null
}

/**
 * Builds the absolute URL to share for the current page: keeps the origin,
 * pathname and hash, but removes the `mode` query param. The lite/full
 * render override is a per-viewer preference (see render-mode.ts) and must
 * not propagate to whoever opens the shared link — they get the normal
 * capability-based detection instead.
 */
export function buildShareUrl(href: string): string {
  const url = new URL(href)
  url.searchParams.delete("mode")
  return url.toString()
}

/**
 * Builds the pathname + search + hash to write into the address bar when
 * the board (or the classic home's navbar) moves to a different stop.
 * Keeps everything about the current URL except the hash, which becomes
 * `#<stopKey>`. Callers pass this to `history.replaceState` — never
 * `pushState` — so moving through stops doesn't spam browser history.
 */
export function withStopHash(href: string, stopKey: StopKey): string {
  const url = new URL(href)
  return `${url.pathname}${url.search}#${stopKey}`
}

export interface ShareEnv {
  /** Whether `navigator.share` exists in this browser. */
  hasNativeShare: boolean
  /** Whether the primary pointer is coarse (touch), from a `(pointer: coarse)` media query. */
  isCoarsePointer: boolean
}

export type ShareStrategy = "native" | "dialog"

/**
 * Decides how the share button should behave. Native share only kicks in
 * when the browser supports it AND the primary input is a coarse pointer
 * (phones/tablets): those devices go straight to the OS share sheet, which
 * already lets the user pick "AirDrop", "Messages", another app, etc.
 * Everything else (desktop, or a touch-capable laptop without a share
 * sheet) gets the dialog with the QR code instead — that dialog exists
 * specifically so a desktop visitor can move the link to their phone by
 * scanning it, which a native share sheet on desktop wouldn't help with.
 */
export function getShareStrategy(env: ShareEnv): ShareStrategy {
  return env.hasNativeShare && env.isCoarsePointer ? "native" : "dialog"
}
