import { NextRequest } from "next/server"
import { afterEach, describe, expect, it, vi } from "vitest"
import { MAINTENANCE_RETRY_AFTER_SECONDS } from "./lib/maintenance"
import { proxy } from "./proxy"

function request(path: string): NextRequest {
  return new NextRequest(new URL(path, "https://barrilito.dev"))
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("proxy", () => {
  describe("in maintenance mode", () => {
    it("rewrites pages to /maintenance as a 503 with Retry-After", () => {
      vi.stubEnv("NEXT_PUBLIC_MAINTENANCE_MODE", "true")
      const response = proxy(request("/"))

      expect(response.status).toBe(503)
      expect(response.headers.get("retry-after")).toBe(String(MAINTENANCE_RETRY_AFTER_SECONDS))
      expect(response.headers.get("x-middleware-rewrite")).toBe("https://barrilito.dev/maintenance")
    })

    it("lets /maintenance through untouched", () => {
      vi.stubEnv("NEXT_PUBLIC_MAINTENANCE_MODE", "true")
      const response = proxy(request("/maintenance"))

      expect(response.status).toBe(200)
      expect(response.headers.get("x-middleware-next")).toBe("1")
    })
  })

  describe("outside maintenance mode", () => {
    it("lets pages through", () => {
      vi.stubEnv("NEXT_PUBLIC_MAINTENANCE_MODE", "false")
      const response = proxy(request("/"))

      expect(response.headers.get("x-middleware-next")).toBe("1")
      expect(response.headers.get("x-middleware-rewrite")).toBeNull()
    })

    it("redirects /maintenance back home", () => {
      vi.stubEnv("NEXT_PUBLIC_MAINTENANCE_MODE", "false")
      const response = proxy(request("/maintenance"))

      expect(response.status).toBe(307)
      expect(response.headers.get("location")).toBe("https://barrilito.dev/")
    })
  })
})
