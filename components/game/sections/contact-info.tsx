"use client"

import { Mail, MapPin, Phone } from "lucide-react"
import { contactInfo } from "@/lib/content"
import type { BoardNav } from "../board-nav"
import { ShortcutCard } from "../shortcut-card"

export function ContactInfoSection({ nav }: { nav: BoardNav }) {
  return (
    <section className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-xl border border-secondary/20 bg-card shadow">
        <div className="h-2 bg-gradient-to-r from-secondary via-accent to-primary" />
        <div className="flex flex-col gap-1.5 p-6">
          <div className="text-2xl font-semibold leading-none tracking-tight">Información de contacto</div>
          <div className="text-sm text-muted-foreground">Otras formas de ponerte en contacto conmigo.</div>
        </div>
        <div className="flex flex-col gap-6 px-6 pb-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Email</h3>
              <p className="text-muted-foreground">{contactInfo.email}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-secondary/10 p-3">
              <Phone className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <h3 className="font-medium">Teléfono</h3>
              <p className="text-muted-foreground">{contactInfo.phone}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-accent/10 p-3">
              <MapPin className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h3 className="font-medium">Ubicación</h3>
              <p className="text-muted-foreground">{contactInfo.location}</p>
            </div>
          </div>
          <div className="mt-2 border-t pt-6">
            <h3 className="mb-4 font-medium">Horario de trabajo</h3>
            <div className="grid grid-cols-2 gap-2">
              {contactInfo.schedule.map((slot, index) => (
                <div key={slot.days} className={`rounded-lg p-3 ${index % 2 === 0 ? "bg-primary/5" : "bg-secondary/5"}`}>
                  <p className="font-medium">{slot.days}</p>
                  <p className="text-muted-foreground">{slot.hours}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <ShortcutCard
        code="21 ▼ 01"
        title="Serpiente al inicio"
        subtitle="Regresa a Sobre mí"
        tone="chart5"
        onClick={() => nav.shortcut("snake", 1)}
      />
    </section>
  )
}
