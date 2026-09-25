"use client"

import { useEffect } from "react"
import { parseStopHash } from "@/lib/share"
import { LADDERS, SNAKES, STOPS, type StopKey } from "./board-config"
import type { BoardNav } from "./board-nav"
import { prefersReducedMotion } from "./board-events"
import { renderSection } from "./section-registry"

function scrollToStop(key: StopKey): void {
  if (typeof document === "undefined") return
  document.getElementById(key)?.scrollIntoView({ behavior: "smooth", block: "start" })
}

/** The classic home has no board, so a "shortcut" jumps straight to the ladder/snake's destination stop. */
const classicNav: BoardNav = {
  goTo: scrollToStop,
  shortcut: (kind, index) => {
    const dest = kind === "ladder" ? LADDERS[index]?.dest : SNAKES[index]?.dest
    if (dest !== undefined) scrollToStop(STOPS[dest].key)
  },
}

export interface ClassicHomeProps {
  /**
   * true renders the real, natively scrollable classic layout (lite mode).
   * false (default) keeps the exact same markup present for SEO and screen
   * readers but visually hidden (`sr-only`) — the interactive three.js
   * board is what capable browsers actually see.
   */
  visible?: boolean
}

/**
 * The classic home: every section, in board order, as real standalone
 * markup (one `<section id={stop.key}>` per stop, reusing the same section
 * components the board renders). The interactive board is a client-only
 * three.js scene (next/dynamic, ssr:false) and never appears in the
 * server-rendered HTML, so this component's DOM is what crawlers, screen
 * readers and lite-mode visitors actually get.
 */
export function ClassicHome({ visible = false }: ClassicHomeProps) {
  // The classic layout's sections only exist with real dimensions once this component
  // renders visible (HomeSwitch decides the mode after mount), so the browser's native
  // scroll-to-anchor may already have fired and missed. Scroll to the deep-linked stop
  // ourselves once it's actually there.
  useEffect(() => {
    if (!visible || typeof window === "undefined") return
    const stopKey = parseStopHash(window.location.hash)
    if (!stopKey) return
    document
      .getElementById(stopKey)
      ?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" })
  }, [visible])

  return (
    <div className={visible ? "container mx-auto flex flex-col gap-20 pb-24 pt-24" : "sr-only"}>
      {STOPS.map((stop) => (
        <section key={stop.key} id={stop.key} aria-label={stop.label} className="scroll-mt-20">
          {renderSection(stop.key, classicNav)}
        </section>
      ))}
    </div>
  )
}

// Kept for compatibility with any existing import of the previous name.
export { ClassicHome as SeoFallback }
