import type { ComponentType, SVGProps } from "react"
import {
  Atom,
  Code,
  Database,
  FileCode,
  Globe,
  LayoutGrid,
  Server,
  Terminal,
} from "lucide-react"

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

export interface Skill {
  title: string
  description: string
  icon: IconComponent
  colorClass: string
  bgClass: string
}

export const skills: Skill[] = [
  {
    title: "React",
    description: "Desarrollo de interfaces de usuario interactivas y componentes reutilizables",
    icon: Atom,
    colorClass: "text-primary",
    bgClass: "bg-primary/10",
  },
  {
    title: "Next.js",
    description: "Creación de aplicaciones web rápidas y optimizadas para SEO",
    icon: Server,
    colorClass: "text-foreground",
    bgClass: "bg-foreground/10",
  },
  {
    title: "JavaScript/TypeScript",
    description: "Programación frontend y backend con tipado estático",
    icon: FileCode,
    colorClass: "text-accent",
    bgClass: "bg-accent/10",
  },
  {
    title: "CSS/Tailwind",
    description: "Diseño responsive y estilizado moderno con utilidades",
    icon: LayoutGrid,
    colorClass: "text-primary",
    bgClass: "bg-primary/10",
  },
  {
    title: "Nest.js",
    description: "Desarrollo backend con TypeScript y arquitectura modular",
    icon: Terminal,
    colorClass: "text-destructive",
    bgClass: "bg-destructive/10",
  },
  {
    title: "Firebase",
    description: "Bases de datos en tiempo real, autenticación y hosting",
    icon: Database,
    colorClass: "text-secondary",
    bgClass: "bg-secondary/10",
  },
  {
    title: "Git/GitHub",
    description: "Control de versiones y colaboración en proyectos",
    icon: Code,
    colorClass: "text-foreground",
    bgClass: "bg-foreground/10",
  },
  {
    title: "Vercel",
    description: "Despliegue y hosting de aplicaciones web",
    icon: Globe,
    colorClass: "text-foreground",
    bgClass: "bg-foreground/10",
  },
]

export interface Project {
  title: string
  description: string
  image: string
  tags: string[]
  githubUrl: string
  liveUrl: string
  color: string
}

export const projects: Project[] = [
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

export interface Service {
  title: string
  colorVar: "--primary" | "--secondary" | "--accent" | "--chart-5"
}

export const services: Service[] = [
  { title: "Desarrollo Web", colorVar: "--primary" },
  { title: "Aplicaciones React", colorVar: "--secondary" },
  { title: "Diseño UI/UX", colorVar: "--accent" },
  { title: "Consultoría", colorVar: "--chart-5" },
]

export const socialLinks = {
  github: "https://github.com/jblancoh",
  linkedin: "https://www.linkedin.com/in/barrilitodev/",
  twitter: "https://twitter.com/barrilitodev",
}

export const contactInfo = {
  phone: "+52 123 456 7890",
  location: "Ciudad de México, México",
  schedule: [
    { days: "Lunes - Viernes", hours: "9:00 AM - 6:00 PM" },
    { days: "Sábado", hours: "10:00 AM - 2:00 PM" },
  ],
}
