import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { skills } from "@/lib/content"

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
              <div className="mb-2">
                <skill.icon className={`h-10 w-10 ${skill.colorClass}`} />
              </div>
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
