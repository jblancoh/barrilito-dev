import { withStopHash } from "../../lib/share"
import type { StopKey } from "./board-config"

/**
 * A tiny typed event bus so the Navbar (rendered in app/layout.tsx, a sibling
 * of the board) can ask the board to goTo a stop without both components
 * needing to share a common React tree above the board itself.
 */

const BOARD_GOTO_EVENT = "boardgame:goto"

export interface BoardGoToDetail {
  stopKey: StopKey
}

export function dispatchBoardGoTo(stopKey: StopKey): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent<BoardGoToDetail>(BOARD_GOTO_EVENT, { detail: { stopKey } }))
}

// Tracks whether the board is currently mounted and listening, so
// navigateToStop knows whether to hand off to it or scroll the classic
// home itself. Only the board (board-game.tsx) ever calls onBoardGoTo.
let boardListenerCount = 0

function hasBoardListener(): boolean {
  return boardListenerCount > 0
}

export function onBoardGoTo(handler: (detail: BoardGoToDetail) => void): () => void {
  if (typeof window === "undefined") return () => {}
  const listener = (event: Event) => handler((event as CustomEvent<BoardGoToDetail>).detail)
  window.addEventListener(BOARD_GOTO_EVENT, listener)
  boardListenerCount++
  let unsubscribed = false
  return () => {
    if (unsubscribed) return
    unsubscribed = true
    boardListenerCount--
    window.removeEventListener(BOARD_GOTO_EVENT, listener)
  }
}

export type NavigationAction =
  | { kind: "dispatch"; stopKey: StopKey }
  | { kind: "scroll"; stopKey: StopKey; behavior: ScrollBehavior }

/**
 * Pure routing decision, unit-tested without a DOM: hand off to the board
 * when it's listening, otherwise scroll the classic home's own section
 * into view (smoothly, unless the user prefers reduced motion).
 */
export function decideNavigation(
  stopKey: StopKey,
  hasListener: boolean,
  reducedMotion: boolean,
): NavigationAction {
  if (hasListener) return { kind: "dispatch", stopKey }
  return { kind: "scroll", stopKey, behavior: reducedMotion ? "auto" : "smooth" }
}

/** Exported so other DOM edges (e.g. the classic home's initial-scroll effect) apply the same rule. */
export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false
}

/** Tag names that should keep wheel/keyboard/touch input away from the board (native form controls). */
const FORM_CONTROL_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"])

export interface ShouldIgnoreBoardInputInput {
  /** Tag name of the event target, e.g. "INPUT" — `null` when there's no element target. */
  targetTag: string | null
  /** Whether the target is (or is inside) a `contenteditable` element. */
  targetIsContentEditable: boolean
  /** Whether the event target sits inside a modal dialog (e.g. `target.closest('[role="dialog"]')`). */
  targetInDialog: boolean
  /** Whether any modal dialog is currently open in the document, regardless of the event target. */
  modalOpen: boolean
}

/**
 * Decides whether the board's wheel/keyboard/touch handlers should ignore
 * an event entirely — no move, no `preventDefault()` — because a modal
 * dialog (e.g. the share dialog) is open, the event targets that dialog, or
 * the target is a form control the visitor is typing into. The board and a
 * dialog above it must never react to the same input at once.
 */
export function shouldIgnoreBoardInput(input: ShouldIgnoreBoardInputInput): boolean {
  if (input.modalOpen || input.targetInDialog) return true
  if (input.targetIsContentEditable) return true
  return input.targetTag !== null && FORM_CONTROL_TAGS.has(input.targetTag)
}

/**
 * Single entry point for "go to this stop" clicks (navbar, and any other
 * chrome outside the board/classic-home tree): dispatches to the board
 * when it's mounted and listening, otherwise scrolls the classic home's
 * matching `<section id={stopKey}>` into view.
 */
export function navigateToStop(stopKey: StopKey): void {
  const action = decideNavigation(stopKey, hasBoardListener(), prefersReducedMotion())
  if (action.kind === "dispatch") {
    dispatchBoardGoTo(action.stopKey)
    return
  }
  if (typeof window !== "undefined") {
    window.history.replaceState(window.history.state, "", withStopHash(window.location.href, action.stopKey))
  }
  if (typeof document === "undefined") return
  document.getElementById(action.stopKey)?.scrollIntoView({ behavior: action.behavior, block: "start" })
}
