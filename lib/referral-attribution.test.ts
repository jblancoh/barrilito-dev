import { describe, expect, it, vi } from "vitest"
import { trackPortfolioReferral } from "./referral-attribution"

describe("trackPortfolioReferral", () => {
  it("tracks one event with only a safe client source identifier", () => {
    const sendEvent = vi.fn()

    trackPortfolioReferral("?utm_source=acme-studio&utm_medium=referral&utm_campaign=credit-banner", true, sendEvent)

    expect(sendEvent).toHaveBeenCalledTimes(1)
    expect(sendEvent).toHaveBeenCalledWith("portfolio_referral", { client: "acme-studio" })
  })

  it.each([
    ["missing source", "?utm_medium=referral&utm_campaign=credit-banner"],
    ["wrong medium", "?utm_source=acme-studio&utm_medium=social&utm_campaign=credit-banner"],
    ["wrong campaign", "?utm_source=acme-studio&utm_medium=referral&utm_campaign=other"],
    ["unsafe source", "?utm_source=Acme%20Studio&utm_medium=referral&utm_campaign=credit-banner"],
    ["duplicate source", "?utm_source=acme&utm_source=other&utm_medium=referral&utm_campaign=credit-banner"],
  ])("does not track for %s", (_reason, search) => {
    const sendEvent = vi.fn()

    trackPortfolioReferral(search, true, sendEvent)

    expect(sendEvent).not.toHaveBeenCalled()
  })

  it("does not track while the feature flag is disabled", () => {
    const sendEvent = vi.fn()

    trackPortfolioReferral("?utm_source=acme-studio&utm_medium=referral&utm_campaign=credit-banner", false, sendEvent)

    expect(sendEvent).not.toHaveBeenCalled()
  })
})
