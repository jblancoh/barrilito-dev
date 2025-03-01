import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Github, ExternalLink } from "lucide-react"

const projects = [
  {
    title: "Proyecto E-commerce",
    description: "Tienda online completa con carrito de compras, pagos y gestión de productos",
    image: "/placeholder.svg?height=300&width=500",
    tags: ["React", "Next.js", "Tailwind CSS", "Stripe"],
    githubUrl: "#",
    liveUrl: "#",
    color: "bg-primary/10",
  },
  {
    title: "Dashboard Analítico",
    description: "Panel de control para visualización de datos y métricas empresariales",
    image: "/placeholder.svg?height=300&width=500",
    tags: ["React", "TypeScript", "Chart.js", "Firebase"],
    githubUrl: "#",
    liveUrl: "#",
    color: "bg-secondary/10",
  },
  {
    title: "App de Gestión de Tareas",
    description: "Aplicación para organizar proyectos y tareas con colaboración en tiempo real",
    image: "/placeholder.svg?height=300&width=500",
    tags: ["React", "Redux", "Node.js", "MongoDB"],
    githubUrl: "#",
    liveUrl: "#",
    color: "bg-accent/10",
  },
]

export function ProjectsSection() {
  return (
    <section id="projects" className="py-20">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Mis Proyectos</h2>
        <p className="mt-4 text-xl text-muted-foreground">Trabajos destacados y aplicaciones que he desarrollado</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((project, index) => (
          <Card key={index} className="overflow-hidden transition-all hover:shadow-lg border-none">
            <div className={`aspect-video relative ${project.color}`}>
              <img
                src={project.image || "/placeholder.svg"}
                alt={project.title}
                width={500}
                height={300}
                className="object-cover mix-blend-multiply"
              />
            </div>
            <CardHeader>
              <CardTitle>{project.title}</CardTitle>
              <CardDescription>{project.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag, tagIndex) => {
                  // Asignar colores diferentes a las badges según la tecnología
                  let badgeClass = "bg-secondary/20 text-secondary-foreground hover:bg-secondary/30"
                  if (tag.includes("React")) badgeClass = "bg-primary/20 text-primary hover:bg-primary/30"
                  if (tag.includes("Firebase"))
                    badgeClass = "bg-secondary/20 text-secondary-foreground hover:bg-secondary/30"
                  if (tag.includes("Type")) badgeClass = "bg-accent/20 text-accent-foreground hover:bg-accent/30"

                  return (
                    <Badge key={tagIndex} variant="outline" className={badgeClass}>
                      {tag}
                    </Badge>
                  )
                })}
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
      </div>
      <div className="text-center mt-12">
        <Button
          size="lg"
          variant="outline"
          asChild
          className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
        >
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">
            Ver más proyectos en GitHub
          </a>
        </Button>
      </div>
    </section>
  )
}

