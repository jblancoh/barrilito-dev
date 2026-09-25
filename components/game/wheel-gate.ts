/**
 * Pure decision logic for the board's wheel handler, unit-tested without a DOM.
 *
 * A wheel "gesture" is a run of events with no gap longer than
 * `WHEEL_GESTURE_GAP_MS` between them (trackpad momentum fires many small
 * events in quick succession). If a gesture ever scrolled the section panel
 * (`panelConsumed`), it is marked `tainted`: the rest of that same gesture —
 * including the momentum tail that lands after the panel hits its edge —
 * can no longer move the board. Only a fresh gesture, one that starts after
 * a quiet pause of `PANEL_SETTLE_MS`, is allowed to accumulate toward the
 * threshold again. This is what lets a visitor finish reading a section
 * instead of the same scroll that closed in on the panel's edge rolling the
 * die.
 */

export const WHEEL_GESTURE_GAP_MS = 250
export const WHEEL_THRESHOLD = 40
export const PANEL_SETTLE_MS = 400

export interface WheelGateState {
  /** Accumulated deltaY for the current gesture. */
  acc: number
  /** `performance.now()` timestamp of the last processed wheel event. */
  lastWheel: number
  /** Whether the current gesture touched the panel and so can't move the board. */
  tainted: boolean
}

/** `lastWheel` starts at `-Infinity` so the very first event is treated as following a long pause. */
export const INITIAL_WHEEL_GATE: WheelGateState = { acc: 0, lastWheel: -Infinity, tainted: false }

export interface WheelGateInput {
  /** `performance.now()` at the time of this wheel event. */
  now: number
  deltaY: number
  /** Whether this event scrolled the section panel instead of reaching the board. */
  panelConsumed: boolean
  /** Whether the board itself can't move right now (busy, or still locked from the last move). */
  blocked: boolean
}

export interface WheelGateResult {
  state: WheelGateState
  action: "none" | "forward" | "back"
}

export function stepWheelGate(state: WheelGateState, input: WheelGateInput): WheelGateResult {
  const { now, deltaY, panelConsumed, blocked } = input
  const gap = now - state.lastWheel

  let acc = gap > WHEEL_GESTURE_GAP_MS ? 0 : state.acc
  const tainted = gap > PANEL_SETTLE_MS ? false : state.tainted
  const lastWheel = now

  if (panelConsumed) {
    return { state: { acc, lastWheel, tainted: true }, action: "none" }
  }
  if (blocked) {
    return { state: { acc: 0, lastWheel, tainted }, action: "none" }
  }
  if (tainted) {
    return { state: { acc, lastWheel, tainted }, action: "none" }
  }

  acc += deltaY
  if (acc > WHEEL_THRESHOLD) {
    return { state: { acc: 0, lastWheel, tainted }, action: "forward" }
  }
  if (acc < -WHEEL_THRESHOLD) {
    return { state: { acc: 0, lastWheel, tainted }, action: "back" }
  }
  return { state: { acc, lastWheel, tainted }, action: "none" }
}
