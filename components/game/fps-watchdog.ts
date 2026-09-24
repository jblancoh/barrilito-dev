/**
 * Pure FPS watchdog, deliberately three-free and DOM-free: given the frame
 * durations (ms) sampled during a window after the board becomes ready, it
 * decides whether the device is sustaining too low a frame rate to keep
 * running the three.js scene. use-board-scene.ts owns collecting the
 * samples from its render loop; this module only judges them.
 */

export interface ShouldDegradeOptions {
  /** Minimum acceptable average FPS over the sampled window. */
  minFps?: number
  /** Minimum number of samples required before a verdict is given. */
  minSamples?: number
}

export function shouldDegrade(frameTimesMs: readonly number[], options: ShouldDegradeOptions = {}): boolean {
  const { minFps = 24, minSamples = 30 } = options
  if (frameTimesMs.length < minSamples) return false
  const totalMs = frameTimesMs.reduce((sum, t) => sum + t, 0)
  if (totalMs <= 0) return false
  const avgFps = (1000 * frameTimesMs.length) / totalMs
  return avgFps < minFps
}
