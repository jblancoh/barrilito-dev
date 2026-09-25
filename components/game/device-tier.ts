/**
 * Pure, three-free classification of "modest" full-mode devices: capable
 * enough to run the board (see render-mode.ts for the full/lite decision)
 * but cheap enough to want lighter rendering settings (no antialias,
 * smaller shadow maps — see use-board-scene.ts's init()).
 */

export interface DeviceTierEnv {
  hardwareConcurrency?: number
  viewportWidth: number
}

/** Matches the board's own narrow-layout breakpoint (use-board-scene.ts's `resize()`). */
const NARROW_VIEWPORT_PX = 900
const MODEST_CORE_COUNT = 4

export function isModestDevice(env: DeviceTierEnv): boolean {
  const fewCores = env.hardwareConcurrency !== undefined && env.hardwareConcurrency <= MODEST_CORE_COUNT
  const narrow = env.viewportWidth < NARROW_VIEWPORT_PX
  return fewCores || narrow
}
