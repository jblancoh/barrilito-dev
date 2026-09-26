"use client"

import { Button } from "@/components/ui/button"
import { community } from "@/lib/content"
import type { BoardNav } from "../board-nav"
import { ShortcutCard } from "../shortcut-card"

export function ContactInfoSection({ nav }: { nav: BoardNav }) {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="text-4xl font-bold leading-[1.1] tracking-tight">Comunidad</h2>
        <p className="mt-3 text-xl text-muted-foreground text-pretty">
          Donde comparto lo que aprendo y aprendo de otros.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-secondary/20 bg-card shadow">
        <div className="h-2 bg-gradient-to-r from-secondary via-accent to-primary" />
        <div className="flex flex-col gap-6 p-6">
          <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
            {community.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-6">
            <p className="font-medium">{community.invite}</p>
            <Button
              className="bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:from-primary/90 hover:to-secondary/90"
              onClick={() => nav.goTo("contact")}
            >
              Hablemos
            </Button>
          </div>
        </div>
      </div>

      <ShortcutCard
        code="21 ▼ 01"
        title="Serpiente al inicio"
        subtitle="Regresa a Sobre mí"
        tone="chart5"
        onClick={() => nav.shortcut("snake", 1)}
      />
    </section>
  )
}
