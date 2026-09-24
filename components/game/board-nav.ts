import type { StopKey } from "./board-config"

/** Navigation callbacks passed down to every section so their CTAs can move the token. */
export interface BoardNav {
  goTo: (stopKey: StopKey) => void
  shortcut: (kind: "ladder" | "snake", index: number) => void
}
