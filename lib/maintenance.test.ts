import { describe, expect, it } from "vitest"
import { MAINTENANCE_PATH, MAINTENANCE_RETRY_AFTER_SECONDS, resolveMaintenanceAction } from "./maintenance"

describe("resolveMaintenanceAction", () => {
  describe("while maintenance mode is on", () => {
    it("serves the maintenance page on the requested URL as a 503, so crawlers retry instead of deindexing", () => {
      expect(resolveMaintenanceAction("/", true)).toEqual({
        type: "rewrite",
        destination: MAINTENANCE_PATH,
        status: 503,
        retryAfterSeconds: MAINTENANCE_RETRY_AFTER_SECONDS,
      })
    })

    it("does the same for any other page", () => {
      expect(resolveMaintenanceAction("/some/page", true)).toMatchObject({ type: "rewrite", status: 503 })
    })

    it("lets /maintenance itself through", () => {
      expect(resolveMaintenanceAction(MAINTENANCE_PATH, true)).toEqual({ type: "next" })
    })
  })

  describe("while maintenance mode is off", () => {
    it("lets pages through", () => {
      expect(resolveMaintenanceAction("/", false)).toEqual({ type: "next" })
    })

    it("sends stale /maintenance visits back home", () => {
      expect(resolveMaintenanceAction(MAINTENANCE_PATH, false)).toEqual({ type: "redirect", destination: "/" })
    })
  })

  it("asks crawlers to come back within the hour", () => {
    expect(MAINTENANCE_RETRY_AFTER_SECONDS).toBe(3600)
  })
})
