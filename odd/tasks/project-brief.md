# Feature: Guided project brief ("Arma tu brief")

Locator: `odd/tasks/project-brief.md` · Engram mirror: `odd/project-brief/tasks`
Branch: `claude/basic-quote-tool-6697d4` (base `main` @ 0841ecf)

## Objective
Visitors who want a quote can fill a short guided brief (service, stage, timeline, budget bracket,
short description, name, email) and send it by email (existing Resend pipeline) or WhatsApp.

## Why
No price ranges are defined yet and most services are consultative, so a price calculator would
commoditize the offer and anchor negotiations. A structured brief gives the owner context up front
and filters "proyectos sin presupuesto" (already in `offer.noHago`) via the client's budget bracket.
No owner prices are shown; ranges can be added later.

## Scope
- `lib/content.ts`: `briefOptions` (stages, timelines, budget brackets); services from `offer.services`.
- New pure `lib/project-brief.ts` (+ test): `ProjectBrief`, `validateBrief`, `formatBriefSubject`, `formatBriefMessage`.
- New `components/game/sections/project-brief.tsx`: stepper UI posting to existing `sendContactMessage`.
- Contact section: toggle "Mensaje libre | Armar brief".
- `components/game/sections/services.tsx`: "Cotiza tu proyecto" CTA to contact in brief mode.

## Constraints
- Reuse `sendContactMessage`, `handleContactSubmission`, `validateContact` unchanged: the brief is
  serialized into the existing `subject`/`message` fields (message max 5000 chars).
- Keep honeypot (`website`) and `startedAt` anti-spam fields.
- WhatsApp via `buildWhatsAppUrl` (lib/whatsapp.ts); phone never displayed.
- Site copy in Spanish (MX, tú); code/identifiers in English. Theme tokens only.

## TDD
Mode: strict (source: user global CLAUDE.md "Strict TDD Mode: enabled"). Runner: `pnpm test` (vitest).
Pure logic RED→GREEN→REFACTOR; UI verified by `tsc`, lint, build and browser.

## Delivery
Strategy: ask-on-risk. Forecast: ~350 authored changed lines (under ~400 budget) → single PR.
Work-unit commits on the feature branch; push/PR are the user's decision.

## Content decisions
- Budget brackets (owner confirmed 2026-09-26): Menos de $20k · $20k–$60k · $60k–$150k · Más de $150k (MXN) · Aún no lo sé.

## Tasks
- [x] T1 Pure brief model + `briefOptions` content (tests). Route: delegated writer (2 non-trivial files: module + test).
- [x] T2 Brief wizard component + contact-section toggle. Route: delegated writer (2+ non-trivial files).
- [x] T3 Services CTA deep link to brief mode + copy polish. Route: delegated writer (same bounded writer).

## Acceptance criteria
- Wizard keeps answers when going back/forward; one question per step; keyboard accessible.
- Email path produces subject `Brief: <service>` and a readable multi-line message; anti-spam unchanged.
- WhatsApp link contains the encoded brief text.
- `pnpm test`, `pnpm lint`, `pnpm build` pass; checked in browser at desktop and mobile width.

## Progress
- Feature doc created. Branch fast-forwarded to origin/main 0841ecf.
- T1 done (commit pending SHA below). RED observed: `pnpm test -- project-brief` failed with
  `Cannot find module './project-brief'` (right reason — module didn't exist yet). GREEN: 229/229
  tests passed after implementing `lib/project-brief.ts` (`validateBrief`, `canAdvanceFromStep`,
  `formatBriefSubject`, `formatBriefMessage`, brief-intent deep-link helpers) and adding
  `briefOptions` to `lib/content.ts`. `pnpm exec tsc --noEmit`: clean.
  Design note: `formatBriefMessage` intentionally omits name/email (those already flow through
  `sendContactMessage`'s separate `name`/`email` fields; `formatContactEmail` prepends them).
  Chose plain `string[]` option lists (value === label) over `{value,label}` pairs — simpler,
  matches existing content.ts conventions (e.g. `community.items`).

- T2 done (commit pending SHA below). New `components/game/sections/project-brief.tsx`
  (`ProjectBriefWizard`, native `<input type="radio">` chips per step — arrow-key nav and mutual
  exclusivity come free from the browser, no custom keyboard code needed) and a "Mensaje libre |
  Armar brief" tab toggle in `contact-form.tsx` (default: Mensaje libre). Step-advance logic
  reuses `canAdvanceFromStep` from T1 (no new untested component logic). `pnpm exec tsc --noEmit`:
  clean. `pnpm lint`: only pre-existing `<img>` warnings in unrelated files. `pnpm test`: 228/229
  passed; the 1 failure (`lib/contact.ts`'s `createRateLimiter` "prunes expired entries" test)
  is a pre-existing 5000-iteration/5000ms-timeout test unrelated to this change — it passed
  in isolation and when re-run alone, only times out under full-suite parallel load; `lib/contact.ts`
  is out of scope (must stay unchanged per the constraints).

- T3 done (commit pending SHA below). Deep-link mechanism: reused the existing `nav.goTo("contact")`
  navigation plus a `?brief=1` URL flag (same style as the existing `?mode=` render-mode override in
  render-mode.ts) — `hasBriefIntent`/`withBriefIntent`/`withoutBriefIntent` in `lib/project-brief.ts`
  (TDD'd in T1). Board mode: the flag survives the board's async walk-to-stop since it's part of the
  URL, and the freshly-mounted `ContactFormSection` reads it on mount. Lite mode keeps every section
  mounted at once (see seo-fallback.tsx), so `nav.goTo` there only scrolls — added a small
  `projectbrief:open` window event (new `components/game/brief-intent-events.ts`, mirrors
  board-events.ts's existing bus pattern) so an already-mounted `ContactFormSection` reacts
  immediately. To trigger: click "Cotiza tu proyecto" in the Oferta/Services section (repurposed
  the section's existing single CTA, previously labeled "Hablemos", since it already led to
  contact — avoids a redundant second button); or share a link with `?brief=1#contact`.
  Renamed `ServicesSection`'s CTA from "Hablemos" to "Cotiza tu proyecto" and wired it through
  `handleQuoteClick`; `ContactFormSection` now listens for the deep link on mount and via the event.
  `pnpm exec tsc --noEmit`: clean. `pnpm lint`: only pre-existing `<img>` warnings. `pnpm test`:
  229/229 passed (the T2 rate-limiter flake did not reproduce this run — confirmed pre-existing/
  environmental, unrelated to this feature). `pnpm build`: succeeded.

## Next step
All three tasks (T1–T3) done. Awaiting parent's browser verification (desktop + mobile width) per
the acceptance criteria; push/PR remain the user's decision.
