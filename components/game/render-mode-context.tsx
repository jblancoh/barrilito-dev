"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { detectRenderMode, readRenderEnv, storeRenderMode, type RenderMode } from "./render-mode"

interface RenderModeContextValue {
  mode: RenderMode
  /** Sets an explicit user choice (the manual toggle) and persists it. */
  setMode: (mode: RenderMode) => void
  /** Sets an automatic runtime decision (startup detection, a board fallback) — never persisted. */
  setAutoMode: (mode: RenderMode) => void
}

const RenderModeContext = createContext<RenderModeContextValue | null>(null)

/**
 * Shares the render mode between HomeSwitch (which mounts the board or the
 * classic home) and the Navbar toggle, which are siblings under
 * app/layout.tsx with no other common client state. Starts as "lite" so
 * the server render and first client paint match (see HomeSwitch), then
 * `useEffect` runs the real detection once mounted.
 */
export function RenderModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<RenderMode>("lite")

  useEffect(() => {
    setModeState(detectRenderMode(readRenderEnv()))
  }, [])

  const setMode = useCallback((next: RenderMode) => {
    setModeState(next)
    storeRenderMode(next)
  }, [])

  const setAutoMode = useCallback((next: RenderMode) => {
    setModeState(next)
  }, [])

  const value = useMemo<RenderModeContextValue>(() => ({ mode, setMode, setAutoMode }), [mode, setMode, setAutoMode])

  return <RenderModeContext.Provider value={value}>{children}</RenderModeContext.Provider>
}

export function useRenderMode(): RenderModeContextValue {
  const ctx = useContext(RenderModeContext)
  if (!ctx) throw new Error("useRenderMode must be used within a RenderModeProvider")
  return ctx
}
