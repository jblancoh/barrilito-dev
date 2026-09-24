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

export function onBoardGoTo(handler: (detail: BoardGoToDetail) => void): () => void {
  if (typeof window === "undefined") return () => {}
  const listener = (event: Event) => handler((event as CustomEvent<BoardGoToDetail>).detail)
  window.addEventListener(BOARD_GOTO_EVENT, listener)
  return () => window.removeEventListener(BOARD_GOTO_EVENT, listener)
}
