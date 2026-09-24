"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, MapPin, Phone } from "lucide-react"
import { contactInfo } from "@/lib/content"

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Aquí iría la lógica para enviar el formulario
    console.log(formData)
    alert("¡Gracias por tu mensaje! Te responderé pronto.")
    setFormData({
      name: "",
      email: "",
      subject: "",
      message: "",
    })
  }

  return (
    <section id="contact" className="py-20">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Contacto</h2>
        <p className="mt-4 text-xl text-muted-foreground">¿Tienes un proyecto en mente? ¡Hablemos!</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-primary/20 overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-primary via-secondary to-accent"></div>
          <CardHeader>
            <CardTitle>Envíame un mensaje</CardTitle>
            <CardDescription>Completa el formulario y me pondré en contacto contigo lo antes posible.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Nombre
                  </label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Tu nombre"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="tu@email.com"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="focus-visible:ring-primary"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium">
                  Asunto
                </label>
                <Input
                  id="subject"
                  name="subject"
                  placeholder="Asunto de tu mensaje"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">
                  Mensaje
                </label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Escribe tu mensaje aquí..."
                  rows={5}
                  required
                  value={formData.message}
                  onChange={handleChange}
                  className="focus-visible:ring-primary"
                />
              </div>
              <Button type="submit" className="w-full">
                Enviar mensaje
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card className="border-secondary/20 overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-secondary via-accent to-primary"></div>
          <CardHeader>
            <CardTitle>Información de contacto</CardTitle>
            <CardDescription>Otras formas de ponerte en contacto conmigo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Email</h3>
                <p className="text-muted-foreground">{contactInfo.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-secondary/10">
                <Phone className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-medium">Teléfono</h3>
                <p className="text-muted-foreground">{contactInfo.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-accent/10">
                <MapPin className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="font-medium">Ubicación</h3>
                <p className="text-muted-foreground">{contactInfo.location}</p>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t">
              <h3 className="font-medium mb-4">Horario de trabajo</h3>
              <div className="grid grid-cols-2 gap-2">
                {contactInfo.schedule.map((slot, index) => (
                  <div
                    key={slot.days}
                    className={`p-3 rounded-lg ${index % 2 === 0 ? "bg-primary/5" : "bg-secondary/5"}`}
                  >
                    <p className="font-medium">{slot.days}</p>
                    <p className="text-muted-foreground">{slot.hours}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

