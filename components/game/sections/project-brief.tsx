"use client"

import { useActionState, useEffect, useId, useState } from "react"
import { useFormStatus } from "react-dom"
import { MessageCircle } from "lucide-react"
import { sendContactMessage } from "@/app/actions/contact"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { initialContactFormState, type ContactFormState } from "@/lib/contact-submission"
import { briefOptions, contactInfo, PROJECT_DESCRIPTION } from "@/lib/content"
import {
  canAdvanceFromStep,
  formatBriefMessage,
  formatBriefSubject,
  getBriefQuestionSet,
  type BriefStep,
  type ProjectBrief,
} from "@/lib/project-brief"
import { buildWhatsAppUrl } from "@/lib/whatsapp"

const EMPTY_ANSWERS: [string, string, string] = ["", "", ""]

const EMPTY_BRIEF: ProjectBrief = {
  service: "",
  answers: EMPTY_ANSWERS,
  description: "",
  name: "",
  email: "",
}

const TOTAL_STEPS = 6

/** Index into `ProjectBrief.answers` for steps 2, 3 and 4. */
type AnswerIndex = 0 | 1 | 2

type UpdateBriefField = <K extends "description" | "name" | "email">(field: K, value: ProjectBrief[K]) => void

interface RadioChipGroupProps {
  legend: string
  name: string
  options: readonly string[]
  value: string
  onChange: (value: string) => void
}

/**
 * One question per screen, radio-style chips. Uses real `<input type="radio">`
 * (visually hidden) grouped by `name`, so arrow-key navigation and mutual
 * exclusivity come from the browser for free — no custom keyboard handling
 * needed. `name` must be unique per mounted wizard instance (see the `uid`
 * passed from `ProjectBriefWizard`): the classic home keeps every section
 * mounted (just visually hidden) even while the 3D board is active, so two
 * radiogroups asking the same question could otherwise collide.
 */
