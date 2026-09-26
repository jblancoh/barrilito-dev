/**
 * Pure helpers for building a `wa.me` deep link from a phone number, so the
 * contact section never hardcodes WhatsApp URL formatting. No React/DOM
 * dependency — safe to unit test in isolation (see whatsapp.test.ts).
 */

/** Strips everything but digits, e.g. "+52 993 360 0042" -> "529933600042". */
export function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, "")
}

/**
 * Builds a `https://wa.me/<digits>` URL, optionally with a prefilled,
 * URL-encoded message. The phone number itself never needs to be displayed
 * anywhere in the UI — only this link. Throws when the phone has no digits,
 * so bad contact data fails loudly instead of opening a chat with no recipient.
 */
export function buildWhatsAppUrl(phone: string, message?: string): string {
  const digits = digitsOnly(phone)
  if (!digits) throw new Error(`Invalid WhatsApp phone: "${phone}" has no digits`)
  const base = `https://wa.me/${digits}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}
