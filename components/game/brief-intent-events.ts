/**
 * A tiny event so the Services section's "Cotiza tu proyecto" CTA can ask an
 * already-mounted contact section to switch into brief mode immediately.
 * Needed because lite mode keeps every section mounted at once (see
 * seo-fallback.tsx), so `nav.goTo` only scrolls the contact section into
 * view instead of remounting it. The board's own ContactFormSection
 * instance doesn't need this event: it mounts fresh only once the board
 * reaches the "contact" stop, and picks up the deep link from the
 * `?brief=1` query param instead (see lib/project-brief.ts's
 * hasBriefIntent/withBriefIntent). Mirrors board-events.ts's event-bus
 * pattern, used there for the navbar-to-board "goTo" ask.
 */

const OPEN_BRIEF_EVENT = "projectbrief:open"

export function dispatchOpenBrief(): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(OPEN_BRIEF_EVENT))
}

export function onOpenBrief(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {}
  window.addEventListener(OPEN_BRIEF_EVENT, handler)
  return () => window.removeEventListener(OPEN_BRIEF_EVENT, handler)
}
