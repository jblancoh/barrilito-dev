"use client"

import dynamic from "next/dynamic"
import { useCallback, useEffect, useState } from "react"
import { ClassicHome } from "./seo-fallback"
import { detectRenderMode, readRenderEnv, type RenderMode } from "./render-mode"

// three.js only ever loads through this dynamic, ssr:false import — lite
// mode, which never renders <BoardGame>, never requests that chunk.
const BoardGame = dynamic(() => import("./board-game").then((m) => m.BoardGame), { ssr: false })

/**
 * Decides which home to show, after mount. The server and the first client
 * render both show the classic home (mode starts as "lite"), so there's no
 * hydration mismatch and no blank page while the device is being probed;
 * `useEffect` then flips to "full" for a capable device. A runtime
 * failure reported by BoardGame (see board-game.tsx / use-board-scene.ts)
 * falls back to the classic home without persisting it as a preference.
 */
export function HomeSwitch() {
  const [mode, setMode] = useState<RenderMode>("lite")

  useEffect(() => {
    setMode(detectRenderMode(readRenderEnv()))
  }, [])

  const handleFallback = useCallback(() => {
    setMode("lite")
  }, [])

  const showBoard = mode === "full"

  return (
    <>
      <ClassicHome visible={!showBoard} />
      {showBoard && <BoardGame onFallback={handleFallback} />}
    </>
  )
}
