/**
 * Pure orchestrator for a contact form submission: wires together the
 * anti-spam heuristic, validation, rate limiting, and email delivery from
 * lib/contact.ts, but stays free of React/Next/Resend imports so it can be
 * unit-tested with fully injected dependencies (see contact-submission.test.ts).
 * The thin adapters that provide those real dependencies live in
 * app/actions/contact.ts (Server Action) and lib/resend.ts (Resend REST API).
 */

import { formatContactEmail, isLikelySpam, validateContact, type ContactField, type RateLimiter } from "./contact"

export type ContactFormStatus = "idle" | "success" | "error"

export interface ContactFormState {
  status: ContactFormStatus
  message?: string
  errors?: Partial<Record<ContactField, string>>
}

export const initialContactFormState: ContactFormState = { status: "idle" }

/** Best-effort per-key limit: at most this many submissions per window (see lib/contact.ts's caveats). */
export const CONTACT_RATE_LIMIT = 5
export const CONTACT_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000

/** The shape every send adapter (e.g. lib/resend.ts) must accept. */
export interface OutgoingEmail {
  from: string
  to: string
  replyTo: string
  subject: string
  text: string
}

export interface ContactSubmissionConfig {
  from?: string
  to?: string
  apiKeyPresent: boolean
}

export interface ContactSubmissionDeps {
  /** Current time (ms), passed explicitly so this stays pure and testable. */
  now: number
  /** Rate-limiter key for this submitter, e.g. an IP address. */
  clientKey: string
  rateLimiter: RateLimiter
  send: (email: OutgoingEmail) => Promise<{ ok: boolean }>
  config: ContactSubmissionConfig
}

const SUCCESS_STATE: ContactFormState = {
  status: "success",
  message: "¡Gracias por tu mensaje! Te responderé pronto.",
}

const VALIDATION_ERROR_MESSAGE = "Revisa los campos marcados."
const RATE_LIMIT_ERROR_MESSAGE = "Demasiados mensajes. Intenta de nuevo en unos minutos."
const SEND_ERROR_MESSAGE = "No se pudo enviar el mensaje. Intenta de nuevo más tarde."

/**
 * Handles one raw contact form submission end to end. Order matters:
 * spam check (silently short-circuits with the same success response a real
 * send would get, so bots learn nothing) → field validation → rate limit →
 * delivery config check → send. Never throws: every failure path resolves
 * to a friendly, Spanish `ContactFormState`.
 */
export async function handleContactSubmission(
  fields: Record<string, unknown>,
  deps: ContactSubmissionDeps,
): Promise<ContactFormState> {
  if (isLikelySpam({ honeypot: fields.website, startedAt: fields.startedAt, now: deps.now })) {
    return SUCCESS_STATE
  }

  const validation = validateContact(fields)
  if (!validation.ok) {
    return { status: "error", message: VALIDATION_ERROR_MESSAGE, errors: validation.errors }
  }

  if (!deps.rateLimiter.check(deps.clientKey, deps.now)) {
    return { status: "error", message: RATE_LIMIT_ERROR_MESSAGE }
  }

  const { from, to, apiKeyPresent } = deps.config
  if (!apiKeyPresent || !from || !to) {
    console.error(
      "Contact form: missing Resend configuration (RESEND_API_KEY, CONTACT_FROM_EMAIL, or CONTACT_TO_EMAIL).",
    )
    return { status: "error", message: SEND_ERROR_MESSAGE }
  }

  const { subject, text } = formatContactEmail(validation.data)

  try {
    const result = await deps.send({ from, to, replyTo: validation.data.email, subject, text })
    if (!result.ok) {
      return { status: "error", message: SEND_ERROR_MESSAGE }
    }
  } catch (error) {
    console.error("Contact form: sending via Resend threw an error.", error)
    return { status: "error", message: SEND_ERROR_MESSAGE }
  }

  return SUCCESS_STATE
}
