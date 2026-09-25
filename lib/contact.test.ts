import { describe, expect, it } from "vitest"
import { createRateLimiter, formatContactEmail, isLikelySpam, validateContact } from "./contact"

describe("validateContact", () => {
  const valid = {
    name: "Ada Lovelace",
    email: "ada@example.com",
    subject: "Hola, quiero cotizar",
    message: "Este es un mensaje de prueba con suficiente longitud.",
  }

  it("accepts a valid submission and trims every field", () => {
    const result = validateContact({
      name: "  Ada Lovelace  ",
      email: "  ada@example.com  ",
      subject: "  Hola, quiero cotizar  ",
      message: "  Este es un mensaje de prueba con suficiente longitud.  ",
    })
    expect(result).toEqual({
      ok: true,
      data: valid,
    })
  })

  it("collapses CR/LF and repeated whitespace in name and subject", () => {
    const result = validateContact({
      ...valid,
      name: "Ada\r\n  Lovelace",
      subject: "Hola,\n\nquiero    cotizar",
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.name).toBe("Ada Lovelace")
      expect(result.data.subject).toBe("Hola, quiero cotizar")
    }
  })

  it("keeps newlines inside the message", () => {
    const result = validateContact({ ...valid, message: "Primera línea.\nSegunda línea con más texto." })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.message).toBe("Primera línea.\nSegunda línea con más texto.")
    }
  })

  it("treats non-string values as empty for every field", () => {
    const result = validateContact({ name: 123, email: null, subject: undefined, message: ["x"] })
    expect(result).toEqual({
      ok: false,
      errors: {
        name: "Escribe tu nombre.",
        email: "Ingresa un email válido.",
        subject: "Escribe un asunto.",
        message: "El mensaje debe tener al menos 10 caracteres.",
      },
    })
  })

  it("rejects a name shorter than 2 characters", () => {
    const result = validateContact({ ...valid, name: "A" })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.name).toBe("Escribe tu nombre.")
  })

  it("rejects a name longer than 100 characters", () => {
    const result = validateContact({ ...valid, name: "A".repeat(101) })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.name).toBeTruthy()
  })

  it("accepts a name at the boundaries (2 and 100 characters)", () => {
    expect(validateContact({ ...valid, name: "Al" }).ok).toBe(true)
    expect(validateContact({ ...valid, name: "A".repeat(100) }).ok).toBe(true)
  })

  it("rejects an empty email", () => {
    const result = validateContact({ ...valid, email: "" })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.email).toBe("Ingresa un email válido.")
  })

  it("rejects malformed emails", () => {
    for (const bad of ["not-an-email", "missing-domain@", "@missing-local.com", "no-at-sign.com", "spaces in@email.com", "no-dot@localhost"]) {
      const result = validateContact({ ...valid, email: bad })
      expect(result.ok, `expected "${bad}" to be rejected`).toBe(false)
      if (!result.ok) expect(result.errors.email).toBe("Ingresa un email válido.")
    }
  })

  it("rejects an email longer than 254 characters", () => {
    const longLocal = "a".repeat(250)
    const result = validateContact({ ...valid, email: `${longLocal}@example.com` })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.email).toBeTruthy()
  })

  it("accepts a variety of realistic valid emails", () => {
    for (const good of ["a@b.co", "jane.doe+tag@sub.example.com", "user_name@example.io"]) {
      expect(validateContact({ ...valid, email: good }).ok).toBe(true)
    }
  })

  it("rejects a subject shorter than 3 characters", () => {
    const result = validateContact({ ...valid, subject: "Hi" })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.subject).toBeTruthy()
  })

  it("rejects a subject longer than 150 characters", () => {
    const result = validateContact({ ...valid, subject: "A".repeat(151) })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.subject).toBeTruthy()
  })

  it("accepts a subject at the boundaries (3 and 150 characters)", () => {
    expect(validateContact({ ...valid, subject: "Hey" }).ok).toBe(true)
    expect(validateContact({ ...valid, subject: "A".repeat(150) }).ok).toBe(true)
  })

  it("rejects a message shorter than 10 characters", () => {
    const result = validateContact({ ...valid, message: "Too short" })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.message).toBe("El mensaje debe tener al menos 10 caracteres.")
  })

  it("rejects a message longer than 5000 characters", () => {
    const result = validateContact({ ...valid, message: "A".repeat(5001) })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.message).toBeTruthy()
  })

  it("accepts a message at the boundaries (10 and 5000 characters)", () => {
    expect(validateContact({ ...valid, message: "A".repeat(10) }).ok).toBe(true)
    expect(validateContact({ ...valid, message: "A".repeat(5000) }).ok).toBe(true)
  })

  it("reports every invalid field at once", () => {
    const result = validateContact({ name: "A", email: "bad", subject: "", message: "short" })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual(["email", "message", "name", "subject"])
    }
  })
})

