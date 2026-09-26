import { describe, expect, it } from "vitest"
import { buildWhatsAppUrl, digitsOnly } from "./whatsapp"

describe("digitsOnly", () => {
  it("strips everything but digits", () => {
    expect(digitsOnly("+52 993 360 0042")).toBe("529933600042")
  })

  it("keeps a value that already is only digits", () => {
    expect(digitsOnly("529933600042")).toBe("529933600042")
  })
})

describe("buildWhatsAppUrl", () => {
  it("builds a wa.me link with only digits, no formatting", () => {
    expect(buildWhatsAppUrl("+52 993 360 0042")).toBe("https://wa.me/529933600042")
  })

  it("omits the text param when no message is given", () => {
    expect(buildWhatsAppUrl("529933600042")).toBe("https://wa.me/529933600042")
  })

  it("url-encodes an optional prefilled message", () => {
    expect(
      buildWhatsAppUrl("+52 993 360 0042", "Hola Barril, vi tu página y quiero platicar de un proyecto"),
    ).toBe(
      "https://wa.me/529933600042?text=Hola%20Barril%2C%20vi%20tu%20p%C3%A1gina%20y%20quiero%20platicar%20de%20un%20proyecto",
    )
  })

  it("does not append a text param for an empty message", () => {
    expect(buildWhatsAppUrl("529933600042", "")).toBe("https://wa.me/529933600042")
  })
})
