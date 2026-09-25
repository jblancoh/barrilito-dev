"use client"

import dynamic from "next/dynamic"
import { useCallback } from "react"
import { ClassicHome } from "./seo-fallback"
import { useRenderMode } from "./render-mode-context"

// three.js only ever loads through this dynamic, ssr:false import — lite
// mode, which never renders <BoardGame>, never requests that chunk.
const BoardGame = dynamic(() => import("./board-game").then((m) => m.BoardGame), { ssr: false })

/**
 * Shows the interactive three.js board or the classic scrollable home,
 * driven by the shared RenderModeProvider (see render-mode-context.tsx —
 * it starts as "lite" and detects the real mode after mount, so there's no
 * hydration mismatch and no blank page). The Navbar's manual toggle and a
 * runtime board failure (BoardGame's onFallback, wired in T4) both flow
 * through the same context; a fallback is set as automatic, so it's never
 * persisted as a user preference.
 */
export function HomeSwitch() {
  const { mode, setAutoMode } = useRenderMode()

  const handleFallback = useCallback(() => {
    setAutoMode("lite")
  }, [setAutoMode])

  const showBoard = mode === "full"

  return (
    <>
      <ClassicHome visible={!showBoard} />
      {showBoard && <BoardGame onFallback={handleFallback} />}
    </>
  )
}
