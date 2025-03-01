import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Clock, Wrench} from "lucide-react"

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-background/80 p-4">
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="max-w-3xl w-full mx-auto text-center space-y-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent rounded-full blur-lg opacity-70"></div>
              <Image
                src="/assets/barrildevb.png"
                alt="BarrilitoDev Logo"
                width={96}
                height={96}
                className="dark:invert relative z-10"
              />
            </div>
          </div>
          
          {/* Título y subtítulo */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Sitio en <span className="text-primary">Mantenimiento</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Estamos realizando mejoras en nuestro sitio web para ofrecerte una mejor experiencia.
              Volveremos pronto con nuevas funcionalidades.
            </p>
          </div>
          
          {/* Iconos informativos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8">
            <div className="flex flex-col items-center space-y-3 p-6 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors">
              <Wrench className="h-10 w-10 text-primary" />
              <h3 className="text-lg font-medium">Actualizaciones</h3>
              <p className="text-sm text-muted-foreground text-center">
                Estamos implementando nuevas características y mejorando el rendimiento.
              </p>
            </div>
            
            <div className="flex flex-col items-center space-y-3 p-6 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors">
              <Clock className="h-10 w-10 text-secondary" />
              <h3 className="text-lg font-medium">Tiempo Estimado</h3>
              <p className="text-sm text-muted-foreground text-center">
                Sin fecha de lanzamiento.
              </p>
            </div>
            
            <div className="flex flex-col items-center space-y-3 p-6 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors">
              <div className="flex justify-center space-x-2">
                {[1, 2, 3].map((i) => (
                  <span 
                    key={i} 
                    className="block w-2 h-8 rounded-full bg-accent animate-pulse" 
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
              <h3 className="text-lg font-medium">Progreso</h3>
              <p className="text-sm text-muted-foreground text-center">
                Nuestro equipo está trabajando para volver lo antes posible.
              </p>
            </div>
          </div>
          
          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Button asChild size="lg" className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90">
              <Link href="mailto:jblancoh26@gmail.com">
                Contactar
              </Link>
            </Button>
          </div>
          
          {/* Redes sociales */}
          <div className="pt-12">
            <p className="text-sm text-muted-foreground mb-4">
              Mientras tanto, puedes seguirnos en nuestras redes sociales:
            </p>
            <div className="flex justify-center gap-6">
              <a 
                href="https://github.com/jblancoh" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                GitHub
              </a>
              <a 
                href="https://www.linkedin.com/in/barrilitodev/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-muted-foreground hover:text-secondary transition-colors"
              >
                LinkedIn
              </a>
              <a 
                href="https://twitter.com/barrilitodev" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-muted-foreground hover:text-accent transition-colors"
              >
                X
              </a>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="py-8 text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} BarrilitoDev. Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
} 