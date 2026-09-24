import { describe, expect, it } from "vitest"
import { resolveSiteUrl } from "./site-url"

describe("resolveSiteUrl", () => {
  it("uses NEXT_PUBLIC_SITE_URL when it is a valid absolute URL", () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://barrilito.dev" }).toString()).toBe(
      "https://barrilito.dev/",
    )
  })

  it("tolerates a trailing slash on NEXT_PUBLIC_SITE_URL", () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://barrilito.dev/" }).toString()).toBe(
      "https://barrilito.dev/",
    )
  })

  it("prefers NEXT_PUBLIC_SITE_URL over the Vercel system env vars", () => {
    expect(
      resolveSiteUrl({
        NEXT_PUBLIC_SITE_URL: "https://barrilito.dev",
        VERCEL_PROJECT_PRODUCTION_URL: "project.vercel.app",
        VERCEL_URL: "project-git-branch.vercel.app",
      }).toString(),
    ).toBe("https://barrilito.dev/")
  })

  it("falls back to VERCEL_PROJECT_PRODUCTION_URL when NEXT_PUBLIC_SITE_URL is unset", () => {
    expect(
      resolveSiteUrl({
        VERCEL_PROJECT_PRODUCTION_URL: "barrilito.vercel.app",
        VERCEL_URL: "barrilito-git-branch.vercel.app",
      }).toString(),
    ).toBe("https://barrilito.vercel.app/")
  })

  it("falls back to VERCEL_URL when neither NEXT_PUBLIC_SITE_URL nor VERCEL_PROJECT_PRODUCTION_URL is set", () => {
    expect(resolveSiteUrl({ VERCEL_URL: "barrilito-git-branch.vercel.app" }).toString()).toBe(
      "https://barrilito-git-branch.vercel.app/",
    )
  })

  it("falls back to localhost:3000 when no env var is set", () => {
    expect(resolveSiteUrl({}).toString()).toBe("http://localhost:3000/")
  })

  it("ignores an empty or whitespace-only NEXT_PUBLIC_SITE_URL and falls through", () => {
    expect(
      resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "   ", VERCEL_PROJECT_PRODUCTION_URL: "barrilito.vercel.app" }).toString(),
    ).toBe("https://barrilito.vercel.app/")
  })

  it("ignores an empty or whitespace-only VERCEL_PROJECT_PRODUCTION_URL and falls through", () => {
    expect(
      resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "  ", VERCEL_URL: "barrilito-git-branch.vercel.app" }).toString(),
    ).toBe("https://barrilito-git-branch.vercel.app/")
  })

  it("ignores an empty or whitespace-only VERCEL_URL and falls back to localhost", () => {
    expect(resolveSiteUrl({ VERCEL_URL: "   " }).toString()).toBe("http://localhost:3000/")
  })

  it("falls through to the next source when NEXT_PUBLIC_SITE_URL is not a valid URL", () => {
    expect(
      resolveSiteUrl({
        NEXT_PUBLIC_SITE_URL: "not-a-valid-url",
        VERCEL_PROJECT_PRODUCTION_URL: "barrilito.vercel.app",
      }).toString(),
    ).toBe("https://barrilito.vercel.app/")
  })

  it("falls all the way back to localhost when NEXT_PUBLIC_SITE_URL is invalid and no other source is set", () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "not-a-valid-url" }).toString()).toBe("http://localhost:3000/")
  })

  it("returns a URL instance", () => {
    expect(resolveSiteUrl({})).toBeInstanceOf(URL)
  })
})
