/// <reference types="react-dom/canary" />
"use client"

// See contact-form.tsx for why this reference comment exists: it only loads
// ambient `useFormState`/`useFormStatus` types and is compiled away.
import { useEffect, useId, useState } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { MessageCircle } from "lucide-react"
import { sendContactMessage } from "@/app/actions/contact"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { initialContactFormState, type ContactFormState } from "@/lib/contact-submission"
import { briefOptions, contactInfo } from "@/lib/content"
import {
  canAdvanceFromStep,
  formatBriefMessage,
  formatBriefSubject,
  type BriefStep,
  type ProjectBrief,
} from "@/lib/project-brief"
import { buildWhatsAppUrl } from "@/lib/whatsapp"

const EMPTY_BRIEF: ProjectBrief = {
  service: "",
  stage: "",
  timeline: "",
  budget: "",
  description: "",
  name: "",
  email: "",
}

const TOTAL_STEPS = 6

type UpdateBriefField = <K extends keyof ProjectBrief>(field: K, value: ProjectBrief[K]) => void

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
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="text-lg font-semibold leading-tight">Cuéntame en 2–3 líneas</legend>
      <label className="flex flex-col gap-2 text-sm font-medium">
        Tu proyecto
        <Textarea
          rows={4}
          placeholder="¿Qué problema quieres resolver?"
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
  const [state, formAction] = useFormState<ContactFormState, FormData>(sendContactMessage, initialContactFormState)
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

  if (state.status === "success") {
    return (
      <div className="flex flex-col gap-3">
        <div className="rounded-lg bg-primary/10 p-4 font-medium">
          {state.message ?? "¡Gracias por tu brief! Te responderé pronto."}
        </div>
        <Button type="button" variant="outline" size="sm" className="self-start" onClick={onSentAnother}>
          Armar otro brief
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
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Etapa</dt>
            <dd className="text-right font-medium">{brief.stage}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Para cuándo</dt>
            <dd className="text-right font-medium">{brief.timeline}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Presupuesto</dt>
            <dd className="text-right font-medium">{brief.budget}</dd>
          </div>
          <div className="flex flex-col gap-1 border-t pt-2">
            <dt className="text-muted-foreground">Tu proyecto</dt>
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
 * "Arma tu brief": a six-step guided wizard (service, stage, timeline,
 * budget, description + contact details, summary) that ends by sending the
 * same subject/message the free-form contact form sends — through the
 * unchanged `sendContactMessage` Server Action — or opening WhatsApp with
 * the brief prefilled. Not a price calculator: no owner prices ever appear.
 */
export function ProjectBriefWizard() {
  const uid = useId()
  const [step, setStep] = useState<BriefStep>(1)
  const [brief, setBrief] = useState<ProjectBrief>(EMPTY_BRIEF)
  const [instanceKey, setInstanceKey] = useState(0)

  const updateField: UpdateBriefField = (field, value) => {
    setBrief((prev) => ({ ...prev, [field]: value }))
  }

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
          onChange={(value) => updateField("service", value)}
        />
      )}
      {step === 2 && (
        <RadioChipGroup
          legend="¿En qué etapa estás?"
          name={`${uid}-stage`}
          options={briefOptions.stages}
          value={brief.stage}
          onChange={(value) => updateField("stage", value)}
        />
      )}
      {step === 3 && (
        <RadioChipGroup
          legend="¿Para cuándo?"
          name={`${uid}-timeline`}
          options={briefOptions.timelines}
          value={brief.timeline}
          onChange={(value) => updateField("timeline", value)}
        />
      )}
      {step === 4 && (
        <RadioChipGroup
          legend="Presupuesto aproximado (MXN)"
          name={`${uid}-budget`}
          options={briefOptions.budgets}
          value={brief.budget}
          onChange={(value) => updateField("budget", value)}
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
