"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useTheme } from "next-themes"
import { parseStopHash, shouldSyncStopHash, withStopHash } from "@/lib/share"
import { STOPS, type StopKey } from "./board-config"
import { onBoardGoTo } from "./board-events"
import type { BoardNav } from "./board-nav"
import { HudStatus } from "./hud-status"
import { SectionPanel } from "./section-panel"
import { renderSection } from "./section-registry"
import { useBoardScene } from "./use-board-scene"

/** STOPS index matching `location.hash` at mount time, or 0 (the default stop) when absent/invalid. */
function initialStopIndexFromHash(): number {
  if (typeof window === "undefined") return 0
  const stopKey = parseStopHash(window.location.hash)
  if (!stopKey) return 0
  const index = STOPS.findIndex((s) => s.key === stopKey)
  return index >= 0 ? index : 0
}

const CAMERA = "B" as const

function panelCanScroll(panel: HTMLDivElement | null, target: EventTarget | null, deltaY: number): boolean {
  if (!panel || !(target instanceof Node) || !panel.contains(target)) return false
  if (panel.scrollHeight <= panel.clientHeight + 2) return false
  return deltaY > 0 ? panel.scrollTop + panel.clientHeight < panel.scrollHeight - 2 : panel.scrollTop > 0
}

export interface BoardGameProps {
  /**
   * Invoked at most once when the board can't run (renderer/init failure,
   * a lost WebGL context, sustained low FPS, or never reaching ready
   * within the startup timeout — see use-board-scene.ts). HomeSwitch uses
   * it to fall back to the classic home.
   */
  onFallback?: (reason: string) => void
}

export function BoardGame({ onFallback }: BoardGameProps = {}) {
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme !== "light"

  const onFallbackRef = useRef(onFallback)
  onFallbackRef.current = onFallback

  const hostRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Read once at mount: a deep-linked hash (e.g. "/#projects") places the board directly
  // on that stop, with no animated walk and no dice roll (see use-board-scene.ts).
  const [initialStopIndex] = useState(initialStopIndexFromHash)

  const { api, state, layout } = useBoardScene(hostRef, {
    dark,
    camera: CAMERA,
    speed: 1,
    confetti: true,
    initialStopIndex,
    onFallback: (reason: string) => onFallbackRef.current?.(reason),
    onArrive: () => {
      if (panelRef.current) panelRef.current.scrollTop = 0
    },
  })

  const nav = useMemo<BoardNav>(
    () => ({
      goTo: (stopKey: StopKey) => {
        const index = STOPS.findIndex((s) => s.key === stopKey)
        if (index >= 0) api.goTo(index)
      },
      shortcut: (kind, index) => api.shortcut(kind, index),
    }),
    [api],
  )

  // Navbar (rendered above the board in app/layout.tsx) asks us to goTo a stop.
  useEffect(() => onBoardGoTo(({ stopKey }) => nav.goTo(stopKey)), [nav])

  // Keep the address bar's hash in sync with the current stop, via replaceState (never
  // pushState, so moving through the board doesn't spam history). Mounting on the initial
  // stop of a hash-less URL leaves the address bar untouched (see shouldSyncStopHash).
  useEffect(() => {
    const stopKey = STOPS[state.stop]?.key
    if (!stopKey) return
    const onInitialStop = state.stop === initialStopIndex
    if (!shouldSyncStopHash({ currentHash: window.location.hash, stopKey, onInitialStop })) return
    window.history.replaceState(window.history.state, "", withStopHash(window.location.href, stopKey))
  }, [state.stop, initialStopIndex])

  // The user edited or pasted a new hash (e.g. "#projects"): move the board there.
  useEffect(() => {
    const onHashChange = () => {
      const stopKey = parseStopHash(window.location.hash)
      if (stopKey) nav.goTo(stopKey)
    }
    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [nav])

  // Wheel / keyboard / touch input, mirroring the design reference exactly.
  useEffect(() => {
    let acc = 0
    let lastWheel = 0

    const onWheel = (e: WheelEvent) => {
      if (panelCanScroll(panelRef.current, e.target, e.deltaY)) return
      e.preventDefault()
      const now = performance.now()
      if (api.isBusy() || now < api.getLockUntil()) {
        acc = 0
        return
      }
      if (now - lastWheel > 250) acc = 0
      lastWheel = now
      acc += e.deltaY
      if (acc > 40) {
        acc = 0
        api.forward()
      } else if (acc < -40) {
        acc = 0
        api.back()
      }
    }

    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA") return
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault()
        api.forward()
      }
      if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault()
        api.back()
      }
    }

    let touchStartY = 0
    let touchStartTarget: EventTarget | null = null
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY
      touchStartTarget = e.target
    }
    const onTouchEnd = (e: TouchEvent) => {
      const dy = touchStartY - e.changedTouches[0].clientY
      const panel = panelRef.current
      if (
        panel &&
        touchStartTarget instanceof Node &&
        panel.contains(touchStartTarget) &&
        panel.scrollHeight > panel.clientHeight + 2
      ) {
        return
      }
      if (dy > 50) api.forward()
      else if (dy < -50) api.back()
    }

    window.addEventListener("wheel", onWheel, { passive: false })
    window.addEventListener("keydown", onKey)
    window.addEventListener("touchstart", onTouchStart, { passive: true })
    window.addEventListener("touchend", onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener("wheel", onWheel)
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("touchstart", onTouchStart)
      window.removeEventListener("touchend", onTouchEnd)
    }
  }, [api])

  const currentStop = STOPS[state.stop]
  const nextStop = STOPS[state.stop + 1]
  const panelHidden = state.moving || !state.ready

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background text-foreground">
      <div ref={hostRef} className="absolute inset-0" />

      {!state.ready && (
        <div className="absolute inset-0 z-10 flex items-center justify-center font-mono text-sm text-muted-foreground">
          Preparando el tablero…
        </div>
      )}

      <HudStatus
        sq={state.sq}
        statusText={state.statusText}
        nextLabel={nextStop ? `Siguiente parada: ${nextStop.label}` : "¡Llegaste a la meta!"}
        canForward={Boolean(nextStop)}
        canBack={state.stop > 0}
        showRail={layout.rail}
        currentStopIndex={state.stop}
        onForward={api.forward}
        onBack={api.back}
        onSelectStop={api.goTo}
      />

      <SectionPanel
        ref={panelRef}
        stop={currentStop}
        top={layout.narrow ? "46%" : "80px"}
        width={layout.panelWidth}
        hidden={panelHidden}
        camera={CAMERA}
      >
        {renderSection(currentStop.key, nav)}
      </SectionPanel>
    </div>
  )
}
