"use client"

import { Button } from "@/components/ui/button"
import { services } from "@/lib/content"
import type { BoardNav } from "../board-nav"
import { STOP_BORDER_T_CLASS } from "../stop-colors"

const SERVICE_COLOR: Record<(typeof services)[number]["colorVar"], "primary" | "secondary" | "accent" | "chart5"> = {
  "--primary": "primary",
  "--secondary": "secondary",
  "--accent": "accent",
  "--chart-5": "chart5",
}

export function ServicesSection({ nav }: { nav: BoardNav }) {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="text-4xl font-bold leading-[1.1] tracking-tight">Servicios</h2>
        <p className="mt-3 text-xl text-muted-foreground text-pretty">
          Desarrollador web especializado en React, Next.js, Nest.js, Firebase y JavaScript.
        </p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-4">
        {services.map((service, index) => (
          <div
            key={service.title}
            className={`flex min-h-[120px] flex-col gap-7 rounded-xl border-t-4 bg-card p-5 shadow ${STOP_BORDER_T_CLASS[SERVICE_COLOR[service.colorVar]]}`}
          >
            <span className="font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
            <span className="text-lg font-semibold tracking-tight">{service.title}</span>
          </div>
        ))}
      </div>
      <Button
        size="lg"
        className="self-start bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:from-primary/90 hover:to-secondary/90"
        onClick={() => nav.goTo("contact")}
      >
        Contáctame
      </Button>
    </section>
  )
}
