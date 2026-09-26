/**
 * Site copy and data, sourced from `docs/profile-brief.md` (approved
 * 2026-09-25). This is the single place the board sections read profile,
 * cases, offer, community and contact data from — both the 3D board and the
 * lite/SEO fallback render the exact same content (see section-registry.tsx).
 */

export interface Profile {
  name: string
  nickname: string
  title: string
  tagline: string
  intro: string
  bioShort: string
  /** Main biography paragraphs (professional path), rendered in order. */
  bioLong: string[]
  /** The "¿Por qué Barril?" callout — kept separate so the UI can style it as a highlight. */
  nicknameStory: string
  manifesto: string
}

export const profile: Profile = {
  name: "Jonathan Blanco",
  nickname: "Barril",
  title: "AI Product Engineer & Tech Lead",
  tagline: "La IA juega rápido. Yo pongo las reglas del juego.",
  intro: "Integro IA en productos reales y ayudo a startups a construir lo correcto, rápido y seguro.",
  bioShort:
    "Tech lead que programa, piensa el producto y cuida al equipo. Más de 10 años construyendo software; hoy integro IA en productos reales.",
  bioLong: [
    "Empecé en 2009 dando soporte técnico en un hospital. Cuando me entró la curiosidad por programar, me pasé a las guardias nocturnas para aprender a desarrollar sin soltar el trabajo. En 2016 di el salto y no he parado: fui CTO y cofundador de una app de delivery, tech lead de una plataforma de créditos, y hoy soy Champion (referente) del área de desarrollo en Radius, donde integro IA en productos como Clainor, que analiza expedientes médicos para aseguradoras. Del hospital a los expedientes médicos: el círculo se cerró.",
  ],
  nicknameStory:
    "¿Por qué Barril? Culpa de mi coach, Rafael Corona 🕊️. Volví de una temporada con unos kilos de más, me dijo que parecía un barril y el apodo se quedó. Sigo en el campo: juego y arbitro tocho bandera. Supongo que de ahí me viene lo de poner las reglas del juego.",
  manifesto:
    "La IA ya escribe código, y lo hace mejor cada día. Lo que no reemplaza es a quien entiende el producto completo, sabe quién decide qué y destraba al equipo. Yo diseño las reglas en las que trabaja la IA (arquitectura, pruebas, seguridad) y reviso cada cambio. La velocidad la pone la IA. El criterio lo pongo yo.",
}

export interface Pillar {
  title: string
  description: string
}

/** "Cómo trabajo" pillars — the replacement for the old tech-skills list. */
export const pillars: Pillar[] = [
  {
    title: "Visión de producto",
    description: "Entiendo el producto de punta a punta, no solo mi tarea.",
  },
  {
    title: "Desbloqueo y conexión",
    description: "Sé con quién hablar y hago que las cosas avancen.",
  },
  {
    title: "Liderazgo cercano",
    description: "Medio en conflictos, cuido al equipo, me sumo al war room.",
  },
  {
    title: "IA con reglas",
    description: "Plan primero, SDD + TDD, agentes orquestados y revisión humana.",
  },
  {
    title: "De la idea a producción",
    description: "Arquitectura, CI/CD, dominios, auth, correo y seguridad.",
  },
]

/** Compact tools strip — deliberately not the protagonist of the section. */
export const tools: string[] = [
  "React",
  "Next.js",
  "React Native / Expo",
  "Node.js / NestJS",
  "Supabase",
  "Firebase",
  "PostgreSQL",
  "AWS",
  "Vercel",
  "Claude Code",
  "Codex",
  "LLMs",
]

export interface Case {
  title: string
  org?: string
  role?: string
  period?: string
  description: string
  highlights?: string[]
  tags: string[]
  /** Omitted (never "#") when there is nowhere public to send visitors. */
  link?: string
  /** Omitted when there is no screenshot/flyer to show; the card design handles that case. */
  image?: string
}

