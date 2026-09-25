/**
 * Pure helpers for the contact form: input validation/normalization,
 * anti-spam heuristics (honeypot + minimum fill time), a best-effort
 * per-key rate limiter, and plain-text email formatting. No React,
 * Resend, or Next imports here on purpose, so this module stays
 * unit-testable in isolation (see contact.test.ts); the Server Action
 * that actually sends the email lives in app/actions/contact.ts.
 */

export const CONTACT_FIELDS = ["name", "email", "subject", "message"] as const

export type ContactField = (typeof CONTACT_FIELDS)[number]

export interface ContactInput {
  name: string
  email: string
  subject: string
  message: string
}

export type ValidateContactResult =
  | { ok: true; data: ContactInput }
  | { ok: false; errors: Partial<Record<ContactField, string>> }

const NAME_MIN = 2
const NAME_MAX = 100
const EMAIL_MAX = 254
const SUBJECT_MIN = 3
const SUBJECT_MAX = 150
const MESSAGE_MIN = 10
const MESSAGE_MAX = 5000

// Pragmatic email check: exactly one "@", a non-empty local part, a domain
// with at least one dot, and no whitespace anywhere. Not a full RFC 5322
// validator on purpose — this only guards against obviously-broken input.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Non-string values (missing fields, numbers, arrays, null, ...) count as empty. */
function toStringOrEmpty(value: unknown): string {
  return typeof value === "string" ? value : ""
}

/**
 * Collapses CR/LF and runs of whitespace into single spaces, then trims.
 * Used for `name` and `subject`, which flow into an email header
 * (`Subject:`) or are shown as a single line — stripping embedded newlines
 * prevents header injection and keeps the display tidy.
 */
function collapseWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ")
}

/** Trims a field but preserves internal newlines (used for `message` and `email`). */
function trimOnly(value: string): string {
  return value.trim()
}

/**
 * Validates and normalizes a raw contact form payload. Returns the
 * normalized data on success, or one Spanish error message per invalid
 * field (all fields are checked; the caller sees every problem at once).
 */
export function validateContact(raw: Record<string, unknown>): ValidateContactResult {
  const name = collapseWhitespace(toStringOrEmpty(raw.name))
  const email = trimOnly(toStringOrEmpty(raw.email))
  const subject = collapseWhitespace(toStringOrEmpty(raw.subject))
  const message = trimOnly(toStringOrEmpty(raw.message))

  const errors: Partial<Record<ContactField, string>> = {}

  if (name.length < NAME_MIN || name.length > NAME_MAX) {
    errors.name = "Escribe tu nombre."
  }

  if (email.length === 0 || email.length > EMAIL_MAX || !EMAIL_PATTERN.test(email)) {
    errors.email = "Ingresa un email válido."
  }

  if (subject.length < SUBJECT_MIN) {
    errors.subject = "Escribe un asunto."
  } else if (subject.length > SUBJECT_MAX) {
    errors.subject = "El asunto es demasiado largo."
  }

  if (message.length < MESSAGE_MIN) {
    errors.message = "El mensaje debe tener al menos 10 caracteres."
  } else if (message.length > MESSAGE_MAX) {
    errors.message = "El mensaje es demasiado largo."
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors }
  }

  return { ok: true, data: { name, email, subject, message } }
}

export interface SpamCheckInput {
  /** The hidden honeypot field's raw value; bots that fill every field trip this. */
  honeypot: unknown
  /** Timestamp (ms) recorded when the form was rendered, as sent back by the client. */
  startedAt: unknown
  /** Current server time (ms), passed in explicitly so this stays pure and testable. */
  now: number
  /** Minimum time (ms) a human plausibly needs to fill the form. Defaults to 3000. */
  minFillMs?: number
}

const DEFAULT_MIN_FILL_MS = 3000

/** Accepts a finite number, or a numeric string, and returns it as a number; otherwise null. */
function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

/**
 * Cheap anti-spam heuristic: true when the submission looks automated.
 * Trips when the honeypot field was filled, when `startedAt` is missing,
 * not a finite (or numeric-string) timestamp, set in the future, or the
 * form was submitted faster than `minFillMs` after it was rendered.
 */
export function isLikelySpam(input: SpamCheckInput): boolean {
  const honeypotValue = typeof input.honeypot === "string" ? input.honeypot.trim() : ""
  if (honeypotValue.length > 0) return true

  const startedAt = toFiniteNumber(input.startedAt)
  if (startedAt === null) return true
  if (startedAt > input.now) return true

  const minFillMs = input.minFillMs ?? DEFAULT_MIN_FILL_MS
  return input.now - startedAt < minFillMs
}

export interface RateLimiterOptions {
  /** Maximum allowed hits per key within one window. */
  limit: number
  /** Window length in milliseconds. */
  windowMs: number
}

export interface RateLimiter {
  /** Records one hit for `key` at `now`; returns false once `limit` is reached within the window. */
  check(key: string, now: number): boolean
}

/** Above this many tracked keys, a check also sweeps expired entries before recording its hit. */
const PRUNE_SIZE_THRESHOLD = 1000

interface RateLimiterEntry {
  count: number
  windowStart: number
}

/**
 * Creates a fixed-window rate limiter keyed by an arbitrary string (e.g.
 * an IP address). Best-effort and per-process/per-instance only: it is
 * plain in-memory state, so it does not coordinate across Vercel Fluid
 * Compute instances, which do not share memory. Good enough as a first
 * line of defense against casual abuse; a distributed store (e.g.
 * Upstash) would be needed for accurate global rate limiting.
 */
export function createRateLimiter({ limit, windowMs }: RateLimiterOptions): RateLimiter {
  const hits = new Map<string, RateLimiterEntry>()

  function prune(now: number): void {
    for (const [key, entry] of Array.from(hits.entries())) {
      if (now - entry.windowStart >= windowMs) {
        hits.delete(key)
      }
    }
  }

  return {
    check(key: string, now: number): boolean {
      if (hits.size > PRUNE_SIZE_THRESHOLD) {
        prune(now)
      }

      const entry = hits.get(key)
      if (!entry || now - entry.windowStart >= windowMs) {
        hits.set(key, { count: 1, windowStart: now })
        return true
      }

      if (entry.count >= limit) {
        return false
      }

      entry.count += 1
      return true
    },
  }
}

/** Builds the plain-text email sent to the site owner for one contact submission. */
export function formatContactEmail(data: ContactInput): { subject: string; text: string } {
  const subject = `[barrilito.dev] ${data.subject}`
  const text = [`Nombre: ${data.name}`, `Email: ${data.email}`, `Asunto: ${data.subject}`, "", data.message].join(
    "\n",
  )
  return { subject, text }
}
