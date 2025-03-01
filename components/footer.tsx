import Link from "next/link"
import { Github, Linkedin, Twitter } from "lucide-react"

export function Footer() {
  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true') {
    return null
  }
  return (
    <footer className="border-t py-12 bg-gradient-to-b from-background to-background/80">
      <div className="container grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-2">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/assets/barrildevb.png"
              alt="BarrilitoDev Logo"
              width={40}
              height={40}
              className="dark:invert"
            />
            <span className="font-bold">BarrilitoDev</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Desarrollador web especializado en React, Next.js, Nest.js, Firebase y JavaScript.
          </p>
          <div className="flex gap-4 mt-4">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <Github className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <Linkedin className="h-5 w-5 text-muted-foreground hover:text-secondary transition-colors" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <Twitter className="h-5 w-5 text-muted-foreground hover:text-accent transition-colors" />
            </a>
          </div>
        </div>
        <div>
          <h3 className="font-medium mb-4 text-primary">Enlaces rápidos</h3>
          <nav className="flex flex-col gap-2">
            <Link href="/#about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Sobre mí
            </Link>
            <Link href="/#skills" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Habilidades
            </Link>
            <Link href="/#projects" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Proyectos
            </Link>
            <Link href="/#contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Contacto
            </Link>
            <Link href="/blog" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Blog
            </Link>
          </nav>
        </div>
        <div>
          <h3 className="font-medium mb-4 text-secondary">Servicios</h3>
          <nav className="flex flex-col gap-2">
            <Link href="#" className="text-sm text-muted-foreground hover:text-secondary transition-colors">
              Desarrollo Web
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-secondary transition-colors">
              Aplicaciones React
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-secondary transition-colors">
              Diseño UI/UX
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-secondary transition-colors">
              Consultoría
            </Link>
          </nav>
        </div>
        <div>
          <h3 className="font-medium mb-4 text-accent">Boletín</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Suscríbete para recibir actualizaciones y consejos de desarrollo.
          </p>
          <form className="flex gap-2">
            <input
              type="email"
              placeholder="tu@email.com"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-accent text-accent-foreground hover:bg-accent/90 h-10 px-4 py-2">
              Enviar
            </button>
          </form>
        </div>
      </div>
      <div className="container mt-8 pt-8 border-t">
        <p className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} BarrilitoDev. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  )
}

