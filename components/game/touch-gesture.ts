/** Minimum horizontal travel (px) before a touch gesture moves the board. */
export const SWIPE_MIN_DISTANCE = 60
/** Horizontal travel must exceed vertical travel by this factor, so scrolling never rolls. */
export const SWIPE_DOMINANCE = 1.5
/** Gestures starting this close to a side edge belong to the OS back/forward gesture. */
export const SWIPE_EDGE_GUARD = 24

export interface SwipeInput {
  startX: number
  startY: number
  endX: number
  endY: number
  viewportWidth: number
}

export type SwipeAction = "forward" | "back"

/**
 * Maps a finished touch gesture to a board move. Only a clearly horizontal swipe counts
 * (left rolls the die, right goes back); vertical gestures stay free for scrolling.
 */
export function classifySwipe({ startX, startY, endX, endY, viewportWidth }: SwipeInput): SwipeAction | null {
  if (startX < SWIPE_EDGE_GUARD || startX > viewportWidth - SWIPE_EDGE_GUARD) return null
  const dx = endX - startX
  const dy = endY - startY
  if (Math.abs(dx) < SWIPE_MIN_DISTANCE) return null
  if (Math.abs(dx) < SWIPE_DOMINANCE * Math.abs(dy)) return null
  return dx < 0 ? "forward" : "back"
}
