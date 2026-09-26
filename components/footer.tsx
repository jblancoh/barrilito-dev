import Link from "next/link"
import { Github, Linkedin, Twitter } from "lucide-react"
import { offer, socialLinks } from "@/lib/content"

export function Footer() {
  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true') {
    return null
  }
  return (
    <footer className="border-t py-12 bg-gradient-to-b from-background to-background/80">
      <div className="container grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/assets/barrildevb.png"
              alt="barrilito.dev Logo"
              width={40}
              height={40}
              className="dark:invert"
            />
            <span className="font-bold">barrilito.dev</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            AI Product Engineer &amp; Tech Lead. Integro IA en productos reales y acompaño a startups como socio
            técnico, de la idea al producto desplegado.
          </p>
          <div className="flex gap-4 mt-4">
            <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <Github className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
            </a>
            <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <Linkedin className="h-5 w-5 text-muted-foreground hover:text-secondary transition-colors" />
            </a>
            <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter">
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
              Cómo trabajo
            </Link>
            <Link href="/#projects" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Casos
            </Link>
            <Link href="/#contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Contacto
            </Link>
          </nav>
        </div>
        <div>
          <h3 className="font-medium mb-4 text-secondary">Oferta</h3>
          <nav className="flex flex-col gap-2">
            {offer.services.map((service) => (
              <span key={service.title} className="text-sm text-muted-foreground">
                {service.title}
              </span>
            ))}
          </nav>
        </div>
      </div>
      <div className="container mt-8 pt-8 border-t">
        <p className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Jonathan Blanco. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  )
}
