"use client"

import { ExternalLink, Github } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { projects, socialLinks } from "@/lib/content"
import type { BoardNav } from "../board-nav"
import { ShortcutCard } from "../shortcut-card"

function tagClass(tag: string): string {
  if (tag.includes("React")) return "bg-primary/20 text-primary hover:bg-primary/30"
  if (tag.includes("Firebase")) return "bg-secondary/20 text-secondary-foreground hover:bg-secondary/30"
  if (tag.includes("Type")) return "bg-accent/20 text-accent-foreground hover:bg-accent/30"
  return "bg-secondary/20 text-secondary-foreground hover:bg-secondary/30"
}

export function ProjectsSection({ nav }: { nav: BoardNav }) {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="text-4xl font-bold leading-[1.1] tracking-tight">Mis Proyectos</h2>
        <p className="mt-3 text-xl text-muted-foreground">Trabajos destacados y aplicaciones que he desarrollado</p>
      </div>
      {projects.map((project) => (
        <Card key={project.title} className="overflow-hidden border-none">
          <div className={`flex aspect-[16/7] items-end p-4 font-mono text-[11px] text-muted-foreground ${project.color}`}>
            captura del proyecto
          </div>
          <CardHeader className="gap-1.5 pb-3">
            <CardTitle className="text-[17px]">{project.title}</CardTitle>
            <CardDescription>{project.description}</CardDescription>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <Badge key={tag} variant="outline" className={tagClass(tag)}>
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                <Github className="mr-2 h-4 w-4" />
                Código
              </a>
            </Button>
            <Button size="sm" asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
              <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Demo
              </a>
            </Button>
          </CardFooter>
        </Card>
      ))}
      <Button
        variant="outline"
        size="lg"
        asChild
        className="self-center border-accent text-accent hover:bg-accent hover:text-accent-foreground"
      >
        <a href={socialLinks.github} target="_blank" rel="noopener noreferrer">
          Ver más proyectos en GitHub
        </a>
      </Button>
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
