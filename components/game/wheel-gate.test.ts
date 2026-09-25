import { describe, expect, it, vi } from "vitest"
import { dispatchWheel, INITIAL_WHEEL_GATE, PANEL_SETTLE_MS, stepWheelGate, type WheelDispatchDeps, type WheelGateState } from "./wheel-gate"

function makeDeps(overrides: Partial<WheelDispatchDeps> = {}): WheelDispatchDeps {
  return {
    panelScrolls: false,
    preventDefault: vi.fn(),
    isBusy: vi.fn(() => false),
    lockUntil: vi.fn(() => 0),
    forward: vi.fn(),
    back: vi.fn(),
    ...overrides,
  }
}

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

  it("stays tainted at the exact PANEL_SETTLE_MS boundary (strict greater-than)", () => {
    let state: WheelGateState = INITIAL_WHEEL_GATE
    ;({ state } = stepWheelGate(state, { now: 1000, deltaY: 60, panelConsumed: true, blocked: false }))

    const atBoundary = stepWheelGate(state, {
      now: 1000 + PANEL_SETTLE_MS,
      deltaY: 60,
      panelConsumed: false,
      blocked: false,
    })
    expect(atBoundary.action).toBe("none")
    expect(atBoundary.state.tainted).toBe(true)
  })

  it("clears the taint one millisecond past PANEL_SETTLE_MS", () => {
    let state: WheelGateState = INITIAL_WHEEL_GATE
    ;({ state } = stepWheelGate(state, { now: 1000, deltaY: 60, panelConsumed: true, blocked: false }))

    const pastBoundary = stepWheelGate(state, {
      now: 1000 + PANEL_SETTLE_MS + 1,
      deltaY: 60,
      panelConsumed: false,
      blocked: false,
    })
    expect(pastBoundary.action).toBe("forward")
    expect(pastBoundary.state.tainted).toBe(false)
  })
})

describe("dispatchWheel", () => {
  it("skips preventDefault when the panel consumes the event, and still taints the gate", () => {
    const deps = makeDeps({ panelScrolls: true })
    const state = dispatchWheel(INITIAL_WHEEL_GATE, { now: 1000, deltaY: 60 }, deps)

    expect(deps.preventDefault).not.toHaveBeenCalled()
    expect(state.tainted).toBe(true)
    expect(deps.forward).not.toHaveBeenCalled()
    expect(deps.back).not.toHaveBeenCalled()
  })

  it("calls preventDefault and blocks when the board reports busy", () => {
    const deps = makeDeps({ isBusy: vi.fn(() => true) })
    const state = dispatchWheel({ acc: 30, lastWheel: 990, tainted: false }, { now: 1000, deltaY: 30 }, deps)

    expect(deps.preventDefault).toHaveBeenCalledTimes(1)
    expect(state.acc).toBe(0)
    expect(deps.forward).not.toHaveBeenCalled()
    expect(deps.back).not.toHaveBeenCalled()
  })

  it("blocks when now is still before the lock-until timestamp", () => {
    const deps = makeDeps({ lockUntil: vi.fn(() => 2000) })
    const state = dispatchWheel({ acc: 30, lastWheel: 990, tainted: false }, { now: 1000, deltaY: 30 }, deps)

    expect(deps.preventDefault).toHaveBeenCalledTimes(1)
    expect(state.acc).toBe(0)
    expect(deps.forward).not.toHaveBeenCalled()
  })

  it("dispatches forward once the accumulated deltaY crosses the threshold", () => {
    const deps = makeDeps()
    dispatchWheel({ acc: 30, lastWheel: 990, tainted: false }, { now: 1000, deltaY: 20 }, deps)

    expect(deps.forward).toHaveBeenCalledTimes(1)
    expect(deps.back).not.toHaveBeenCalled()
  })

  it("dispatches back once the accumulated deltaY crosses the negative threshold", () => {
    const deps = makeDeps()
    dispatchWheel({ acc: -30, lastWheel: 990, tainted: false }, { now: 1000, deltaY: -20 }, deps)

    expect(deps.back).toHaveBeenCalledTimes(1)
    expect(deps.forward).not.toHaveBeenCalled()
  })

  it("keeps the taint and advances lastWheel when a blocked event lands inside a tainted gesture", () => {
    const taintDeps = makeDeps({ panelScrolls: true })
    let state = dispatchWheel(INITIAL_WHEEL_GATE, { now: 1000, deltaY: 60 }, taintDeps)
    expect(state.tainted).toBe(true)

    const blockedDeps = makeDeps({ isBusy: vi.fn(() => true) })
    state = dispatchWheel(state, { now: 1050, deltaY: 60 }, blockedDeps)

    expect(state.tainted).toBe(true)
    expect(state.lastWheel).toBe(1050)

    // The taint window now extends from this later lastWheel: a pause measured from 1000
    // (over PANEL_SETTLE_MS) would have cleared it, but measuring from the advanced 1050
    // still finds it tainted just past the same wall-clock point.
    const stillWithinWindow = dispatchWheel(state, { now: 1050 + PANEL_SETTLE_MS, deltaY: 60 }, makeDeps())
    expect(stillWithinWindow.tainted).toBe(true)
  })
})
