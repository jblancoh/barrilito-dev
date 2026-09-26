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
- [x] T4 Fix board-mode brief intent race (shared contact-mode store). Route: delegated writer
  (3 non-trivial files: new store module + test, contact-form.tsx, services.tsx).

## T5 (owner request 2026-09-26)
- [x] T5 Per-service brief questions + rename to "Pedir cotización" (default mode, placed first/left; "Mensaje libre" second). Route: delegated writer (lib/project-brief.ts, lib/content.ts, tests, project-brief.tsx, contact-form.tsx, services.tsx → 2+ non-trivial files).
  Owner-approved question sets (steps 2/3/4; always 6 steps):
  - Socio técnico / Otro: Etapa (Solo es una idea · Tengo diseño o prototipo · Ya tengo un producto en uso) / ¿Para cuándo? / Presupuesto brackets.
  - IA en tu producto: ¿Dónde estás? (Aún no tengo producto · Tengo producto sin IA · Ya uso IA y quiero mejorarla) / ¿Para cuándo? / Presupuesto.
  - Asesoría a equipos: Tamaño del equipo (1–5 · 6–20 · Más de 20 personas) / ¿Para cuándo? / Presupuesto.
  - MVPs y landings rápidas: Punto de partida (Solo es una idea · Tengo diseño · Quiero rehacer algo que ya existe) / ¿Para cuándo? / Presupuesto.
  - Charlas y talleres: Formato (Charla · Taller práctico · Ambos) / Fecha del evento (En menos de 1 mes · En 1 a 3 meses · Aún sin fecha) / Honorarios (Evento pagado · Solo viáticos · Evento comunitario sin pago) — no money brackets.

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

- **Retro on T3**: the parent's browser verification found the `?brief=1` + `projectbrief:open`
  event handoff from T3 had a real race in board mode. `ClassicHome` (seo-fallback.tsx) keeps a
  `sr-only` `ContactFormSection` mounted at all times, even while the board is active. On CTA
  click, that hidden instance received `projectbrief:open` and immediately stripped `?brief=1` from
  the URL; when the board later mounted its *own* `ContactFormSection` on arriving at "contact",
  the flag was already gone, so it opened in "Mensaje libre" instead of "Armar brief". Same bug for
  a direct `/?brief=1#contact` load, since the board is `next/dynamic(ssr:false)` and mounts after
  the always-present SEO instance. Fixed in T4 below (shared store instead of a one-shot
  URL-flag+event handoff). The parent also fixed the toggle's ARIA before this: `role="tablist"`/
  `role="tab"`/`aria-selected` (invalid without tabpanels or arrow-key support) → `role="group"` +
  `aria-pressed` buttons.

