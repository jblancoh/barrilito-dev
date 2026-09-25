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
export const PANEL_SETTLE_MS = 200

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
    return { state: { acc: 0, lastWheel, tainted: true }, action: "none" }
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

/** DOM-facing effects `dispatchWheel` needs, kept separate from the pure gate so the wiring is testable without a DOM. */
export interface WheelDispatchDeps {
  /** Whether this event scrolled the section panel instead of reaching the board. */
  panelScrolls: boolean
  preventDefault(): void
  /** Whether the board itself can't move right now (mid-animation, confetti, etc). */
  isBusy(): boolean
  /** `performance.now()` timestamp before which the board stays locked from the last move. */
  lockUntil(): number
  forward(): void
  back(): void
}

/**
 * Wires a raw wheel event into the pure gate and its side effects: whether to call
 * `preventDefault`, whether the board is currently blocked, and which action (if any)
 * to dispatch. Mirrors the board's `onWheel` handler exactly, minus the DOM.
 */
export function dispatchWheel(
  gate: WheelGateState,
  event: { now: number; deltaY: number },
  deps: WheelDispatchDeps,
): WheelGateState {
  const { now, deltaY } = event

  if (deps.panelScrolls) {
    return stepWheelGate(gate, { now, deltaY, panelConsumed: true, blocked: false }).state
  }

  deps.preventDefault()
  const blocked = deps.isBusy() || now < deps.lockUntil()
  const result = stepWheelGate(gate, { now, deltaY, panelConsumed: false, blocked })
  if (result.action === "forward") deps.forward()
  else if (result.action === "back") deps.back()
  return result.state
}
