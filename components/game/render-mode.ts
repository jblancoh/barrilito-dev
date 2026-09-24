/**
 * Decides whether the landing renders the full three.js board or the
 * cheaper "lite" classic home. Kept three-free and DOM-free so the
 * precedence rules are unit-testable without a browser (see
 * render-mode.test.ts); `readRenderEnv`/`storeRenderMode` are the thin,
 * untested browser-only edges that feed/persist it.
 */

export type RenderMode = "full" | "lite"

export interface RenderEnv {
  /** From the `?mode=` query param, when present. */
  override?: string | null
  /** From the persisted user preference (localStorage), when present. */
  stored?: string | null
  webgl: boolean
  reducedMotion: boolean
  saveData?: boolean
  deviceMemory?: number
  hardwareConcurrency?: number
}

const STORAGE_KEY = "barrilito:render-mode"

function isRenderMode(value: string | null | undefined): value is RenderMode {
  return value === "full" || value === "lite"
}

function heuristicMode(env: RenderEnv): RenderMode {
  const lite =
    !env.webgl ||
    env.reducedMotion ||
    Boolean(env.saveData) ||
    (env.deviceMemory !== undefined && env.deviceMemory <= 2) ||
    (env.hardwareConcurrency !== undefined && env.hardwareConcurrency <= 2)
  return lite ? "lite" : "full"
}

/**
 * Precedence: a valid `?mode=` override wins, then a valid stored
 * preference, then the capability heuristic.
 */
export function detectRenderMode(env: RenderEnv): RenderMode {
  if (isRenderMode(env.override)) return env.override
  if (isRenderMode(env.stored)) return env.stored
  return heuristicMode(env)
}

interface NavigatorConnection {
  saveData?: boolean
}

interface NavigatorWithExtras extends Navigator {
  connection?: NavigatorConnection
  deviceMemory?: number
}

function probeWebgl(): boolean {
  if (typeof document === "undefined") return false
  try {
    const canvas = document.createElement("canvas")
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"))
  } catch {
    return false
  }
}

function readOverride(): string | null {
  if (typeof window === "undefined") return null
  try {
    return new URLSearchParams(window.location.search).get("mode")
  } catch {
    return null
  }
}

function readStored(): string | null {
  if (typeof window === "undefined") return null
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

/** Reads the live browser environment used to build a `RenderEnv` for `detectRenderMode`. */
export function readRenderEnv(): RenderEnv {
  const nav = typeof navigator === "undefined" ? undefined : (navigator as NavigatorWithExtras)
  const reducedMotion =
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false

  return {
    override: readOverride(),
    stored: readStored(),
    webgl: probeWebgl(),
    reducedMotion,
    saveData: nav?.connection?.saveData,
    deviceMemory: nav?.deviceMemory,
    hardwareConcurrency: nav?.hardwareConcurrency,
  }
}

/** Persists the user's explicit mode choice; a no-op when storage is unavailable. */
export function storeRenderMode(mode: RenderMode): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    // Storage may be disabled (private browsing, quota) — the mode simply won't persist.
  }
}
