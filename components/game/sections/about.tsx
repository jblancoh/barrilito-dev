"use client"

import { Github, Linkedin, Twitter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { socialLinks } from "@/lib/content"
import type { BoardNav } from "../board-nav"
import { ShortcutCard } from "../shortcut-card"

export function AboutSection({ nav }: { nav: BoardNav }) {
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-[44px] font-bold leading-[1.1] tracking-tight text-balance">
        Hola, soy <span className="text-primary">BarrilitoDev</span>
      </h1>
      <p className="text-xl text-muted-foreground text-pretty">
        Desarrollador web especializado en React, Next.js, Nest.js, Firebase y JavaScript. Creando experiencias
        digitales excepcionales.
      </p>
      <div className="flex flex-wrap gap-4">
        <Button size="lg" onClick={() => nav.goTo("projects")}>
          Ver proyectos
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
        >
          Descargar CV
        </Button>
      </div>
      <div className="flex gap-4">
        <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
          <Button variant="ghost" size="icon" className="hover:bg-accent/20 hover:text-accent">
            <Github className="h-5 w-5" />
          </Button>
        </a>
        <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
          <Button variant="ghost" size="icon" className="hover:bg-primary/20 hover:text-primary">
            <Linkedin className="h-5 w-5" />
          </Button>
        </a>
        <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter">
          <Button variant="ghost" size="icon" className="hover:bg-secondary/20 hover:text-secondary">
            <Twitter className="h-5 w-5" />
          </Button>
        </a>
      </div>
      <ShortcutCard
        code="02 ▲ 22"
        title="¿Con prisa? Sube la escalera"
        subtitle="Atajo directo a Información de contacto"
        tone="secondary"
        onClick={() => nav.shortcut("ladder", 0)}
      />
    </section>
  )
}
