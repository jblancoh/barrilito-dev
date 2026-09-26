import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { pillars, tools } from "@/lib/content"

export function SkillsSection() {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="text-4xl font-bold leading-[1.1] tracking-tight">Cómo trabajo</h2>
        <p className="mt-3 text-xl text-muted-foreground">
          No es una lista de tecnologías: es cómo llevo un producto de la idea a producción.
        </p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
        {pillars.map((pillar) => (
          <Card key={pillar.title} className="border-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{pillar.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{pillar.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex flex-col gap-2 border-t pt-6">
        <h3 className="text-sm font-medium text-muted-foreground">Herramientas con las que construyo</h3>
        <div className="flex flex-wrap gap-2">
          {tools.map((tool) => (
            <Badge key={tool} variant="outline">
              {tool}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  )
}
