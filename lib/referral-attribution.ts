const REFERRAL_MEDIUM = "referral"
const REFERRAL_CAMPAIGN = "credit-banner"
const SAFE_CLIENT_SOURCE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const MAX_CLIENT_SOURCE_LENGTH = 64

export type ReferralEventSender = (eventName: string, properties: { client: string }) => void

/** Returns the one approved source identifier from a client credit-banner URL, or null. */
export function parseReferralClient(search: string): string | null {
  const params = new URLSearchParams(search)
  const sources = params.getAll("utm_source")
  const mediums = params.getAll("utm_medium")
  const campaigns = params.getAll("utm_campaign")

  if (sources.length !== 1 || mediums.length !== 1 || campaigns.length !== 1) return null

  const [source] = sources
  if (
    source.length > MAX_CLIENT_SOURCE_LENGTH ||
    !SAFE_CLIENT_SOURCE.test(source) ||
    mediums[0] !== REFERRAL_MEDIUM ||
    campaigns[0] !== REFERRAL_CAMPAIGN
  ) {
    return null
  }

  return source
}

/** Emits only the validated client slug; all other query values are deliberately ignored. */
export function trackPortfolioReferral(
  search: string,
  enabled: boolean,
  sendEvent: ReferralEventSender,
): void {
  if (!enabled) return

  const client = parseReferralClient(search)
  if (client) sendEvent("portfolio_referral", { client })
}
