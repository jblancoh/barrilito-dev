/**
 * Tiny module-level store for the contact section's mode ("Pedir
 * cotización" vs. "Mensaje libre"), shared across every mounted
 * ContactFormSection instance. This is required, not a style choice: the
 * classic home keeps its own instance of every section mounted at all
 * times (just visually hidden with `sr-only`, see seo-fallback.tsx) even
 * while the 3D board is the one actually shown, so plain per-component
 * `useState` would give each render mode its own independent mode — the
 * Services section's "Cotiza tu proyecto" CTA (see sections/services.tsx)
 * needs to flip whichever instance the visitor ends up looking at, board
 * or lite, without racing against which one mounts or reacts first. A
 * direct `?brief=1#contact` link is read the same way: whichever
 * ContactFormSection mounts first consumes (strips) the flag, and the
 * shared store already holds the result for every other instance
 * regardless of mount order.
 *
 * Defaults to "brief" (owner decision, T5 in odd/tasks/project-brief.md):
 * `ContactFormSection`'s `useSyncExternalStore` server snapshot must return
 * the same "brief" literal, or the server-rendered HTML and the first
 * client render would disagree and React would report a hydration
 * mismatch (see components/game/sections/contact-form.tsx).
 *
 * No window/DOM dependency here on purpose, so this module stays
 * unit-testable in isolation (see contact-mode-store.test.ts); components
 * subscribe via React's `useSyncExternalStore` (see
 * components/game/sections/contact-form.tsx).
 */

export type ContactMode = "message" | "brief"

let mode: ContactMode = "brief"
const listeners = new Set<() => void>()

export function getContactMode(): ContactMode {
  return mode
}

export function setContactMode(next: ContactMode): void {
  if (mode === next) return
  mode = next
  listeners.forEach((listener) => listener())
}

export function subscribeContactMode(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
