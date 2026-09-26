"use client"

import { Github, Linkedin, Twitter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { profile, socialLinks } from "@/lib/content"
import type { BoardNav } from "../board-nav"
import { ShortcutCard } from "../shortcut-card"

export function AboutSection({ nav }: { nav: BoardNav }) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-[44px] font-bold leading-[1.1] tracking-tight text-balance">
          Hola, soy {profile.name.split(" ")[0]}. Me dicen <span className="text-primary">{profile.nickname}</span>{" "}
          🏈
        </h1>
        <p className="text-lg font-medium text-secondary">{profile.title}</p>
        <p className="text-xl text-muted-foreground text-pretty">{profile.tagline}</p>
        <p className="text-muted-foreground text-pretty">{profile.intro}</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <Button size="lg" onClick={() => nav.goTo("projects")}>
          Ver casos
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
          onClick={() => nav.goTo("contact")}
        >
          Hablemos
        </Button>
      </div>

      <div className="flex gap-4">
        <Button variant="ghost" size="icon" className="hover:bg-accent/20 hover:text-accent" asChild>
          <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
            <Github className="h-5 w-5" />
          </a>
        </Button>
        <Button variant="ghost" size="icon" className="hover:bg-primary/20 hover:text-primary" asChild>
          <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <Linkedin className="h-5 w-5" />
          </a>
        </Button>
        <Button variant="ghost" size="icon" className="hover:bg-secondary/20 hover:text-secondary" asChild>
          <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter">
            <Twitter className="h-5 w-5" />
          </a>
        </Button>
      </div>

      <div className="flex flex-col gap-4 border-t pt-6">
        <h2 className="text-2xl font-bold tracking-tight">Quién soy</h2>
        <p className="text-muted-foreground text-pretty">{profile.bioShort}</p>
        {profile.bioLong.map((paragraph, index) => (
          <p key={index} className="text-muted-foreground text-pretty">
            {paragraph}
          </p>
        ))}
        <div className="rounded-lg border-l-4 border-secondary bg-secondary/5 p-4 text-sm text-muted-foreground text-pretty">
          {profile.nicknameStory}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t pt-6">
        <h2 className="text-2xl font-bold tracking-tight">Manifiesto</h2>
        <p className="italic text-muted-foreground text-pretty">{profile.manifesto}</p>
      </div>

      <ShortcutCard
        code="02 ▲ 22"
        title="¿Traes prisa? Toma el atajo"
        subtitle="Escalera directa a Info de contacto"
        tone="secondary"
        onClick={() => nav.shortcut("ladder", 0)}
      />
    </section>
  )
}