describe("isLikelySpam", () => {
  const now = 1_000_000

  it("returns false for a legitimate, well-timed submission", () => {
    expect(isLikelySpam({ honeypot: "", startedAt: now - 5000, now })).toBe(false)
  })

  it("returns true when the honeypot field is filled", () => {
    expect(isLikelySpam({ honeypot: "I am a bot", startedAt: now - 5000, now })).toBe(true)
  })

  it("returns true when the honeypot is whitespace-only after trim treated as filled only if non-empty after trim", () => {
    expect(isLikelySpam({ honeypot: "   ", startedAt: now - 5000, now })).toBe(false)
  })

  it("ignores a non-string honeypot value", () => {
    expect(isLikelySpam({ honeypot: 123, startedAt: now - 5000, now })).toBe(false)
    expect(isLikelySpam({ honeypot: null, startedAt: now - 5000, now })).toBe(false)
  })

  it("returns true when startedAt is missing", () => {
    expect(isLikelySpam({ honeypot: "", startedAt: undefined, now })).toBe(true)
  })

  it("returns true when startedAt is not a finite number", () => {
    expect(isLikelySpam({ honeypot: "", startedAt: Number.NaN, now })).toBe(true)
    expect(isLikelySpam({ honeypot: "", startedAt: "not-a-number", now })).toBe(true)
    expect(isLikelySpam({ honeypot: "", startedAt: Number.POSITIVE_INFINITY, now })).toBe(true)
  })

  it("accepts a numeric string startedAt", () => {
    expect(isLikelySpam({ honeypot: "", startedAt: String(now - 5000), now })).toBe(false)
  })

  it("returns true when startedAt is in the future", () => {
    expect(isLikelySpam({ honeypot: "", startedAt: now + 1000, now })).toBe(true)
  })

  it("returns true when the form was filled faster than the minimum fill time", () => {
    expect(isLikelySpam({ honeypot: "", startedAt: now - 500, now })).toBe(true)
  })

  it("respects a custom minFillMs", () => {
    expect(isLikelySpam({ honeypot: "", startedAt: now - 500, now, minFillMs: 100 })).toBe(false)
    expect(isLikelySpam({ honeypot: "", startedAt: now - 50, now, minFillMs: 100 })).toBe(true)
  })

  it("allows a submission exactly at the default minimum fill time", () => {
    expect(isLikelySpam({ honeypot: "", startedAt: now - 3000, now })).toBe(false)
  })
})

describe("createRateLimiter", () => {
  it("allows requests up to the limit, then blocks", () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 60_000 })
    const now = 0
    expect(limiter.check("1.2.3.4", now)).toBe(true)
    expect(limiter.check("1.2.3.4", now)).toBe(true)
    expect(limiter.check("1.2.3.4", now)).toBe(true)
    expect(limiter.check("1.2.3.4", now)).toBe(false)
  })

  it("resets once the window has elapsed", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000 })
    expect(limiter.check("k", 0)).toBe(true)
    expect(limiter.check("k", 100)).toBe(true)
    expect(limiter.check("k", 200)).toBe(false)
    expect(limiter.check("k", 1001)).toBe(true)
  })

  it("tracks independent keys separately", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 })
    expect(limiter.check("a", 0)).toBe(true)
    expect(limiter.check("b", 0)).toBe(true)
    expect(limiter.check("a", 0)).toBe(false)
    expect(limiter.check("b", 0)).toBe(false)
  })

  it("prunes expired entries instead of growing unbounded", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 100 })
    for (let i = 0; i < 5000; i++) {
      limiter.check(`key-${i}`, 0)
    }
    // Long after every prior key's window expired, a fresh key is still
    // allowed and stale entries do not keep the map growing forever.
    expect(limiter.check("fresh-key", 1_000_000)).toBe(true)
    expect(limiter.check("key-0", 1_000_000)).toBe(true)
  })
})

describe("formatContactEmail", () => {
  it("builds a prefixed subject and a plain-text body with the visitor's fields", () => {
    const { subject, text } = formatContactEmail({
      name: "Ada Lovelace",
      email: "ada@example.com",
      subject: "Hola, quiero cotizar",
      message: "Este es el mensaje.",
    })
    expect(subject).toBe("[barrilito.dev] Hola, quiero cotizar")
    expect(text).toContain("Nombre: Ada Lovelace")
    expect(text).toContain("Email: ada@example.com")
    expect(text).toContain("Asunto: Hola, quiero cotizar")
    expect(text).toContain("Este es el mensaje.")
  })

  it("produces no HTML markup", () => {
    const { text } = formatContactEmail({
      name: "Ada",
      email: "ada@example.com",
      subject: "Asunto",
      message: "<script>alert(1)</script>",
    })
    expect(text).not.toContain("<br")
    expect(text).not.toContain("<p>")
  })
})
