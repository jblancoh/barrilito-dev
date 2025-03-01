"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true') {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent rounded-full blur-lg opacity-70"></div>
              <img
                src="/assets/barrildevb.png"
                alt="BarrilitoDev Logo"
                width={40}
                height={40}
                className="dark:invert relative z-10"
              />
            </div>
            <span className="hidden font-bold sm:inline-block">BarrilitoDev</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/#about" className="text-sm font-medium transition-colors hover:text-primary">
            Sobre mí
          </Link>
          <Link href="/#skills" className="text-sm font-medium transition-colors hover:text-secondary">
            Habilidades
          </Link>
          <Link href="/#projects" className="text-sm font-medium transition-colors hover:text-accent">
            Proyectos
          </Link>
          <Link href="/#contact" className="text-sm font-medium transition-colors hover:text-destructive">
            Contacto
          </Link>
          <Link href="/blog" className="text-sm font-medium transition-colors hover:text-primary">
            Blog
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ModeToggle />
          <Button
            variant="default"
            className="hidden md:flex bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
          >
            <Link href="/#contact">Contáctame</Link>
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="container md:hidden">
          <nav className="flex flex-col space-y-4 py-4">
            <Link
              href="/#about"
              className="text-sm font-medium transition-colors hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              Sobre mí
            </Link>
            <Link
              href="/#skills"
              className="text-sm font-medium transition-colors hover:text-secondary"
              onClick={() => setIsMenuOpen(false)}
            >
              Habilidades
            </Link>
            <Link
              href="/#projects"
              className="text-sm font-medium transition-colors hover:text-accent"
              onClick={() => setIsMenuOpen(false)}
            >
              Proyectos
            </Link>
            <Link
              href="/#contact"
              className="text-sm font-medium transition-colors hover:text-destructive"
              onClick={() => setIsMenuOpen(false)}
            >
              Contacto
            </Link>
            <Link
              href="/blog"
              className="text-sm font-medium transition-colors hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              Blog
            </Link>
            <Button
              variant="default"
              className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
              onClick={() => setIsMenuOpen(false)}
            >
              <Link href="/#contact">Contáctame</Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}

