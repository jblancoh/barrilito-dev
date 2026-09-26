import { describe, expect, it } from "vitest"
import { briefOptions } from "./content"
import { validateContact } from "./contact"
import {
  canAdvanceFromStep,
  formatBriefMessage,
  formatBriefSubject,
  getBriefQuestionSet,
  hasBriefIntent,
  validateBrief,
  withoutBriefIntent,
  type ProjectBrief,
} from "./project-brief"

const DEFAULT_SERVICE = "Socio técnico para startups"
const defaultQuestions = getBriefQuestionSet(DEFAULT_SERVICE)!

const valid: ProjectBrief = {
  service: DEFAULT_SERVICE,
  answers: [defaultQuestions.step2.options[0], defaultQuestions.step3.options[0], defaultQuestions.step4.options[0]],
  description: "Quiero construir un MVP para validar una idea de negocio.",
  name: "Ada Lovelace",
  email: "ada@example.com",
}

describe("getBriefQuestionSet", () => {
  it("has a question set for every real service, including 'Otro'", () => {
    for (const service of briefOptions.services) {
      expect(getBriefQuestionSet(service), `expected a question set for "${service}"`).toBeDefined()
    }
  })

  it("returns undefined for an unknown service", () => {
    expect(getBriefQuestionSet("No existe")).toBeUndefined()
  })

  it("gives Charlas y talleres a Honorarios question instead of a money bracket", () => {
    const questions = getBriefQuestionSet("Charlas y talleres")
    expect(questions?.step4.messageLabel).toBe("Honorarios")
    expect(questions?.step4.options).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/\$/)]),
    )
  })

  it("shares the same question set between 'Socio técnico para startups' and 'Otro'", () => {
    expect(getBriefQuestionSet("Otro")).toEqual(getBriefQuestionSet("Socio técnico para startups"))
  })
})

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
    const result = validateBrief({ service: 123, answers: "not-an-array", description: 1, name: 2, email: 3 })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.service).toBeTruthy()
      expect(result.errors.answers?.[0]).toBeTruthy()
      expect(result.errors.answers?.[1]).toBeTruthy()
      expect(result.errors.answers?.[2]).toBeTruthy()
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

  it("accepts the 'Otro' service option with the default question set's answers", () => {
    expect(validateBrief({ ...valid, service: "Otro" }).ok).toBe(true)
  })

  it("rejects every answer when the service is unknown (no question set to validate against)", () => {
    const result = validateBrief({ ...valid, service: "No existe" })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.answers?.[0]).toBeTruthy()
      expect(result.errors.answers?.[1]).toBeTruthy()
      expect(result.errors.answers?.[2]).toBeTruthy()
    }
  })

  it("rejects an answer outside that service's own options", () => {
    const result = validateBrief({ ...valid, answers: ["No existe", valid.answers[1], valid.answers[2]] })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.answers?.[0]).toBeTruthy()
      expect(result.errors.answers?.[1]).toBeUndefined()
      expect(result.errors.answers?.[2]).toBeUndefined()
    }
  })

  it("validates answers against the selected service's own question set, not another service's", () => {
    const talkQuestions = getBriefQuestionSet("Charlas y talleres")!
    // These answers are valid for Charlas y talleres...
    const talkAnswers: [string, string, string] = [
      talkQuestions.step2.options[0],
      talkQuestions.step3.options[0],
      talkQuestions.step4.options[0],
    ]
    expect(validateBrief({ ...valid, service: "Charlas y talleres", answers: talkAnswers }).ok).toBe(true)
    // ...but not for the default service, since they belong to a different question set.
    const result = validateBrief({ ...valid, service: DEFAULT_SERVICE, answers: talkAnswers })
    expect(result.ok).toBe(false)
  })

  it("accepts every option of every question, for every service", () => {
    for (const service of briefOptions.services) {
      const questions = getBriefQuestionSet(service)
      if (!questions) continue
      for (const option2 of questions.step2.options) {
        expect(
          validateBrief({ ...valid, service, answers: [option2, questions.step3.options[0], questions.step4.options[0]] }).ok,
        ).toBe(true)
      }
      for (const option3 of questions.step3.options) {
        expect(
          validateBrief({ ...valid, service, answers: [questions.step2.options[0], option3, questions.step4.options[0]] }).ok,
        ).toBe(true)
      }
      for (const option4 of questions.step4.options) {
        expect(
          validateBrief({ ...valid, service, answers: [questions.step2.options[0], questions.step3.options[0], option4] }).ok,
        ).toBe(true)
      }
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
      expect(Object.keys(result.errors).sort()).toEqual(["answers", "email", "service"])
    }
  })
})

