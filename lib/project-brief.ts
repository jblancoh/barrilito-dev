/**
 * Pure model for the guided project brief ("Arma tu brief"): the answer
 * shape, validation, formatting, and the wizard's step-advance rule, plus
 * the deep-link helpers the "Cotiza tu proyecto" CTA uses (see
 * components/game/sections/services.tsx). The brief is serialized into the
 * existing contact pipeline's `subject`/`message` fields — lib/contact.ts,
 * lib/contact-submission.ts and app/actions/contact.ts stay unchanged. No
 * React/DOM dependency here on purpose, so this module stays unit-testable
 * in isolation (see project-brief.test.ts); the wizard UI lives in
 * components/game/sections/project-brief.tsx.
 */

import { briefOptions } from "./content"

export interface ProjectBrief {
  service: string
  stage: string
  timeline: string
  budget: string
  description: string
  name: string
  email: string
}

export type BriefField = keyof ProjectBrief

export type ValidateBriefResult =
  | { ok: true; data: ProjectBrief }
  | { ok: false; errors: Partial<Record<BriefField, string>> }

/** The wizard's six screens, in order (see the "What to build" spec in odd/tasks/project-brief.md). */
export type BriefStep = 1 | 2 | 3 | 4 | 5 | 6

// Kept numerically in sync with lib/contact.ts's own limits on purpose: that
// module's surface must stay unchanged, since the brief's name/email
// ultimately flow through the same validateContact call inside
// handleContactSubmission once the wizard submits.
const NAME_MIN = 2
const NAME_MAX = 100
const EMAIL_MAX = 254
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DESCRIPTION_MIN = 10
const DESCRIPTION_MAX = 4000
const SUBJECT_MAX = 150
const MESSAGE_MAX = 5000

/** Non-string values (missing fields, numbers, arrays, null, ...) count as empty. */
function toStringOrEmpty(value: unknown): string {
  return typeof value === "string" ? value : ""
}

/** Collapses CR/LF and runs of whitespace into single spaces, then trims (single-line fields). */
function collapseWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ")
}

/** Trims a field but preserves internal newlines (the free-text description). */
function trimOnly(value: string): string {
  return value.trim()
}

/**
 * Validates and normalizes a raw brief answer set. Every pick-list field
 * (service/stage/timeline/budget) must belong to the matching
 * `briefOptions` list; name/email/description reuse lib/contact.ts's
 * limits and Spanish error messages. Every problem is reported at once,
 * like `validateContact`.
 */
export function validateBrief(raw: Record<string, unknown>): ValidateBriefResult {
  const service = collapseWhitespace(toStringOrEmpty(raw.service))
  const stage = collapseWhitespace(toStringOrEmpty(raw.stage))
  const timeline = collapseWhitespace(toStringOrEmpty(raw.timeline))
  const budget = collapseWhitespace(toStringOrEmpty(raw.budget))
  const description = trimOnly(toStringOrEmpty(raw.description))
  const name = collapseWhitespace(toStringOrEmpty(raw.name))
  const email = trimOnly(toStringOrEmpty(raw.email))

  const errors: Partial<Record<BriefField, string>> = {}

  if (!briefOptions.services.includes(service)) {
    errors.service = "Elige qué necesitas."
  }
  if (!briefOptions.stages.includes(stage)) {
    errors.stage = "Elige en qué etapa estás."
  }
  if (!briefOptions.timelines.includes(timeline)) {
    errors.timeline = "Elige para cuándo lo necesitas."
  }
  if (!briefOptions.budgets.includes(budget)) {
    errors.budget = "Elige un presupuesto aproximado."
  }

  if (description.length < DESCRIPTION_MIN) {
    errors.description = "Cuéntame un poco más de tu proyecto."
  } else if (description.length > DESCRIPTION_MAX) {
    errors.description = "La descripción es demasiado larga."
  }

  if (name.length < NAME_MIN || name.length > NAME_MAX) {
    errors.name = "Escribe tu nombre."
  }

  if (email.length === 0 || email.length > EMAIL_MAX || !EMAIL_PATTERN.test(email)) {
    errors.email = "Ingresa un email válido."
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors }
  }

  return { ok: true, data: { service, stage, timeline, budget, description, name, email } }
}

/**
 * Whether the wizard may leave `step` given the answers collected so far —
 * gates the "Siguiente" button in components/game/sections/project-brief.tsx.
 * Step 5 (description + name + email) reuses the full `validateBrief` check
 * since every earlier field is already set by then; the summary step (6)
 * never blocks.
 */
export function canAdvanceFromStep(step: BriefStep, brief: Partial<ProjectBrief>): boolean {
  if (step === 1) return briefOptions.services.includes(brief.service ?? "")
  if (step === 2) return briefOptions.stages.includes(brief.stage ?? "")
  if (step === 3) return briefOptions.timelines.includes(brief.timeline ?? "")
  if (step === 4) return briefOptions.budgets.includes(brief.budget ?? "")
  if (step === 5) return validateBrief(brief).ok
  return true
}

/** `Brief: <service>`, truncated (with an ellipsis) to stay within validateContact's subject limit. */
export function formatBriefSubject(brief: ProjectBrief): string {
  const subject = `Brief: ${brief.service}`
  return subject.length > SUBJECT_MAX ? `${subject.slice(0, SUBJECT_MAX - 1)}…` : subject
}

/**
 * Readable multi-line text with every pick-list answer plus the free-text
 * description, capped at validateContact's message limit. Used both as the
 * email body and as the prefilled WhatsApp text (see lib/whatsapp.ts and
 * components/game/sections/project-brief.tsx).
 */
export function formatBriefMessage(brief: ProjectBrief): string {
  const message = [
    `Servicio: ${brief.service}`,
    `Etapa: ${brief.stage}`,
    `Para cuándo: ${brief.timeline}`,
    `Presupuesto aproximado: ${brief.budget}`,
    "",
    brief.description,
  ].join("\n")
  return message.length > MESSAGE_MAX ? message.slice(0, MESSAGE_MAX) : message
}

// ---------------------------------------------------------------------------
// Brief-mode deep-link helper: lets a direct `?brief=1#contact` link (or a
// stale one left in the address bar) open the contact section straight into
// brief mode, the same way `?mode=` already overrides the render mode (see
// components/game/render-mode.ts). The Services section's "Cotiza tu
// proyecto" CTA itself no longer needs this — it flips the shared
// contact-mode store directly (see components/game/contact-mode-store.ts)
// — but a mounting ContactFormSection still checks the URL for a
// bookmarked/shared link. Kept pure/URL-based so it stays unit-testable
// without a DOM (see lib/share.ts for the equivalent pattern with stop
// hashes).

const BRIEF_INTENT_PARAM = "brief"

/** Whether `search` (e.g. `location.search`, with or without the leading "?") carries the brief-mode flag. */
export function hasBriefIntent(search: string): boolean {
  return new URLSearchParams(search).get(BRIEF_INTENT_PARAM) === "1"
}

/** Removes the brief-mode flag from `href`, e.g. once the contact section has consumed it. */
export function withoutBriefIntent(href: string): string {
  const url = new URL(href)
  url.searchParams.delete(BRIEF_INTENT_PARAM)
  return `${url.pathname}${url.search}${url.hash}`
}
