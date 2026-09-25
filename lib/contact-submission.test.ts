import { describe, expect, it, vi } from "vitest"
import type { RateLimiter } from "./contact"
import {
  CONTACT_RATE_LIMIT,
  CONTACT_RATE_LIMIT_WINDOW_MS,
  handleContactSubmission,
  initialContactFormState,
  type ContactSubmissionDeps,
} from "./contact-submission"

const validFields = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  subject: "Hola, quiero cotizar",
  message: "Este es un mensaje de prueba con suficiente longitud.",
  website: "",
  startedAt: 0,
}

function allowingLimiter(): RateLimiter {
  return { check: () => true }
}

function blockingLimiter(): RateLimiter {
  return { check: () => false }
}

function makeDeps(overrides: Partial<ContactSubmissionDeps> = {}): ContactSubmissionDeps {
  return {
    now: 10_000,
    clientKey: "1.2.3.4",
    rateLimiter: allowingLimiter(),
    send: vi.fn().mockResolvedValue({ ok: true }),
    config: {
      from: "BarrilitoDev <contacto@send.barrilito.dev>",
      to: "contacto@barrilito.dev",
      apiKeyPresent: true,
    },
    ...overrides,
  }
}

describe("initialContactFormState", () => {
  it("starts idle with no message or errors", () => {
    expect(initialContactFormState).toEqual({ status: "idle" })
  })
})

describe("handleContactSubmission", () => {
  it("returns success without sending or consuming the rate limit when the honeypot is filled", async () => {
    const send = vi.fn()
    const check = vi.fn().mockReturnValue(true)
    const deps = makeDeps({ send, rateLimiter: { check } })

    const result = await handleContactSubmission({ ...validFields, website: "I am a bot" }, deps)

    expect(result.status).toBe("success")
    expect(send).not.toHaveBeenCalled()
    expect(check).not.toHaveBeenCalled()
  })

  it("returns success without sending when the form was filled too fast", async () => {
    const send = vi.fn()
    const check = vi.fn().mockReturnValue(true)
    const deps = makeDeps({ send, rateLimiter: { check }, now: 500 })

    const result = await handleContactSubmission({ ...validFields, startedAt: 400 }, deps)

    expect(result.status).toBe("success")
    expect(send).not.toHaveBeenCalled()
    expect(check).not.toHaveBeenCalled()
  })

  it("returns the same success state for a spam submission as for a real send", async () => {
    const deps = makeDeps()
    const spamResult = await handleContactSubmission({ ...validFields, website: "bot" }, deps)
    const realResult = await handleContactSubmission(validFields, makeDeps())

    expect(spamResult).toEqual(realResult)
  })

  it("returns field errors in Spanish for invalid input and does not send", async () => {
    const send = vi.fn()
    const deps = makeDeps({ send })

    const result = await handleContactSubmission({ ...validFields, email: "not-an-email" }, deps)

    expect(result.status).toBe("error")
    expect(result.message).toBe("Revisa los campos marcados.")
    expect(result.errors?.email).toBeTruthy()
    expect(send).not.toHaveBeenCalled()
  })

  it("returns a friendly rate-limit error once the limiter blocks the key", async () => {
    const send = vi.fn()
    const deps = makeDeps({ send, rateLimiter: blockingLimiter() })

    const result = await handleContactSubmission(validFields, deps)

    expect(result).toEqual({
      status: "error",
      message: "Demasiados mensajes. Intenta de nuevo en unos minutos.",
    })
    expect(send).not.toHaveBeenCalled()
  })

  it("returns a friendly error and logs (without secrets) when the Resend api key is missing", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const send = vi.fn()
    const deps = makeDeps({
      send,
      config: { from: "a@b.com", to: "c@d.com", apiKeyPresent: false },
    })

    const result = await handleContactSubmission(validFields, deps)

    expect(result.status).toBe("error")
    expect(result.message).toBe("No se pudo enviar el mensaje. Intenta de nuevo más tarde.")
    expect(send).not.toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalled()
    const logged = errorSpy.mock.calls[0].join(" ")
    expect(logged).not.toContain("re_")

    errorSpy.mockRestore()
  })

  it("returns a friendly error when from/to config is missing even with an api key present", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const send = vi.fn()
    const deps = makeDeps({ send, config: { apiKeyPresent: true } })

    const result = await handleContactSubmission(validFields, deps)

    expect(result.status).toBe("error")
    expect(result.message).toBe("No se pudo enviar el mensaje. Intenta de nuevo más tarde.")
    expect(send).not.toHaveBeenCalled()

    errorSpy.mockRestore()
  })

  it("returns a friendly error when send resolves with ok:false", async () => {
    const send = vi.fn().mockResolvedValue({ ok: false })
    const deps = makeDeps({ send })

    const result = await handleContactSubmission(validFields, deps)

    expect(result).toEqual({
      status: "error",
      message: "No se pudo enviar el mensaje. Intenta de nuevo más tarde.",
    })
  })

  it("returns a friendly error when send throws", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const send = vi.fn().mockRejectedValue(new Error("network down"))
    const deps = makeDeps({ send })

    const result = await handleContactSubmission(validFields, deps)

    expect(result.status).toBe("error")
    expect(result.message).toBe("No se pudo enviar el mensaje. Intenta de nuevo más tarde.")

    errorSpy.mockRestore()
  })

  it("sends with replyTo set to the visitor's email and subject/text from formatContactEmail", async () => {
    const send = vi.fn().mockResolvedValue({ ok: true })
    const deps = makeDeps({ send })

    const result = await handleContactSubmission(validFields, deps)

    expect(result.status).toBe("success")
    expect(send).toHaveBeenCalledTimes(1)
    const emailArg = send.mock.calls[0][0]
    expect(emailArg).toEqual({
      from: "BarrilitoDev <contacto@send.barrilito.dev>",
      to: "contacto@barrilito.dev",
      replyTo: "ada@example.com",
      subject: "[barrilito.dev] Hola, quiero cotizar",
      text: expect.stringContaining("Nombre: Ada Lovelace"),
    })
  })

  it("consumes exactly one rate-limit check for a legitimate submission, keyed by clientKey and now", async () => {
    const check = vi.fn().mockReturnValue(true)
    const deps = makeDeps({ rateLimiter: { check } })

    await handleContactSubmission(validFields, deps)

    expect(check).toHaveBeenCalledTimes(1)
    expect(check).toHaveBeenCalledWith("1.2.3.4", 10_000)
  })

  it("exports the rate limit constants used to configure the limiter", () => {
    expect(CONTACT_RATE_LIMIT).toBe(5)
    expect(CONTACT_RATE_LIMIT_WINDOW_MS).toBe(10 * 60 * 1000)
  })
})