- T4 done (commit pending SHA below). STRICT TDD: RED observed —
  `pnpm test -- contact-mode-store` failed with `Cannot find module './contact-mode-store'` (right
  reason, module didn't exist). GREEN: implemented `components/game/contact-mode-store.ts`
  (`getContactMode`/`setContactMode`/`subscribeContactMode`, a pure module-level store with no
  window/DOM dependency) → 236/236 tests passed (6 new tests). Removed the one-shot
  `?brief=1` + `projectbrief:open` handoff:
  - Deleted `components/game/brief-intent-events.ts` (no longer needed).
  - Removed `withBriefIntent` from `lib/project-brief.ts` (and its 2 tests) — kept
    `hasBriefIntent`/`withoutBriefIntent`, still used for a direct `?brief=1#contact` link.
  - `ContactFormSection` (`contact-form.tsx`) now reads/writes mode via
    `useSyncExternalStore(subscribeContactMode, getContactMode, () => "message")` instead of local
    `useState`, so every mounted instance (board + always-mounted lite/SEO copy) shares one value.
    Its mount effect now only handles the direct-link case: `hasBriefIntent` → `setContactMode("brief")`
    + strip via `withoutBriefIntent`/`replaceState` — idempotent regardless of which instance's
    effect runs first, since the store already holds the result for every other reader.
  - `ServicesSection`'s `handleQuoteClick` simplified to `setContactMode("brief"); nav.goTo("contact")`
    — no URL mutation, no event, no race window.
  - Kept the parent's two uncommitted edits (handleQuoteClick ordering, now moot since the URL
    mutation is gone entirely; and the `role="group"`/`aria-pressed` toggle).
  `pnpm exec tsc --noEmit`: initially failed —
  `Type 'Set<() => void>' can only be iterated through when using the '--downlevelIteration' flag`
  (project's `tsconfig.json` has no explicit `target`, defaults old) — fixed by using
  `listeners.forEach(...)` instead of `for...of` over the `Set`. Clean after that.
  `pnpm lint`: only pre-existing `<img>` warnings, unrelated files.
  `pnpm test`: 234/234 passed (236 minus the 2 removed `withBriefIntent` tests).
  `pnpm build`: succeeded.
  Did not start a dev server (parent's own dev server was already running on port 62054; left it
  running and did not touch it, per instructions).

## Next step
All four tasks (T1–T4) done. Awaiting parent's browser re-verification of the board-mode brief
deep link (desktop + mobile width); push/PR remain the user's decision.

## Parent browser verification (2026-09-26, HEAD e76006e)
- Lite: wizard steps 1→6, Next disabled until pick, Back keeps answers, budget brackets exact, summary OK; email path reaches Server Action (local: "missing Resend configuration" → expected error state); WhatsApp link carries encoded brief; CTA opens brief, URL clean; toggle back to "Mensaje libre" OK; 375px width no horizontal overflow.
- Board: CTA from #services walks to #contact with visible instance in "Armar brief"; direct `/?brief=1#contact` opens brief and strips the flag.
- Found and fixed via T4: SEO sr-only instance consumed the one-shot intent before the board instance mounted.
- Review: assess (base 0841ecf, committed-only) → medium, review_due slice_budget_reached (1044 lines); consent relayed to owner.
- Review outcome: owner granted; reliability lens approved, acknowledged (lineage review-c0d5e7ee4a8f7380, authority burned). Non-blocking advisories (follow-ups, not applied): R3-deeplink-effect-untested (WARNING, contact-form.tsx:189-194), R3-tautological-shared-store-test (WARNING, contact-mode-store.test.ts:53-60), R3-mode-toggle-discards-input (SUGGESTION, contact-form.tsx:248-255), R3-raw-fields-submitted (SUGGESTION, project-brief.tsx:195-198).

- T5 done (commit pending SHA below). STRICT TDD: RED observed —
  `pnpm test -- project-brief` failed with `TypeError: getBriefQuestionSet is not a function`
  (right reason: the new function didn't exist yet, called at test-module load time to build the
  shared `valid` fixture). GREEN: 241/241 passed after implementing the new data/logic shape.
  Also ran the store's default-change RED/GREEN separately: `pnpm test -- contact-mode-store`
  failed on "defaults to 'brief' mode..." (`expected 'message' to be 'brief'`, right reason — the
  literal was still "message") → GREEN (241/241) after flipping the initial `mode` value.

  **Data shape chosen**: `lib/content.ts` gained `BriefQuestion` (`heading`, `messageLabel`,
  `options`), `BriefQuestionSet` (`step2`/`step3`/`step4`, named positionally rather than by
  domain since Charlas y talleres repurposes step 4 for "Honorarios" instead of a budget), and
  `briefQuestionsByService: Record<string, BriefQuestionSet>` (one entry per `offer.services`
  title plus "Otro"; "Socio técnico para startups" and "Otro" share one `DEFAULT_QUESTION_SET`
  object; `GENERIC_TIMING_QUESTION`/`GENERIC_BUDGET_QUESTION` are reused by every service except
  Charlas y talleres). `ProjectBrief` (lib/project-brief.ts) changed from separate
  `stage`/`timeline`/`budget` fields to `answers: [string, string, string]` (positional: step 2,
  3, 4's answers) — the chosen "keep it simple" option from your two suggested shapes, since a
  named-field shape (e.g. `stage`) would be misleading once a service repurposes that slot for
  something unrelated (team size, event date, honorarios). `BriefErrors.answers` mirrors that as
  `[string?, string?, string?]` so per-step validation errors stay addressable. New
  `getBriefQuestionSet(service)` (lib/project-brief.ts) wraps the content.ts map and is the single
  place `validateBrief`, `canAdvanceFromStep`, `formatBriefMessage` and the wizard component
  resolve a service's questions from. `formatBriefMessage` now emits `${step.messageLabel}:
  ${answer}` per line (e.g. "Formato: Taller práctico", "Honorarios: Solo viáticos" for Charlas y
  talleres), and the summary step's `<dt>`s use the same `messageLabel`s.
  Guard test added: `getBriefQuestionSet` completeness — loops `briefOptions.services` and asserts
  every one resolves to a defined question set (lib/project-brief.test.ts).

  **Default/label rename**: `components/game/contact-mode-store.ts`'s module-level `mode` now
  starts `"brief"` (was `"message"`); `contact-form.tsx`'s `useSyncExternalStore` server-snapshot
  callback changed from `() => "message"` to `() => "brief"` to match (avoids a hydration
  mismatch, per your note). Toggle buttons swapped order — "Pedir cotización" now first/left,
  "Mensaje libre" second — and every user-facing "Armar brief"/"Arma tu brief" string and mentioning
  comment renamed to "Pedir cotización" (including the success-state button, "Armar otro brief" →
  "Pedir otra cotización", for copy consistency). `?brief=1` deep-link handling
  (`hasBriefIntent`/`withoutBriefIntent`) and the Services CTA's `setContactMode("brief")` were
  left in place unchanged — both are harmless no-ops on the new default, and still matter when a
  visitor had switched to "Mensaje libre" first.

  Changing service now clears `answers` back to `["","",""]` (`handleServiceChange` in
  `project-brief.tsx`) so a stale answer from a previous service's question set can never reach
  `validateBrief` as if it belonged to the newly-selected service.

  `pnpm exec tsc --noEmit`: clean. `pnpm lint`: only the same 5 pre-existing `<img>` warnings in
  unrelated files. `pnpm test`: 241/241 passed. `pnpm build`: succeeded (dev server was stopped,
  ran without conflict).

## Next step
Owner decides push/PR. Optional follow-ups: the T4 advisories above; WhatsApp brief greeting with
client name; consider whether "IA en tu producto"'s step-2 messageLabel ("Situación actual",
chosen since the owner-approved heading "¿Dónde estás?" doesn't translate cleanly into a report
noun) reads well enough in the sent email, or should be renamed.

## T5 parent verification & review (2026-09-26, HEAD 9058bf5)
- Browser (lite + board): all 6 services show the owner-approved step 2–4 questions; "Pedir cotización" first and default in both instances; switching service clears answers (0 checked, Next disabled); Charlas summary/WhatsApp/subject use per-service labels; no console/hydration errors. `pnpm test` 241/241.
- Review: owner granted; reliability approved and acknowledged (lineage review-49eb894bd065c250, authority burned). Non-blocking advisories (follow-ups): R3-non-array-answers-masked (WARNING, lib/project-brief.test.ts:62), R3-service-switch-reset-untested (WARNING, project-brief.tsx:256-258), R3-default-mode-toggle-order-untested (SUGGESTION, contact-form.tsx:186).
- Copy follow-ups spotted: step-5 placeholder "¿Qué problema quieres resolver?" and summary label "Tu proyecto" don't fit Charlas; email subject still "Brief: …".