describe("canAdvanceFromStep", () => {
  it("gates step 1 on a valid service", () => {
    expect(canAdvanceFromStep(1, {})).toBe(false)
    expect(canAdvanceFromStep(1, { service: "No existe" })).toBe(false)
    expect(canAdvanceFromStep(1, { service: valid.service })).toBe(true)
  })

  it("gates step 2 on a valid answer to that service's own step-2 question", () => {
    expect(canAdvanceFromStep(2, { service: valid.service })).toBe(false)
    expect(canAdvanceFromStep(2, { service: valid.service, answers: ["No existe", "", ""] })).toBe(false)
    expect(canAdvanceFromStep(2, { service: valid.service, answers: [valid.answers[0], "", ""] })).toBe(true)
  })

  it("gates step 3 on a valid answer to that service's own step-3 question", () => {
    expect(
      canAdvanceFromStep(3, { service: valid.service, answers: [valid.answers[0], valid.answers[1], ""] }),
    ).toBe(true)
    expect(canAdvanceFromStep(3, { service: valid.service, answers: [valid.answers[0], "No existe", ""] })).toBe(
      false,
    )
  })

  it("gates step 4 on a valid answer to that service's own step-4 question", () => {
    expect(canAdvanceFromStep(4, { service: valid.service, answers: valid.answers })).toBe(true)
    expect(
      canAdvanceFromStep(4, { service: valid.service, answers: [valid.answers[0], valid.answers[1], "No existe"] }),
    ).toBe(false)
  })

  it("uses the selected service's own question set, not another service's, for steps 2-4", () => {
    const talkQuestions = getBriefQuestionSet("Charlas y talleres")!
    expect(
      canAdvanceFromStep(2, { service: "Charlas y talleres", answers: [talkQuestions.step2.options[0], "", ""] }),
    ).toBe(true)
    expect(
      canAdvanceFromStep(2, { service: DEFAULT_SERVICE, answers: [talkQuestions.step2.options[0], "", ""] }),
    ).toBe(false)
  })

  it("never advances past steps 2-4 when the service has no question set", () => {
    expect(canAdvanceFromStep(2, { service: "No existe", answers: ["x", "", ""] })).toBe(false)
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
    expect(formatBriefSubject(valid)).toBe(`Brief: ${valid.service}`)
  })

  it("passes validateContact's subject rules for every real service option", () => {
    for (const service of briefOptions.services) {
      const questions = getBriefQuestionSet(service)
      if (!questions) continue
      const brief: ProjectBrief = {
        ...valid,
        service,
        answers: [questions.step2.options[0], questions.step3.options[0], questions.step4.options[0]],
      }
      const subject = formatBriefSubject(brief)
      const result = validateContact({ ...valid, subject, message: formatBriefMessage(brief) })
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
  it("includes every answer under that service's own message labels, plus the description, in order", () => {
    const message = formatBriefMessage(valid)
    expect(message).toBe(
      [
        `Servicio: ${valid.service}`,
        `${defaultQuestions.step2.messageLabel}: ${valid.answers[0]}`,
        `${defaultQuestions.step3.messageLabel}: ${valid.answers[1]}`,
        `${defaultQuestions.step4.messageLabel}: ${valid.answers[2]}`,
        "",
        valid.description,
      ].join("\n"),
    )
  })

  it("uses Charlas y talleres' own labels (Formato/Fecha del evento/Honorarios), never a money bracket", () => {
    const questions = getBriefQuestionSet("Charlas y talleres")!
    const brief: ProjectBrief = {
      ...valid,
      service: "Charlas y talleres",
      answers: [questions.step2.options[1], questions.step3.options[2], questions.step4.options[1]],
    }
    const message = formatBriefMessage(brief)
    expect(message).toContain(`Formato: ${questions.step2.options[1]}`)
    expect(message).toContain(`Fecha del evento: ${questions.step3.options[2]}`)
    expect(message).toContain(`Honorarios: ${questions.step4.options[1]}`)
  })

  it("never exceeds validateContact's message limit, even at the max description length", () => {
    const message = formatBriefMessage({ ...valid, description: "a".repeat(4000) })
    expect(message.length).toBeLessThanOrEqual(5000)
    expect(validateContact({ ...valid, subject: formatBriefSubject(valid), message }).ok).toBe(true)
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

  it("removes the flag once consumed, keeping path, other params and hash", () => {
    expect(withoutBriefIntent("https://example.com/?a=1&brief=1#contact")).toBe("/?a=1#contact")
  })

  it("is a no-op to remove an absent flag", () => {
    expect(withoutBriefIntent("https://example.com/path?a=1")).toBe("/path?a=1")
  })
})
