import { Atom, Code, Database, FileCode, Globe, LayoutGrid, Server, Terminal } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const skills = [
  {
    title: "React",
    description: "Desarrollo de interfaces de usuario interactivas y componentes reutilizables",
    icon: <Atom className="h-10 w-10 text-primary" />,
    bgClass: "bg-primary/10",
  },
  {
    title: "Next.js",
    description: "Creación de aplicaciones web rápidas y optimizadas para SEO",
    icon: <Server className="h-10 w-10 text-foreground" />,
    bgClass: "bg-foreground/10",
  },
  {
    title: "JavaScript/TypeScript",
    description: "Programación frontend y backend con tipado estático",
    icon: <FileCode className="h-10 w-10 text-accent" />,
    bgClass: "bg-accent/10",
  },
  {
    title: "CSS/Tailwind",
    description: "Diseño responsive y estilizado moderno con utilidades",
    icon: <LayoutGrid className="h-10 w-10 text-primary" />,
    bgClass: "bg-primary/10",
  },
  {
    title: "Nest.js",
    description: "Desarrollo backend con TypeScript y arquitectura modular",
    icon: <Terminal className="h-10 w-10 text-destructive" />,
    bgClass: "bg-destructive/10",
  },
  {
    title: "Firebase",
    description: "Bases de datos en tiempo real, autenticación y hosting",
    icon: <Database className="h-10 w-10 text-secondary" />,
    bgClass: "bg-secondary/10",
  },
  {
    title: "Git/GitHub",
    description: "Control de versiones y colaboración en proyectos",
    icon: <Code className="h-10 w-10 text-foreground" />,
    bgClass: "bg-foreground/10",
  },
  {
    title: "Vercel",
    description: "Despliegue y hosting de aplicaciones web",
    icon: <Globe className="h-10 w-10 text-foreground" />,
    bgClass: "bg-foreground/10",
  },
]

export function SkillsSection() {
  return (
    <section id="skills" className="py-20">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Mis Habilidades</h2>
        <p className="mt-4 text-xl text-muted-foreground">Tecnologías y herramientas que domino</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {skills.map((skill, index) => (
          <Card key={index} className="transition-all hover:shadow-lg border-none">
            <CardHeader className={`pb-2 rounded-t-lg ${skill.bgClass}`}>
              <div className="mb-2">{skill.icon}</div>
              <CardTitle>{skill.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">{skill.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

