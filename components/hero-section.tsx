import { Button } from "@/components/ui/button"
import { Github, Linkedin, Twitter } from "lucide-react"
import { socialLinks } from "@/lib/content"

export function HeroSection() {
  return (
    <section id="about" className="py-20 md:py-32">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 items-center">
        <div className="flex flex-col space-y-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Hola, soy <span className="text-primary">BarrilitoDev</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Desarrollador web especializado en React, Next.js, Nest.js, Firebase y JavaScript. Creando experiencias
            digitales excepcionales.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg">Ver proyectos</Button>
            <Button
              size="lg"
              variant="outline"
              className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
            >
              Descargar CV
            </Button>
          </div>
          <div className="flex gap-4 pt-2">
            <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <Button variant="ghost" size="icon" className="hover:bg-accent/20 hover:text-accent">
                <Github className="h-5 w-5" />
              </Button>
            </a>
            <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <Button variant="ghost" size="icon" className="hover:bg-primary/20 hover:text-primary">
                <Linkedin className="h-5 w-5" />
              </Button>
            </a>
            <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <Button variant="ghost" size="icon" className="hover:bg-secondary/20 hover:text-secondary">
                <Twitter className="h-5 w-5" />
              </Button>
            </a>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="relative h-80 w-80">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-secondary/30 to-accent/30 rounded-full blur-3xl opacity-70"></div>
            <img
              src="/assets/barrildevb.png"
              alt="BarrilitoDev Logo"
              width={320}
              height={320}  
              className="object-contain dark:invert relative z-10"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

