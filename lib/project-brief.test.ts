import { describe, expect, it } from "vitest"
import { briefOptions } from "./content"
import { validateContact } from "./contact"
import {
  canAdvanceFromStep,
  formatBriefMessage,
  formatBriefSubject,
  hasBriefIntent,
  validateBrief,
  withBriefIntent,
  withoutBriefIntent,
  type ProjectBrief,
} from "./project-brief"

const valid = {
  service: briefOptions.services[0],
  stage: briefOptions.stages[0],
  timeline: briefOptions.timelines[0],
  budget: briefOptions.budgets[0],
  description: "Quiero construir un MVP para validar una idea de negocio.",
  name: "Ada Lovelace",
  email: "ada@example.com",
}

describe("validateBrief", () => {
  it("accepts a valid submission and trims/normalizes every field", () => {
    const result = validateBrief({
      ...valid,
      name: "  Ada Lovelace  ",
      email: "  ada@example.com  ",
      description: "  Quiero construir un MVP para validar una idea de negocio.  ",
    })
    expect(result).toEqual({ ok: true, data: valid })
  })

  it("treats non-string values as empty for every field", () => {
    const result = validateBrief({ service: 123, stage: null, timeline: undefined, budget: [], description: 1, name: 2, email: 3 })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.service).toBeTruthy()
      expect(result.errors.stage).toBeTruthy()
      expect(result.errors.timeline).toBeTruthy()
      expect(result.errors.budget).toBeTruthy()
      expect(result.errors.description).toBeTruthy()
      expect(result.errors.name).toBeTruthy()
      expect(result.errors.email).toBeTruthy()
    }
  })

  it("rejects a service outside the allowed options", () => {
    const result = validateBrief({ ...valid, service: "No existe" })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.service).toBe("Elige qué necesitas.")
  })

  it("accepts the 'Otro' service option", () => {
    expect(validateBrief({ ...valid, service: "Otro" }).ok).toBe(true)
  })

  it("rejects a stage outside the allowed options", () => {
    const result = validateBrief({ ...valid, stage: "No existe" })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.stage).toBe("Elige en qué etapa estás.")
  })

  it("rejects a timeline outside the allowed options", () => {
    const result = validateBrief({ ...valid, timeline: "No existe" })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.timeline).toBe("Elige para cuándo lo necesitas.")
  })

  it("rejects a budget outside the allowed options", () => {
    const result = validateBrief({ ...valid, budget: "No existe" })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.budget).toBe("Elige un presupuesto aproximado.")
  })

  it("accepts every real budget bracket, including 'Aún no lo sé'", () => {
    for (const budget of briefOptions.budgets) {
      expect(validateBrief({ ...valid, budget }).ok, `expected "${budget}" to be accepted`).toBe(true)
    }
  })

  it("rejects a description shorter than 10 characters", () => {
    const result = validateBrief({ ...valid, description: "Muy corto" })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.description).toBeTruthy()
  })

  it("rejects a description longer than the allowed maximum", () => {
    const result = validateBrief({ ...valid, description: "a".repeat(4001) })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.description).toBeTruthy()
  })

  it("accepts a description at the boundaries", () => {
    expect(validateBrief({ ...valid, description: "a".repeat(10) }).ok).toBe(true)
    expect(validateBrief({ ...valid, description: "a".repeat(4000) }).ok).toBe(true)
  })

  it("rejects a name shorter than 2 characters", () => {
    const result = validateBrief({ ...valid, name: "A" })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.name).toBe("Escribe tu nombre.")
  })

  it("rejects malformed emails", () => {
    for (const bad of ["not-an-email", "missing-domain@", "@missing-local.com", "no-dot@localhost"]) {
      const result = validateBrief({ ...valid, email: bad })
      expect(result.ok, `expected "${bad}" to be rejected`).toBe(false)
      if (!result.ok) expect(result.errors.email).toBe("Ingresa un email válido.")
    }
  })

  it("reports every invalid field at once", () => {
    const result = validateBrief({ ...valid, service: "No existe", email: "bad" })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual(["email", "service"])
    }
  })
})

