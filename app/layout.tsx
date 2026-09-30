import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import localFont from "next/font/local"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
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
  applicationName: "BarrilitoDev",
  authors: [{ name: "Jonathan Blanco", url: "/" }],
  creator: "Jonathan Blanco",
  alternates: { canonical: "/" },
  // Black barrel on light tabs, white on dark; /favicon.ico (mid-gray) is only the no-media fallback.
  icons: {
    icon: [
      { url: "/icon-light.png", type: "image/png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark.png", type: "image/png", media: "(prefers-color-scheme: dark)" },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
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

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
  ],
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
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}

