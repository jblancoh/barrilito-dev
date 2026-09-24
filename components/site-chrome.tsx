"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { Footer } from "@/components/footer"

/**
 * The Snakes & Ladders board landing ("/") is a full-viewport 3D scene with
 * the Navbar overlaying it and no footer. Every other route keeps the
 * original centered container + footer layout, with top padding to clear
 * the now-fixed Navbar (see components/navbar.tsx).
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isBoardHome = pathname === "/"

  if (isBoardHome) {
    return <main className="min-h-screen">{children}</main>
  }

  return (
    <div className="container mx-auto">
      <div className="flex min-h-screen flex-col pt-16">
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </div>
  )
}
