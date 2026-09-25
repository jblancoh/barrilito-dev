import { describe, expect, it, vi } from "vitest"
import type { OutgoingEmail } from "./contact-submission"
import { sendWithResend } from "./resend"

const baseEmail: OutgoingEmail = {
  from: "BarrilitoDev <contacto@send.barrilito.dev>",
  to: "contacto@barrilito.dev",
  replyTo: "visitor@example.com",
  subject: "[barrilito.dev] Hola",
  text: "Nombre: Visitor",
}

function fakeFetch(response: { ok: boolean; status?: number; text?: () => Promise<string> }) {
  return vi.fn().mockResolvedValue({
    ok: response.ok,
    status: response.status ?? (response.ok ? 200 : 500),
    text: response.text ?? (async () => ""),
  })
}

describe("sendWithResend", () => {
  it("posts to the Resend emails endpoint with the bearer token and the expected JSON body", async () => {
    const fetchImpl = fakeFetch({ ok: true })

    const result = await sendWithResend(baseEmail, {
      apiKey: "re_test_key",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    expect(result).toEqual({ ok: true })
    expect(fetchImpl).toHaveBeenCalledTimes(1)

    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit]
    expect(url).toBe("https://api.resend.com/emails")
    expect(init.method).toBe("POST")
    expect(init.headers).toEqual({
      Authorization: "Bearer re_test_key",
      "Content-Type": "application/json",
    })
    expect(JSON.parse(init.body as string)).toEqual({
      from: baseEmail.from,
      to: [baseEmail.to],
      reply_to: baseEmail.replyTo,
      subject: baseEmail.subject,
      text: baseEmail.text,
    })
  })

  it("never puts the api key anywhere in the request body", async () => {
    const fetchImpl = fakeFetch({ ok: true })

    await sendWithResend(baseEmail, { apiKey: "re_super_secret", fetchImpl: fetchImpl as unknown as typeof fetch })

    const [, init] = fetchImpl.mock.calls[0] as [string, RequestInit]
    expect(init.body as string).not.toContain("re_super_secret")
  })

  it("returns ok:false and logs the status plus a truncated body on a non-ok response", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const fetchImpl = fakeFetch({ ok: false, status: 422, text: async () => "Invalid `from` field" })

    const result = await sendWithResend(baseEmail, {
      apiKey: "re_test_key",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    expect(result).toEqual({ ok: false })
    expect(errorSpy).toHaveBeenCalledTimes(1)
    const logged = errorSpy.mock.calls[0].join(" ")
    expect(logged).toContain("422")
    expect(logged).toContain("Invalid `from` field")
    expect(logged).not.toContain("re_test_key")

    errorSpy.mockRestore()
  })

  it("truncates a very long error body instead of logging it in full", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const longBody = "x".repeat(2000)
    const fetchImpl = fakeFetch({ ok: false, status: 500, text: async () => longBody })

    await sendWithResend(baseEmail, { apiKey: "re_test_key", fetchImpl: fetchImpl as unknown as typeof fetch })

    const logged = errorSpy.mock.calls[0].join(" ")
    expect(logged.length).toBeLessThan(longBody.length)

    errorSpy.mockRestore()
  })

  it("defaults to the global fetch when fetchImpl is not provided", async () => {
    const originalFetch = globalThis.fetch
    const mockFetch = fakeFetch({ ok: true })
    globalThis.fetch = mockFetch as unknown as typeof fetch

    try {
      const result = await sendWithResend(baseEmail, { apiKey: "re_test_key" })
      expect(result).toEqual({ ok: true })
      expect(mockFetch).toHaveBeenCalledTimes(1)
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
