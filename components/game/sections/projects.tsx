"use client"

import { ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { featuredCases, secondaryCases, type Case } from "@/lib/content"
import type { BoardNav } from "../board-nav"
import { ShortcutCard } from "../shortcut-card"

const IMAGELESS_BG = ["bg-primary/10", "bg-secondary/10", "bg-accent/10", "bg-destructive/10"]

function caseSubtitle(c: Case): string | null {
  const parts = [c.role, c.org, c.period].filter(Boolean)
  return parts.length > 0 ? parts.join(" · ") : null
}

export function ProjectsSection({ nav }: { nav: BoardNav }) {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="text-4xl font-bold leading-[1.1] tracking-tight">Casos</h2>
        <p className="mt-3 text-xl text-muted-foreground text-pretty">
          Productos reales que construí o llevé de la idea a producción.
        </p>
      </div>

      {featuredCases.map((c, index) => {
        const subtitle = caseSubtitle(c)
        return (
          <Card key={c.title} className="overflow-hidden border-none">
            {c.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.image} alt={c.title} className="aspect-[16/7] w-full object-cover" />
            ) : (
              <div
                className={`flex aspect-[16/7] items-center justify-center text-5xl font-bold text-foreground/40 ${IMAGELESS_BG[index % IMAGELESS_BG.length]}`}
                aria-hidden="true"
              >
                {c.title.charAt(0)}
              </div>
            )}
            <CardHeader className="gap-1.5 pb-3">
              <CardTitle className="text-[17px]">{c.title}</CardTitle>
              {subtitle ? <p className="text-sm font-medium text-secondary">{subtitle}</p> : null}
              <CardDescription>{c.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pb-3">
              {c.highlights ? (
                <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                  {c.highlights.map((h) => (
                    <li key={h}>• {h}</li>
                  ))}
                </ul>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {c.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
            {c.link ? (
              <CardFooter>
                <Button size="sm" asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
                  <a href={c.link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ver demo
                  </a>
                </Button>
              </CardFooter>
            ) : null}
          </Card>
        )
      })}

      <div className="flex flex-col gap-3 border-t pt-6">
        <h3 className="text-sm font-medium text-muted-foreground">Otros proyectos</h3>
        {secondaryCases.map((c) => {
          const subtitle = caseSubtitle(c)
          return (
            <div key={c.title} className="flex flex-col gap-1.5 rounded-lg border bg-card p-4">
              <span className="font-semibold">
                {c.title}
                {subtitle ? ` — ${subtitle}` : ""}
              </span>
              <span className="text-sm text-muted-foreground">{c.description}</span>
              <div className="flex flex-wrap gap-1.5">
                {c.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <ShortcutCard
        code="15 ▲ 25"
        title="¿Te gustó algo? Sube la escalera"
        subtitle="Salta directo al formulario de contacto"
        tone="secondary"
        onClick={() => nav.shortcut("ladder", 1)}
      />
    </section>
  )
}
