import type { StopKey } from "./board-config"
import type { BoardNav } from "./board-nav"
import { AboutSection } from "./sections/about"
import { SkillsSection } from "./sections/skills"
import { ProjectsSection } from "./sections/projects"
import { ServicesSection } from "./sections/services"
import { ContactInfoSection } from "./sections/contact-info"
import { ContactFormSection } from "./sections/contact-form"

/**
 * Maps a stop key to its section component. Shared by the interactive
 * three.js board (board-game.tsx) and the classic scrollable home
 * (seo-fallback.tsx) so both render the exact same content — no three.js
 * or DOM dependency here, safe to import from either.
 */
export function renderSection(key: StopKey, nav: BoardNav) {
  switch (key) {
    case "about":
      return <AboutSection nav={nav} />
    case "skills":
      return <SkillsSection />
    case "projects":
      return <ProjectsSection nav={nav} />
    case "services":
      return <ServicesSection nav={nav} />
    case "info":
      return <ContactInfoSection nav={nav} />
    case "contact":
      return <ContactFormSection nav={nav} />
  }
}
