import { describe, expect, it } from "vitest"
import { INITIAL_WHEEL_GATE, stepWheelGate, type WheelGateState } from "./wheel-gate"

describe("stepWheelGate", () => {
  it("never advances while a panel-scrolling gesture continues at the edge", () => {
    // The panel consumed the gesture's first events, then reached its edge (panelConsumed
    // flips to false) while the same trackpad momentum keeps firing every ~16ms.
    let state: WheelGateState = INITIAL_WHEEL_GATE
    let now = 1000
    for (const deltaY of [40, 60, 80]) {
      ;({ state } = stepWheelGate(state, { now, deltaY, panelConsumed: true, blocked: false }))
      now += 16
    }
    for (const deltaY of [80, 70, 60, 50, 40, 30]) {
      const result = stepWheelGate(state, { now, deltaY, panelConsumed: false, blocked: false })
      state = result.state
      expect(result.action).toBe("none")
      now += 16
    }
  })

  it("lets a fresh gesture advance after a quiet pause past 400ms", () => {
    let state: WheelGateState = INITIAL_WHEEL_GATE
    ;({ state } = stepWheelGate(state, { now: 1000, deltaY: 60, panelConsumed: true, blocked: false }))

    const result = stepWheelGate(state, { now: 1000 + 401, deltaY: 60, panelConsumed: false, blocked: false })
    expect(result.action).toBe("forward")
  })

  it("keeps blocking a quiet gap between 250ms and 400ms", () => {
    let state: WheelGateState = INITIAL_WHEEL_GATE
    ;({ state } = stepWheelGate(state, { now: 1000, deltaY: 60, panelConsumed: true, blocked: false }))

    const result = stepWheelGate(state, { now: 1000 + 300, deltaY: 60, panelConsumed: false, blocked: false })
    expect(result.action).toBe("none")
  })

  it("keeps the current threshold/reset behavior when the panel is never involved", () => {
    let state: WheelGateState = INITIAL_WHEEL_GATE
    let now = 2000

    // Below threshold: no action yet.
    let result = stepWheelGate(state, { now, deltaY: 20, panelConsumed: false, blocked: false })
    state = result.state
    expect(result.action).toBe("none")

    // Crosses the 40 threshold: forward, and acc resets.
    now += 16
    result = stepWheelGate(state, { now, deltaY: 25, panelConsumed: false, blocked: false })
    state = result.state
    expect(result.action).toBe("forward")
    expect(state.acc).toBe(0)

    // A gap over 250ms resets accumulation instead of carrying stale deltas.
    now += 300
    result = stepWheelGate(state, { now, deltaY: 20, panelConsumed: false, blocked: false })
    state = result.state
    expect(result.action).toBe("none")

    // Negative accumulation past -40 triggers back.
    now += 16
    result = stepWheelGate(state, { now, deltaY: -70, panelConsumed: false, blocked: false })
    expect(result.action).toBe("back")
    expect(result.state.acc).toBe(0)
  })

  it("resets accumulation when the board is blocked (busy or locked)", () => {
    let state: WheelGateState = INITIAL_WHEEL_GATE
    let now = 3000

    let result = stepWheelGate(state, { now, deltaY: 30, panelConsumed: false, blocked: false })
    state = result.state
    expect(state.acc).toBe(30)

    now += 16
    result = stepWheelGate(state, { now, deltaY: 30, panelConsumed: false, blocked: true })
    state = result.state
    expect(result.action).toBe("none")
    expect(state.acc).toBe(0)
  })

  it("is symmetric for back: a gesture that scrolled the panel up never rolls back", () => {
    let state: WheelGateState = INITIAL_WHEEL_GATE
    let now = 4000
    for (const deltaY of [-40, -60, -80]) {
      ;({ state } = stepWheelGate(state, { now, deltaY, panelConsumed: true, blocked: false }))
      now += 16
    }
    for (const deltaY of [-80, -70, -60, -50, -40, -30]) {
      const result = stepWheelGate(state, { now, deltaY, panelConsumed: false, blocked: false })
      state = result.state
      expect(result.action).toBe("none")
      now += 16
    }
  })
})
