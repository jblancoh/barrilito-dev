"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { dispatchBoardGoTo } from "@/components/game/board-events"
import type { StopKey } from "@/components/game/board-config"

const NAV_LINKS: { key: StopKey; label: string; hoverClass: string }[] = [
  { key: "about", label: "Sobre mí", hoverClass: "hover:text-primary" },
  { key: "skills", label: "Habilidades", hoverClass: "hover:text-secondary" },
  { key: "projects", label: "Proyectos", hoverClass: "hover:text-accent" },
  { key: "services", label: "Servicios", hoverClass: "hover:text-chart5" },
  { key: "contact", label: "Contacto", hoverClass: "hover:text-destructive" },
]

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true") {
    return null
  }

  const goTo = (key: StopKey) => dispatchBoardGoTo(key)

  return (
    <header className="fixed inset-x-0 top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" onClick={() => goTo("about")} className="flex items-center gap-2">
            <div className="relative h-10 w-10">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary via-secondary to-accent opacity-70 blur-lg"></div>
              <img
                src="/assets/barrildevb.png"
                alt="BarrilitoDev Logo"
                width={40}
                height={40}
                className="relative z-10 dark:invert"
              />
            </div>
            <span className="hidden font-bold sm:inline-block">BarrilitoDev</span>
          </Link>
        </div>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <button
              key={link.key}
              type="button"
              onClick={() => goTo(link.key)}
              className={`text-sm font-medium transition-colors ${link.hoverClass}`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ModeToggle />
          <Button
            variant="default"
            onClick={() => goTo("contact")}
            className="hidden bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 md:flex"
          >
            Contáctame
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="container md:hidden">
          <nav className="flex flex-col space-y-4 py-4">
            {NAV_LINKS.map((link) => (
              <button
                key={link.key}
                type="button"
                onClick={() => {
                  goTo(link.key)
                  setIsMenuOpen(false)
                }}
                className={`text-left text-sm font-medium transition-colors ${link.hoverClass}`}
              >
                {link.label}
              </button>
            ))}
            <Button
              variant="default"
              onClick={() => {
                goTo("contact")
                setIsMenuOpen(false)
              }}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
            >
              Contáctame
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}
