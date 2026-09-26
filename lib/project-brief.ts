/**
 * Pure model for the guided project brief ("Pedir cotización"): the answer
 * shape, validation, formatting, and the wizard's step-advance rule, plus
 * the deep-link helper a direct/shared link uses. The brief is serialized
 * into the existing contact pipeline's `subject`/`message` fields —
 * lib/contact.ts, lib/contact-submission.ts and app/actions/contact.ts stay
 * unchanged. No React/DOM dependency here on purpose, so this module stays
 * unit-testable in isolation (see project-brief.test.ts); the wizard UI
 * lives in components/game/sections/project-brief.tsx.
 *
 * Steps 2–4 depend on the service chosen in step 1: each service has its
 * own question set (label + options) for those three steps — see
 * `briefQuestionsByService` in lib/content.ts and `getBriefQuestionSet`
 * below. `ProjectBrief.answers` stores those three answers positionally
 * (`answers[0]` is step 2's answer, and so on) since their meaning varies
 * by service (e.g. Charlas y talleres' step 4 is "Honorarios", not a money
 * bracket).
 */

import { briefOptions, briefQuestionsByService, type BriefQuestionSet } from "./content"

export interface ProjectBrief {
  service: string
  /** Answers to steps 2, 3 and 4, in that order — see `getBriefQuestionSet`. */
  answers: [string, string, string]
  description: string
  name: string
  email: string
}

/** One error slot per step-2/3/4 answer, positional like `ProjectBrief.answers`. */
export type BriefAnswerErrors = [string | undefined, string | undefined, string | undefined]

export interface BriefErrors {
  service?: string
  answers?: BriefAnswerErrors
  description?: string
  name?: string
  email?: string
}

export type ValidateBriefResult = { ok: true; data: ProjectBrief } | { ok: false; errors: BriefErrors }

/** The wizard's six screens, in order (see the "What to build" spec in odd/tasks/project-brief.md). */
export type BriefStep = 1 | 2 | 3 | 4 | 5 | 6

/** Looks up the selected service's question set for steps 2–4, or `undefined` for an unrecognized service. */
export function getBriefQuestionSet(service: string): BriefQuestionSet | undefined {
  return briefQuestionsByService[service]
}

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
const ANSWER_ERROR = "Elige una opción."

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
 * Validates and normalizes a raw brief answer set. `service` must belong to
 * `briefOptions.services`; each of the three `answers` must belong to the
 * *selected service's own* question set (steps 2–4, see
 * `getBriefQuestionSet`) — an unrecognized service can't validate any
 * answer, since there's no question set to check them against.
 * name/email/description reuse lib/contact.ts's limits and Spanish error
 * messages. Every problem is reported at once, like `validateContact`.
 */
export function validateBrief(raw: Record<string, unknown>): ValidateBriefResult {
  const service = collapseWhitespace(toStringOrEmpty(raw.service))
  const rawAnswers = Array.isArray(raw.answers) ? raw.answers : []
  const answers: [string, string, string] = [
    collapseWhitespace(toStringOrEmpty(rawAnswers[0])),
    collapseWhitespace(toStringOrEmpty(rawAnswers[1])),
    collapseWhitespace(toStringOrEmpty(rawAnswers[2])),
  ]
  const description = trimOnly(toStringOrEmpty(raw.description))
  const name = collapseWhitespace(toStringOrEmpty(raw.name))
  const email = trimOnly(toStringOrEmpty(raw.email))

  const errors: BriefErrors = {}

  if (!briefOptions.services.includes(service)) {
    errors.service = "Elige qué necesitas."
  }

  const questions = getBriefQuestionSet(service)
  const answerErrors: BriefAnswerErrors = [undefined, undefined, undefined]
  if (!questions) {
    answerErrors[0] = ANSWER_ERROR
    answerErrors[1] = ANSWER_ERROR
    answerErrors[2] = ANSWER_ERROR
  } else {
    if (!questions.step2.options.includes(answers[0])) answerErrors[0] = ANSWER_ERROR
    if (!questions.step3.options.includes(answers[1])) answerErrors[1] = ANSWER_ERROR
    if (!questions.step4.options.includes(answers[2])) answerErrors[2] = ANSWER_ERROR
  }
  if (answerErrors.some((error) => error !== undefined)) {
    errors.answers = answerErrors
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

  return { ok: true, data: { service, answers, description, name, email } }
}

/**
 * Whether the wizard may leave `step` given the answers collected so far —
 * gates the "Siguiente" button in components/game/sections/project-brief.tsx.
 * Steps 2–4 check the answer against the *selected service's* own question
 * set, so switching service without a matching question set (or with none
 * selected yet) blocks every one of those steps. Step 5 (description + name
 * + email) reuses the full `validateBrief` check since every earlier field
 * is already set by then; the summary step (6) never blocks.
 */
export function canAdvanceFromStep(step: BriefStep, brief: Partial<ProjectBrief>): boolean {
  if (step === 1) return briefOptions.services.includes(brief.service ?? "")
  if (step === 5) return validateBrief(brief).ok
  if (step === 6) return true

  const questions = getBriefQuestionSet(brief.service ?? "")
  if (!questions) return false
  const answers = brief.answers ?? ["", "", ""]
  if (step === 2) return questions.step2.options.includes(answers[0] ?? "")
  if (step === 3) return questions.step3.options.includes(answers[1] ?? "")
  return questions.step4.options.includes(answers[2] ?? "")
}

/** `Cotización: <service>`, truncated (with an ellipsis) to stay within validateContact's subject limit. */
export function formatBriefSubject(brief: ProjectBrief): string {
  const subject = `Cotización: ${brief.service}`
  return subject.length > SUBJECT_MAX ? `${subject.slice(0, SUBJECT_MAX - 1)}…` : subject
}

/**
 * Readable multi-line text with every answer — under the *selected
 * service's own* message labels (e.g. "Formato: Taller práctico",
 * "Honorarios: Solo viáticos" for Charlas y talleres) — plus the free-text
 * description, capped at validateContact's message limit. Used both as the
 * email body and as the prefilled WhatsApp text (see lib/whatsapp.ts and
 * components/game/sections/project-brief.tsx).
 */
export function formatBriefMessage(brief: ProjectBrief): string {
  const questions = getBriefQuestionSet(brief.service)
  const answerLines = questions
    ? [
        `${questions.step2.messageLabel}: ${brief.answers[0]}`,
        `${questions.step3.messageLabel}: ${brief.answers[1]}`,
        `${questions.step4.messageLabel}: ${brief.answers[2]}`,
      ]
    : []
  const message = [`Servicio: ${brief.service}`, ...answerLines, "", brief.description].join("\n")
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
