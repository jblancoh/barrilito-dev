import { HeroSection } from "@/components/hero-section"
import { ProjectsSection } from "@/components/projects-section"
import { SkillsSection } from "@/components/skills-section"
import { ContactSection } from "@/components/contact-section"

export default function Home() {
  return (
    <div className="container mx-auto px-4">
      <HeroSection />
      <SkillsSection />
      <ProjectsSection />
      <ContactSection />
    </div>
  )
}

