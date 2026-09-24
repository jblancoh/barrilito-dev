import fs from "node:fs"
import path from "node:path"
import { ImageResponse } from "next/og"
import { SITE_DESCRIPTION } from "@/lib/site-metadata"

// `ImageResponse` renders in an isolated context with no access to the
// page's CSS, so the theme tokens from `app/globals.css` can't be used
// directly here. These are the same colors, converted from HSL to hex:
//   --primary:   193 95% 68% -> #60d9fb (React Blue)
//   --secondary:  43 100% 58% -> #ffc229 (Firebase Yellow/Orange)
//   --accent:     53 93% 54% -> #f7dd1d (JavaScript Yellow)
//   --background:  0 0%  7%  -> #121212 (dark mode background)
const PRIMARY = "#60d9fb"
const SECONDARY = "#ffc229"
const ACCENT = "#f7dd1d"
const DARK_BACKGROUND = "#121212"
const MUTED_TEXT = "#d4d4d8"

export const alt = "BarrilitoDev — Desarrollo Web & React"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

/**
 * Reads the site logo from disk and inlines it as a data URL. `ImageResponse`
 * can't fetch from the app's own `/public` route at build/render time, so the
 * file is read directly relative to the project root; if that ever fails
 * (missing file, restricted fs), the image renders without the logo instead
 * of throwing.
 */
function readLogoDataUrl(): string | null {
  try {
    const logoPath = path.join(process.cwd(), "public", "assets", "barrildevb.png")
    const file = fs.readFileSync(logoPath)
    return `data:image/png;base64,${file.toString("base64")}`
  } catch {
    return null
  }
}

export default function OpengraphImage() {
  const logo = readLogoDataUrl()

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: DARK_BACKGROUND,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            height: 16,
            backgroundImage: `linear-gradient(90deg, ${PRIMARY} 0%, ${SECONDARY} 50%, ${ACCENT} 100%)`,
          }}
        />
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 96px",
            textAlign: "center",
          }}
        >
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} width={112} height={112} alt="" style={{ marginBottom: 40 }} />
          ) : null}
          <div style={{ display: "flex", fontSize: 96, fontWeight: 700, color: "#ffffff" }}>BarrilitoDev</div>
          <div style={{ display: "flex", fontSize: 34, marginTop: 28, color: MUTED_TEXT }}>{SITE_DESCRIPTION}</div>
          <div style={{ display: "flex", fontSize: 24, marginTop: 36, color: PRIMARY }}>
            Serpientes y escaleras · Portafolio
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
