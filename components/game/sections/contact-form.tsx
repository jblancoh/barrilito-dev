/// <reference types="react-dom/canary" />
"use client"

// The reference above only loads the ambient `useFormState`/`useFormStatus`
// type declarations for "react-dom" (they ship in @types/react-dom's canary
// types today, not its default ones) — it is compiled away and never
// becomes a runtime import. Next.js aliases the "react-dom" import below to
// a build that includes these hooks at runtime.
import { useEffect, useState, type ChangeEvent } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { sendContactMessage } from "@/app/actions/contact"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { initialContactFormState, type ContactFormState } from "@/lib/contact-submission"
import type { BoardNav } from "../board-nav"
import { ShortcutCard } from "../shortcut-card"

interface FormFields {
  name: string
  email: string
  subject: string
  message: string
}

const EMPTY_FIELDS: FormFields = { name: "", email: "", subject: "", message: "" }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Enviando…" : "Enviar mensaje"}
    </Button>
  )
}

function ContactFormFields({ onSendAnother }: { onSendAnother: () => void }) {
  const [state, formAction] = useFormState<ContactFormState, FormData>(sendContactMessage, initialContactFormState)
  const [fields, setFields] = useState<FormFields>(EMPTY_FIELDS)
  // Rendered as "" on both server and first client render, then filled in
  // by this effect, so the hidden input never causes a hydration mismatch.
  const [startedAt, setStartedAt] = useState<number | null>(null)

  useEffect(() => {
    setStartedAt(Date.now())
  }, [])

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFields((prev) => ({ ...prev, [name]: value }))
  }

  if (state.status === "success") {
    return (
      <div className="flex flex-col gap-3">
        <div className="rounded-lg bg-primary/10 p-4 font-medium">
          {state.message ?? "¡Gracias por tu mensaje! Te responderé pronto."}
        </div>
        <Button variant="outline" size="sm" className="self-start" onClick={onSendAnother}>
          Enviar otro
        </Button>
      </div>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
        <label className="flex flex-col gap-2 text-sm font-medium">
          Nombre
          <Input
            name="name"
            placeholder="Tu nombre"
            required
            value={fields.name}
            onChange={handleChange}
            className="focus-visible:ring-primary"
            aria-invalid={Boolean(state.errors?.name)}
            aria-describedby={state.errors?.name ? "contact-name-error" : undefined}
          />
          {state.errors?.name ? (
            <span id="contact-name-error" className="text-sm text-destructive">
              {state.errors.name}
            </span>
          ) : null}
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          Email
          <Input
            name="email"
            type="email"
            placeholder="tu@email.com"
            required
            value={fields.email}
            onChange={handleChange}
            className="focus-visible:ring-primary"
            aria-invalid={Boolean(state.errors?.email)}
            aria-describedby={state.errors?.email ? "contact-email-error" : undefined}
          />
          {state.errors?.email ? (
            <span id="contact-email-error" className="text-sm text-destructive">
              {state.errors.email}
            </span>
          ) : null}
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm font-medium">
        Asunto
        <Input
          name="subject"
          placeholder="Asunto de tu mensaje"
          required
          value={fields.subject}
          onChange={handleChange}
          className="focus-visible:ring-primary"
          aria-invalid={Boolean(state.errors?.subject)}
          aria-describedby={state.errors?.subject ? "contact-subject-error" : undefined}
        />
        {state.errors?.subject ? (
          <span id="contact-subject-error" className="text-sm text-destructive">
            {state.errors.subject}
          </span>
        ) : null}
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium">
        Mensaje
        <Textarea
          name="message"
          rows={5}
          placeholder="Escribe tu mensaje aquí..."
          required
          value={fields.message}
          onChange={handleChange}
          className="focus-visible:ring-primary"
          aria-invalid={Boolean(state.errors?.message)}
          aria-describedby={state.errors?.message ? "contact-message-error" : undefined}
        />
        {state.errors?.message ? (
          <span id="contact-message-error" className="text-sm text-destructive">
            {state.errors.message}
          </span>
        ) : null}
      </label>

      {/* Honeypot: invisible to sighted users and screen readers alike, so a
          human never fills it, but a bot that fills every field trips it. */}
      <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="contact-website">
          Deja este campo vacío
          <input id="contact-website" type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <input type="hidden" name="startedAt" value={startedAt ?? ""} />

      {state.status === "error" && state.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  )
}

export function ContactFormSection({ nav }: { nav: BoardNav }) {
  const [formInstanceKey, setFormInstanceKey] = useState(0)

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="text-4xl font-bold leading-[1.1] tracking-tight">Contacto</h2>
        <p className="mt-3 text-xl text-muted-foreground">¿Tienes un proyecto en mente? ¡Hablemos!</p>
      </div>

      <Card className="overflow-hidden border-primary/20">
        <div className="h-2 bg-gradient-to-r from-primary via-secondary to-accent" />
        <CardHeader>
          <CardTitle>Cuéntame de tu proyecto</CardTitle>
          <CardDescription>Completa el formulario y te respondo lo antes posible.</CardDescription>
        </CardHeader>
        <CardContent>
          <ContactFormFields
            key={formInstanceKey}
            onSendAnother={() => setFormInstanceKey((key) => key + 1)}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
        <ShortcutCard
          code="24 ▼ 12"
          title="Serpiente"
          subtitle="Volver a Casos"
          tone="destructive"
          onClick={() => nav.shortcut("snake", 0)}
        />
        <ShortcutCard
          code="21 ▼ 01"
          title="Serpiente"
          subtitle="Volver a Sobre mí"
          tone="chart5"
          onClick={() => nav.shortcut("snake", 1)}
        />
      </div>

      <p className="border-t pt-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Jonathan Blanco. Todos los derechos reservados.
      </p>
    </section>
  )
}