/** Featured cases, in board order. */
export const featuredCases: Case[] = [
  {
    title: "Clainor",
    org: "Radius",
    description:
      "Dictaminador con LLMs para aseguradoras: genera resumen médico, dictamen administrativo, dictamen médico y análisis de cuenta, y alerta sobrecargos contra la lista de precios convenida.",
    highlights: ["Resumen médico automático", "Dictamen administrativo y médico", "Alerta de sobrecargos"],
    tags: ["LLMs", "Salud", "Radius"],
  },
  {
    title: "YUM Delivery",
    role: "CTO y cofundador",
    period: "2019–2022",
    description:
      "Ventas, producto, soporte y desarrollo con un equipo de 3. Tres años compitiendo con apps nacionales de delivery en Villahermosa, con geolocalización basada en H3.",
    highlights: ["Equipo de 3 personas", "3 años en el mercado", "Geolocalización con H3"],
    tags: ["CTO", "Delivery", "Geolocalización"],
  },
  {
    title: "Directorio Solidario",
    description:
      "Tras el incendio de la Feria Tabasco, lo levanté en menos de 2 horas. En 24 horas había 43 comercios verificados, más aliados como Flick sumando comandas gratis. Ya no está en línea.",
    highlights: ["Levantado en menos de 2 horas", "43 comercios verificados en 24 horas", "Aliados como Flick"],
    tags: ["Respuesta rápida", "Comunidad"],
    image: "/cases/directorio-solidario.webp",
  },
  {
    title: "TheKickoff",
    description:
      "Gestor de torneos deportivos que va camino a red social y mapa de torneos en México. Demo en construcción.",
    highlights: ["Gestión de torneos", "Rumbo a red social + mapa de torneos"],
    tags: ["Deporte", "Producto propio"],
    link: "https://demo.thekickoff.lat/",
  },
]

/** Secondary cases — a compact list, no screenshots. */
export const secondaryCases: Case[] = [
  {
    title: "Simulador de Bolsa de Valores",
    description: "Construido solo, de punta a punta, con React Native y Lambdas.",
    tags: ["React Native", "AWS Lambda", "Solo"],
  },
  {
    title: "Graviti",
    role: "Tech lead",
    description: "Plataforma de créditos donde lideré el equipo técnico y subimos +3% la conversión.",
    tags: ["Fintech", "Tech lead"],
  },
  {
    title: "barrilito.dev",
    description: "Este mismo sitio: el tablero de serpientes y escaleras que estás recorriendo ahora.",
    tags: ["Next.js", "Three.js"],
  },
]

export interface Service {
  title: string
  description: string
}

export interface Offer {
  services: Service[]
  /** Working-model line shown under the services grid. */
  terms: string
  /** What's explicitly out of scope. */
  noHago: string
}

/** "Oferta" — the replacement for the old generic services list. */
export const offer: Offer = {
  services: [
    {
      title: "Socio técnico para startups",
      description: "Definimos el producto juntos y lo construyo y despliego.",
    },
    {
      title: "IA en tu producto",
      description: "LLMs, prompts y agentes acotados a tu dominio.",
    },
    {
      title: "Asesoría a equipos",
      description: "Adoptar agentes con reglas claras, SDD/TDD y liderazgo técnico.",
    },
    {
      title: "MVPs y landings rápidas",
      description: "Tu idea en línea en días.",
    },
    {
      title: "Charlas y talleres",
      description: "Agentes, IA en producto y liderazgo sin ser jefe.",
    },
  ],
  terms:
    "Trabajo con pocos proyectos a la vez para darles atención real. Modelos flexibles: por entregables, mensual o con participación si somos socios.",
  noHago: "No hago: WordPress, mantenimiento de sistemas legacy ni proyectos sin presupuesto.",
}

export interface Community {
  items: string[]
  invite: string
}

export const community: Community = {
  items: [
    "Co-líder del AWS User Group Villahermosa",
    "Host de Hacktoberfest (2.º año)",
    "Mentorías y talleres",
  ],
  invite: "¿Organizas un meetup o evento? Hablemos.",
}

export const socialLinks = {
  github: "https://github.com/jblancoh",
  linkedin: "https://www.linkedin.com/in/barrilitodev/",
  twitter: "https://twitter.com/barrilitodev",
}

export interface ContactInfo {
  /**
   * Raw phone number, kept only as data to derive the WhatsApp link
   * (see lib/whatsapp.ts). Never rendered directly in the UI.
   */
  phone: string
  /** Prefilled WhatsApp message. */
  whatsappMessage: string
  location: string
}

export const contactInfo: ContactInfo = {
  phone: "+52 993 360 0042",
  whatsappMessage: "Hola Barril, vi tu página y quiero platicar de un proyecto",
  location: "Villahermosa, Tabasco, México",
}

// ---------------------------------------------------------------------------
// Legacy exports below. `hero-section.tsx`, `projects-section.tsx` and
// `skills-section.tsx` are dead, unimported components explicitly out of
// scope for the profile-content rework (see odd/tasks/profile-content.md).
// They still import `skills`/`projects` from this module, so these keep the
// project type-checking without touching those files. Safe to delete
// alongside those components in a future cleanup.
import type { ComponentType, SVGProps } from "react"
import { Atom, Code, Database, FileCode, Globe, LayoutGrid, Server, Terminal } from "lucide-react"

export interface Skill {
  title: string
  description: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  colorClass: string
  bgClass: string
}

/** @deprecated Only used by the dead `skills-section.tsx`. Use `pillars`/`tools` instead. */
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

/** @deprecated Only used by the dead `projects-section.tsx`. Use `featuredCases`/`secondaryCases` instead. */
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
