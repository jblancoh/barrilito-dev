'use client'
import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"

export default function MaintenanceLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </ThemeProvider>
  )
} 