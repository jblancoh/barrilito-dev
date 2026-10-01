"use client"

import { track } from "@vercel/analytics"
import { useEffect, useRef } from "react"
import { trackPortfolioReferral } from "@/lib/referral-attribution"

let trackedReferralForPageLoad = false

export function ReferralAttributionTracker({ enabled }: { enabled: boolean }) {
  const effectHasRun = useRef(false)

  useEffect(() => {
    if (effectHasRun.current || trackedReferralForPageLoad) return
    effectHasRun.current = true
    trackedReferralForPageLoad = true

    trackPortfolioReferral(window.location.search, enabled, track)
  }, [enabled])

  return null
}
