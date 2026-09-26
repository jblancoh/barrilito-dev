"use client"

import { Github, Linkedin, MapPin, MessageCircle, Twitter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { community, contactInfo, socialLinks } from "@/lib/content"
import { buildWhatsAppUrl } from "@/lib/whatsapp"
import type { BoardNav } from "../board-nav"
import { ShortcutCard } from "../shortcut-card"

export function ContactInfoSection({ nav }: { nav: BoardNav }) {
  const whatsappUrl = buildWhatsAppUrl(contactInfo.phone, contactInfo.whatsappMessage)

  return (
    <section className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-xl border border-secondary/20 bg-card shadow">
        <div className="h-2 bg-gradient-to-r from-secondary via-accent to-primary" />
        <div className="flex flex-col gap-1.5 p-6">
          <div className="text-2xl font-semibold leading-none tracking-tight">Escríbeme</div>
          <div className="text-sm text-muted-foreground">La forma más rápida de encontrarme.</div>
        </div>
        <div className="flex flex-col gap-6 px-6 pb-6">
          <Button
            size="lg"
            asChild
            className="w-full gap-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:from-primary/90 hover:to-secondary/90"
          >
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-5 w-5" />
              Escríbeme por WhatsApp
            </a>
          </Button>

          <div className="flex items-start gap-4">
            <div className="rounded-full bg-accent/10 p-3">
              <MapPin className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h3 className="font-medium">Ubicación</h3>
              <p className="text-muted-foreground">{contactInfo.location}</p>
            </div>
          </div>

          <div className="flex gap-4">
            <Button variant="ghost" size="icon" className="hover:bg-accent/20 hover:text-accent" asChild>
              <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                <Github className="h-5 w-5" />
              </a>
            </Button>
            <Button variant="ghost" size="icon" className="hover:bg-primary/20 hover:text-primary" asChild>
              <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <Linkedin className="h-5 w-5" />
              </a>
            </Button>
            <Button variant="ghost" size="icon" className="hover:bg-secondary/20 hover:text-secondary" asChild>
              <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
            </Button>
          </div>

          <div className="mt-2 border-t pt-6">
            <h3 className="mb-3 font-medium">Comunidad</h3>
            <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
              {community.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-3 text-sm font-medium">{community.invite}</p>
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
