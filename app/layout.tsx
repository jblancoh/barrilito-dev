import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import localFont from "next/font/local"
import "./globals.css"
import { Navbar } from "@/components/navbar"
import { RenderModeProvider } from "@/components/game/render-mode-context"
import { SiteChrome } from "@/components/site-chrome"
import { ThemeProvider } from "@/components/theme-provider"
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site-metadata"
import { resolveSiteUrl } from "@/lib/site-url"

const inter = Inter({ subsets: ["latin"] })
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: resolveSiteUrl(process.env),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: "BarrilitoDev",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {

  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} ${geistMono.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <RenderModeProvider>
            <Navbar />
            <SiteChrome>{children}</SiteChrome>
          </RenderModeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

