import { STOPS } from "./board-config"
import { contactInfo, projects, services, skills, socialLinks } from "@/lib/content"

/**
 * The interactive board is a client-only three.js scene (next/dynamic,
 * ssr:false) and never appears in the server-rendered HTML. This component
 * renders every section's real content, in the same DOM order as the board's
 * stops, so crawlers and screen readers relying on the static markup still
 * see the full page content. Visually hidden (`sr-only`) on capable browsers.
 */
export function SeoFallback() {
  return (
    <div className="sr-only">
      <section aria-label={STOPS[0].label}>
        <h1>Hola, soy BarrilitoDev</h1>
        <p>
          Desarrollador web especializado en React, Next.js, Nest.js, Firebase y JavaScript. Creando experiencias
          digitales excepcionales.
        </p>
        <ul>
          <li>
            <a href={socialLinks.github}>GitHub</a>
          </li>
          <li>
            <a href={socialLinks.linkedin}>LinkedIn</a>
          </li>
          <li>
            <a href={socialLinks.twitter}>Twitter</a>
          </li>
        </ul>
      </section>

      <section aria-label={STOPS[1].label}>
        <h2>Mis Habilidades</h2>
        <ul>
          {skills.map((skill) => (
            <li key={skill.title}>
              <strong>{skill.title}</strong>: {skill.description}
            </li>
          ))}
        </ul>
      </section>

      <section aria-label={STOPS[2].label}>
        <h2>Mis Proyectos</h2>
        <ul>
          {projects.map((project) => (
            <li key={project.title}>
              <strong>{project.title}</strong>: {project.description} ({project.tags.join(", ")})
            </li>
          ))}
        </ul>
      </section>

      <section aria-label={STOPS[3].label}>
        <h2>Servicios</h2>
        <ul>
          {services.map((service) => (
            <li key={service.title}>{service.title}</li>
          ))}
        </ul>
      </section>

      <section aria-label={STOPS[4].label}>
        <h2>Información de contacto</h2>
        <p>Email: {contactInfo.email}</p>
        <p>Teléfono: {contactInfo.phone}</p>
        <p>Ubicación: {contactInfo.location}</p>
        <ul>
          {contactInfo.schedule.map((slot) => (
            <li key={slot.days}>
              {slot.days}: {slot.hours}
            </li>
          ))}
        </ul>
      </section>

      <section aria-label={STOPS[5].label}>
        <h2>Contacto</h2>
        <p>¿Tienes un proyecto en mente? ¡Hablemos! Escribe a {contactInfo.email}.</p>
      </section>
    </div>
  )
}