function RadioChipGroup({ legend, name, options, value, onChange }: RadioChipGroupProps) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-lg font-semibold leading-tight">{legend}</legend>
      <div className="flex flex-col gap-2">
        {options.map((option) => {
          const selected = option === value
          return (
            <label
              key={option}
              className={`flex cursor-pointer items-center rounded-lg border px-4 py-3 text-sm font-medium transition-colors focus-within:ring-1 focus-within:ring-ring ${
                selected
                  ? "border-primary bg-primary/10"
                  : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option}
                checked={selected}
                onChange={() => onChange(option)}
                className="sr-only"
              />
              {option}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

function BriefDetailsStep({ brief, onChange }: { brief: ProjectBrief; onChange: UpdateBriefField }) {
  const descriptionCopy = getBriefQuestionSet(brief.service)?.description ?? PROJECT_DESCRIPTION
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="text-lg font-semibold leading-tight">Cuéntame en 2–3 líneas</legend>
      <label className="flex flex-col gap-2 text-sm font-medium">
        {descriptionCopy.label}
        <Textarea
          rows={4}
          placeholder={descriptionCopy.placeholder}
          value={brief.description}
          onChange={(e) => onChange("description", e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium">
        Nombre
        <Input placeholder="Tu nombre" value={brief.name} onChange={(e) => onChange("name", e.target.value)} />
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium">
        Email
        <Input
          type="email"
          placeholder="tu@email.com"
          value={brief.email}
          onChange={(e) => onChange("email", e.target.value)}
        />
      </label>
    </fieldset>
  )
}

function BriefSubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Enviando…" : "Enviar por correo"}
    </Button>
  )
}

/** Step 6: read-back summary plus the two send actions (email via the existing pipeline, or WhatsApp). */
function BriefSummaryStep({ brief, onSentAnother }: { brief: ProjectBrief; onSentAnother: () => void }) {
  const [state, formAction] = useActionState<ContactFormState, FormData>(sendContactMessage, initialContactFormState)
  // Rendered as "" on both server and first client render, then filled in by
  // this effect, so the hidden input never causes a hydration mismatch (see
  // contact-form.tsx's identical pattern).
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const honeypotId = useId()

  useEffect(() => {
    setStartedAt(Date.now())
  }, [])

  const subject = formatBriefSubject(brief)
  const message = formatBriefMessage(brief)
  const whatsappUrl = buildWhatsAppUrl(contactInfo.phone, message)
  // Guaranteed defined here: the wizard only reaches this step once step 1
  // picked a real service (see canAdvanceFromStep), which is the only way
  // getBriefQuestionSet returns undefined.
  const questions = getBriefQuestionSet(brief.service)

  if (state.status === "success") {
    return (
      <div className="flex flex-col gap-3">
        <div className="rounded-lg bg-primary/10 p-4 font-medium">
          {state.message ?? "¡Gracias por tu cotización! Te responderé pronto."}
        </div>
        <Button type="button" variant="outline" size="sm" className="self-start" onClick={onSentAnother}>
          Pedir otra cotización
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-4 text-sm">
        <legend className="px-1 text-base font-semibold">Resumen</legend>
        <dl className="flex flex-col gap-1.5">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Servicio</dt>
            <dd className="text-right font-medium">{brief.service}</dd>
          </div>
          {questions && (
            <>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{questions.step2.messageLabel}</dt>
                <dd className="text-right font-medium">{brief.answers[0]}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{questions.step3.messageLabel}</dt>
                <dd className="text-right font-medium">{brief.answers[1]}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{questions.step4.messageLabel}</dt>
                <dd className="text-right font-medium">{brief.answers[2]}</dd>
              </div>
            </>
          )}
          <div className="flex flex-col gap-1 border-t pt-2">
            <dt className="text-muted-foreground">{(questions?.description ?? PROJECT_DESCRIPTION).label}</dt>
            <dd className="whitespace-pre-wrap">{brief.description}</dd>
          </div>
        </dl>
      </fieldset>

      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="name" value={brief.name} />
        <input type="hidden" name="email" value={brief.email} />
        <input type="hidden" name="subject" value={subject} />
        <input type="hidden" name="message" value={message} />

        {/* Honeypot: invisible to sighted users and screen readers alike, so a
            human never fills it, but a bot that fills every field trips it
            (see contact-form.tsx's identical pattern). */}
        <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
          <label htmlFor={honeypotId}>
            Deja este campo vacío
            <input id={honeypotId} type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <input type="hidden" name="startedAt" value={startedAt ?? ""} />

        {state.status === "error" && state.message ? (
          <p role="alert" className="text-sm text-destructive">
            {state.message}
          </p>
        ) : null}

        <BriefSubmitButton />
      </form>

      <Button asChild size="lg" variant="outline" className="w-full gap-2">
        {/* The owner's phone never renders in the UI, only in this link (see lib/whatsapp.ts). */}
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="h-5 w-5" />
          Mandar por WhatsApp
        </a>
      </Button>
    </div>
  )
}

/**
 * "Pedir cotización": a six-step guided wizard (service, then three
 * service-specific questions, description + contact details, summary) that
 * ends by sending the same subject/message the free-form contact form
 * sends — through the unchanged `sendContactMessage` Server Action — or
 * opening WhatsApp with the brief prefilled. Not a price calculator: no
 * owner prices ever appear.
 */
export function ProjectBriefWizard() {
  const uid = useId()
  const [step, setStep] = useState<BriefStep>(1)
  const [brief, setBrief] = useState<ProjectBrief>(EMPTY_BRIEF)
  const [instanceKey, setInstanceKey] = useState(0)

  const updateField: UpdateBriefField = (field, value) => {
    setBrief((prev) => ({ ...prev, [field]: value }))
  }

  // Steps 2–4 ask different questions depending on the service, so their
  // options only make sense for the service that was selected when they
  // were answered — switching service clears them, or a stale answer from
  // another service's question set could otherwise be submitted.
  const handleServiceChange = (service: string) => {
    setBrief((prev) => (prev.service === service ? prev : { ...prev, service, answers: EMPTY_ANSWERS }))
  }

  const updateAnswer = (index: AnswerIndex, value: string) => {
    setBrief((prev) => {
      const answers = [...prev.answers] as [string, string, string]
      answers[index] = value
      return { ...prev, answers }
    })
  }

  const questions = getBriefQuestionSet(brief.service)
  const canAdvance = canAdvanceFromStep(step, brief)

  const goNext = () => {
    if (!canAdvance || step >= TOTAL_STEPS) return
    setStep((prev) => (prev + 1) as BriefStep)
  }

  const goBack = () => {
    if (step <= 1) return
    setStep((prev) => (prev - 1) as BriefStep)
  }

  const resetWizard = () => {
    setBrief(EMPTY_BRIEF)
    setStep(1)
    setInstanceKey((key) => key + 1)
  }

  return (
    <div key={instanceKey} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <ol className="flex gap-1.5" aria-hidden="true">
          {Array.from({ length: TOTAL_STEPS }, (_, index) => (
            <li key={index} className={`h-1.5 flex-1 rounded-full ${index < step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </ol>
        <p className="text-sm text-muted-foreground">
          Paso {step} de {TOTAL_STEPS}
        </p>
      </div>

      {step === 1 && (
        <RadioChipGroup
          legend="¿Qué necesitas?"
          name={`${uid}-service`}
          options={briefOptions.services}
          value={brief.service}
          onChange={handleServiceChange}
        />
      )}
      {step === 2 && questions && (
        <RadioChipGroup
          legend={questions.step2.heading}
          name={`${uid}-answer2`}
          options={questions.step2.options}
          value={brief.answers[0]}
          onChange={(value) => updateAnswer(0, value)}
        />
      )}
      {step === 3 && questions && (
        <RadioChipGroup
          legend={questions.step3.heading}
          name={`${uid}-answer3`}
          options={questions.step3.options}
          value={brief.answers[1]}
          onChange={(value) => updateAnswer(1, value)}
        />
      )}
      {step === 4 && questions && (
        <RadioChipGroup
          legend={questions.step4.heading}
          name={`${uid}-answer4`}
          options={questions.step4.options}
          value={brief.answers[2]}
          onChange={(value) => updateAnswer(2, value)}
        />
      )}
      {step === 5 && <BriefDetailsStep brief={brief} onChange={updateField} />}
      {step === 6 && <BriefSummaryStep brief={brief} onSentAnother={resetWizard} />}

      <div className="flex justify-between gap-3">
        <Button type="button" variant="outline" onClick={goBack} disabled={step === 1}>
          Atrás
        </Button>
        {step < TOTAL_STEPS && (
          <Button type="button" onClick={goNext} disabled={!canAdvance}>
            {step === 5 ? "Ver resumen" : "Siguiente"}
          </Button>
        )}
      </div>
    </div>
  )
}
