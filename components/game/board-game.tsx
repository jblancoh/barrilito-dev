"use client"

import { useEffect, useMemo, useRef } from "react"
import { useTheme } from "next-themes"
import { STOPS, type StopKey } from "./board-config"
import { onBoardGoTo } from "./board-events"
import type { BoardNav } from "./board-nav"
import { HudStatus } from "./hud-status"
import { SectionPanel } from "./section-panel"
import { useBoardScene } from "./use-board-scene"
import { AboutSection } from "./sections/about"
import { SkillsSection } from "./sections/skills"
import { ProjectsSection } from "./sections/projects"
import { ServicesSection } from "./sections/services"
import { ContactInfoSection } from "./sections/contact-info"
import { ContactFormSection } from "./sections/contact-form"

const CAMERA = "B" as const

function panelCanScroll(panel: HTMLDivElement | null, target: EventTarget | null, deltaY: number): boolean {
  if (!panel || !(target instanceof Node) || !panel.contains(target)) return false
  if (panel.scrollHeight <= panel.clientHeight + 2) return false
  return deltaY > 0 ? panel.scrollTop + panel.clientHeight < panel.scrollHeight - 2 : panel.scrollTop > 0
}

export function BoardGame() {
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme !== "light"

  const hostRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const { api, state, layout } = useBoardScene(hostRef, {
    dark,
    camera: CAMERA,
    speed: 1,
    confetti: true,
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

function renderSection(key: StopKey, nav: BoardNav) {
  switch (key) {
    case "about":
      return <AboutSection nav={nav} />
    case "skills":
      return <SkillsSection />
    case "projects":
      return <ProjectsSection nav={nav} />
    case "services":
      return <ServicesSection nav={nav} />
    case "info":
      return <ContactInfoSection nav={nav} />
    case "contact":
      return <ContactFormSection nav={nav} />
  }
}
