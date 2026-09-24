import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { skills } from "@/lib/content"

export function SkillsSection() {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="text-4xl font-bold leading-[1.1] tracking-tight">Mis Habilidades</h2>
        <p className="mt-3 text-xl text-muted-foreground">Tecnologías y herramientas que domino</p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-4">
        {skills.map((skill) => (
          <Card key={skill.title} className="overflow-hidden border-none">
            <CardHeader className={`gap-2 rounded-t-lg pb-2 ${skill.bgClass}`}>
              <skill.icon className={`h-9 w-9 ${skill.colorClass}`} />
              <CardTitle className="text-base">{skill.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{skill.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
