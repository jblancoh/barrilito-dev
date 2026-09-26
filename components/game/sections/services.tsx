"use client"

import { Button } from "@/components/ui/button"
import { offer } from "@/lib/content"
import type { BoardNav } from "../board-nav"
import { STOP_BORDER_T_CLASS } from "../stop-colors"
import type { StopColor } from "../board-config"

const SERVICE_COLORS: StopColor[] = ["primary", "secondary", "accent", "chart5", "destructive"]

export function ServicesSection({ nav }: { nav: BoardNav }) {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="text-4xl font-bold leading-[1.1] tracking-tight">Oferta</h2>
        <p className="mt-3 text-xl text-muted-foreground text-pretty">
          Cinco formas concretas de trabajar juntos, no una lista genérica de servicios.
        </p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
        {offer.services.map((service, index) => (
          <div
            key={service.title}
            className={`flex min-h-[140px] flex-col gap-3 rounded-xl border-t-4 bg-card p-5 shadow ${STOP_BORDER_T_CLASS[SERVICE_COLORS[index % SERVICE_COLORS.length]]}`}
          >
            <span className="font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
            <span className="text-lg font-semibold tracking-tight">{service.title}</span>
            <span className="text-sm text-muted-foreground">{service.description}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2 border-t pt-6 text-sm text-muted-foreground">
        <p>{offer.terms}</p>
      </div>
      <Button
        size="lg"
        className="self-start bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:from-primary/90 hover:to-secondary/90"
        onClick={() => nav.goTo("contact")}
      >
        Hablemos
      </Button>
    </section>
  )
}
