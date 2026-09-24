import dynamic from "next/dynamic"
import { SeoFallback } from "@/components/game/seo-fallback"

const BoardGame = dynamic(() => import("@/components/game/board-game").then((m) => m.BoardGame), {
  ssr: false,
})

export default function Home() {
  return (
    <>
      <SeoFallback />
      <BoardGame />
    </>
  )
}