describe("canAdvanceFromStep", () => {
  it("gates step 1 on a valid service", () => {
    expect(canAdvanceFromStep(1, {})).toBe(false)
    expect(canAdvanceFromStep(1, { service: "No existe" })).toBe(false)
    expect(canAdvanceFromStep(1, { service: valid.service })).toBe(true)
  })

  it("gates step 2 on a valid stage", () => {
    expect(canAdvanceFromStep(2, {})).toBe(false)
    expect(canAdvanceFromStep(2, { stage: valid.stage })).toBe(true)
  })

  it("gates step 3 on a valid timeline", () => {
    expect(canAdvanceFromStep(3, {})).toBe(false)
    expect(canAdvanceFromStep(3, { timeline: valid.timeline })).toBe(true)
  })

  it("gates step 4 on a valid budget", () => {
    expect(canAdvanceFromStep(4, {})).toBe(false)
    expect(canAdvanceFromStep(4, { budget: valid.budget })).toBe(true)
  })

  it("gates step 5 on the full brief being valid", () => {
    expect(canAdvanceFromStep(5, valid)).toBe(true)
    expect(canAdvanceFromStep(5, { ...valid, email: "bad" })).toBe(false)
  })

  it("never blocks leaving the summary step", () => {
    expect(canAdvanceFromStep(6, {})).toBe(true)
  })
})

describe("formatBriefSubject", () => {
  it("formats as 'Brief: <service>'", () => {
    expect(formatBriefSubject(valid as ProjectBrief)).toBe(`Brief: ${valid.service}`)
  })

  it("passes validateContact's subject rules for every real service option", () => {
    for (const service of briefOptions.services) {
      const subject = formatBriefSubject({ ...valid, service })
      const result = validateContact({ ...valid, subject, message: formatBriefMessage({ ...valid, service }) })
      expect(result.ok, `expected subject "${subject}" to be accepted`).toBe(true)
    }
  })

  it("truncates a subject that would otherwise exceed validateContact's limit", () => {
    const subject = formatBriefSubject({ ...valid, service: "S".repeat(200) })
    expect(subject.length).toBeLessThanOrEqual(150)
    expect(validateContact({ ...valid, subject, message: valid.description }).ok).toBe(true)
  })
})

describe("formatBriefMessage", () => {
  it("includes every answer plus the description, in order", () => {
    const message = formatBriefMessage(valid as ProjectBrief)
    expect(message).toBe(
      [
        `Servicio: ${valid.service}`,
        `Etapa: ${valid.stage}`,
        `Para cuándo: ${valid.timeline}`,
        `Presupuesto aproximado: ${valid.budget}`,
        "",
        valid.description,
      ].join("\n"),
    )
  })

  it("never exceeds validateContact's message limit, even at the max description length", () => {
    const message = formatBriefMessage({ ...valid, description: "a".repeat(4000) })
    expect(message.length).toBeLessThanOrEqual(5000)
    expect(validateContact({ ...valid, subject: formatBriefSubject(valid as ProjectBrief), message }).ok).toBe(true)
  })
})

describe("brief-intent deep-link helpers", () => {
  it("recognizes the flag with or without a leading '?'", () => {
    expect(hasBriefIntent("?brief=1")).toBe(true)
    expect(hasBriefIntent("brief=1")).toBe(true)
  })

  it("does not recognize the flag when absent or set to another value", () => {
    expect(hasBriefIntent("")).toBe(false)
    expect(hasBriefIntent("?mode=lite")).toBe(false)
    expect(hasBriefIntent("?brief=0")).toBe(false)
  })

  it("adds the flag while keeping the rest of the URL untouched", () => {
    expect(withBriefIntent("https://example.com/#contact")).toBe("https://example.com/?brief=1#contact")
  })

  it("keeps other query params when adding the flag", () => {
    expect(withBriefIntent("https://example.com/?a=1#contact")).toBe("https://example.com/?a=1&brief=1#contact")
  })

  it("removes the flag once consumed, keeping path, other params and hash", () => {
    expect(withoutBriefIntent("https://example.com/?a=1&brief=1#contact")).toBe("/?a=1#contact")
  })

  it("is a no-op to remove an absent flag", () => {
    expect(withoutBriefIntent("https://example.com/path?a=1")).toBe("/path?a=1")
  })
})
