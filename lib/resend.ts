/**
 * Thin Resend REST API adapter: posts directly to https://api.resend.com/emails
 * via `fetch`, with no `resend` npm package and no Vercel Marketplace
 * dependency. This is the concrete implementation of the `send` port that
 * lib/contact-submission.ts's pure orchestrator depends on.
 */

import type { OutgoingEmail } from "./contact-submission"

export interface SendWithResendOptions {
  apiKey: string
  fetchImpl?: typeof fetch
}

const RESEND_ENDPOINT = "https://api.resend.com/emails"
/** Caps how much of a failed response body we log, to keep logs readable. */
const ERROR_BODY_MAX_CHARS = 500

/**
 * Sends one email through the Resend REST API. Never logs the API key —
 * only the resulting HTTP status and a truncated response body on failure.
 * A `fetchImpl` rejection (e.g. a network error) propagates to the caller
 * as a rejected promise; only a non-ok HTTP response is handled here,
 * resolving to `{ ok: false }` instead of throwing.
 */
export async function sendWithResend(
  email: OutgoingEmail,
  { apiKey, fetchImpl = fetch }: SendWithResendOptions,
): Promise<{ ok: boolean }> {
  const res = await fetchImpl(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: email.from,
      to: [email.to],
      reply_to: email.replyTo,
      subject: email.subject,
      text: email.text,
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    console.error(`Resend request failed with status ${res.status}: ${body.slice(0, ERROR_BODY_MAX_CHARS)}`)
  }

  return { ok: res.ok }
}
