"use client"

import { useState, type ChangeEvent, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { BoardNav } from "../board-nav"
import { ShortcutCard } from "../shortcut-card"

interface FormState {
  name: string
  email: string
  subject: string
  message: string
}

const EMPTY_FORM: FormState = { name: "", email: "", subject: "", message: "" }

export function ContactFormSection({ nav }: { nav: BoardNav }) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [sent, setSent] = useState(false)

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setSent(true)
    setForm(EMPTY_FORM)
  }

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="text-4xl font-bold leading-[1.1] tracking-tight">Contacto</h2>
        <p className="mt-3 text-xl text-muted-foreground">¿Tienes un proyecto en mente? ¡Hablemos!</p>
      </div>

      <Card className="overflow-hidden border-primary/20">
        <div className="h-2 bg-gradient-to-r from-primary via-secondary to-accent" />
        <CardHeader>
          <CardTitle>Envíame un mensaje</CardTitle>
          <CardDescription>Completa el formulario y me pondré en contacto contigo lo antes posible.</CardDescription>
        </CardHeader>
        <CardContent>
          {!sent ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
                <label className="flex flex-col gap-2 text-sm font-medium">
                  Nombre
                  <Input
                    name="name"
                    placeholder="Tu nombre"
                    required
                    value={form.name}
                    onChange={handleChange}
                    className="focus-visible:ring-primary"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  Email
                  <Input
                    name="email"
                    type="email"
                    placeholder="tu@email.com"
                    required
                    value={form.email}
                    onChange={handleChange}
                    className="focus-visible:ring-primary"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-2 text-sm font-medium">
                Asunto
                <Input
                  name="subject"
                  placeholder="Asunto de tu mensaje"
                  required
                  value={form.subject}
                  onChange={handleChange}
                  className="focus-visible:ring-primary"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium">
                Mensaje
                <Textarea
                  name="message"
                  rows={5}
                  placeholder="Escribe tu mensaje aquí..."
                  required
                  value={form.message}
                  onChange={handleChange}
                  className="focus-visible:ring-primary"
                />
              </label>
              <Button type="submit" className="w-full">
                Enviar mensaje
              </Button>
            </form>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="rounded-lg bg-primary/10 p-4 font-medium">¡Gracias por tu mensaje! Te responderé pronto.</div>
              <Button variant="outline" size="sm" className="self-start" onClick={() => setSent(false)}>
                Enviar otro
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
        <ShortcutCard
          code="24 ▼ 12"
          title="Serpiente"
          subtitle="Volver a Proyectos"
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
        © {new Date().getFullYear()} BarrilitoDev. Todos los derechos reservados.
      </p>
    </section>
  )
}
