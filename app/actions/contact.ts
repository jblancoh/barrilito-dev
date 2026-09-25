"use server"

import { headers } from "next/headers"
import { createRateLimiter, type RateLimiter } from "@/lib/contact"
import {
  CONTACT_RATE_LIMIT,
  CONTACT_RATE_LIMIT_WINDOW_MS,
  handleContactSubmission,
  type ContactFormState,
} from "@/lib/contact-submission"
import { sendWithResend } from "@/lib/resend"

const DEFAULT_FROM_EMAIL = "BarrilitoDev <contacto@send.barrilito.dev>"

/**
 * Module-scope rate limiter: best-effort only, since each Vercel Fluid
 * Compute instance keeps its own in-memory state (see lib/contact.ts).
 */
const rateLimiter: RateLimiter = createRateLimiter({
  limit: CONTACT_RATE_LIMIT,
  windowMs: CONTACT_RATE_LIMIT_WINDOW_MS,
})

/** First entry of `x-forwarded-for`, else `x-real-ip`, else "unknown". */
function resolveClientKey(): string {
  const headerList = headers()

  const forwardedFor = headerList.get("x-forwarded-for")
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim()
    if (first) return first
  }

  const realIp = headerList.get("x-real-ip")
  if (realIp) return realIp

  return "unknown"
}

/**
 * Server Action bound to the contact form via `useFormState`. Thin adapter
 * only: reads env config and the request's IP, then delegates every
 * decision to the pure `handleContactSubmission` orchestrator.
 */
export async function sendContactMessage(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const fields = {
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
    website: formData.get("website"),
    startedAt: formData.get("startedAt"),
  }

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.CONTACT_FROM_EMAIL ?? DEFAULT_FROM_EMAIL
  const to = process.env.CONTACT_TO_EMAIL

  return handleContactSubmission(fields, {
    now: Date.now(),
    clientKey: resolveClientKey(),
    rateLimiter,
    send: (email) => sendWithResend(email, { apiKey: apiKey ?? "" }),
    config: { from, to, apiKeyPresent: Boolean(apiKey) },
  })
}
