# Feature: Profile content rework

Locator: `odd/tasks/profile-content.md` · Engram mirror: `odd/profile-content/tasks`
Branch: `claude/personal-platform-content-profile-544093` (base `main` @ e42f9a8)
Content source of truth: `docs/profile-brief.md` (approved by the user 2026-09-25).

## Objective
Replace the template, tech-list copy of barrilito.dev with the approved profile: Jonathan Blanco aka
Barril, "AI Product Engineer & Tech Lead", real cases, a concrete offer, community, and WhatsApp
contact — keeping the playful snakes & ladders board.

## Why
Current copy is generic boilerplate: placeholder projects (`#` links, `/placeholder.svg`), services
without descriptions, 8 tech cards as the identity, and "BarrilitoDev" as the name. It does not sell
leadership, product judgment, or AI integration.

## Scope
- `lib/content.ts`: profile/hero/bio/manifesto, pillars, tools strip, cases (featured + secondary),
  offer (services with descriptions + terms + "no hago"), community, WhatsApp contact data.
- New pure helper for the WhatsApp URL (+ test); content invariant tests (no placeholders).
- Sections: `components/game/sections/{about,skills,projects,services,contact-info}.tsx`
  (+ shortcut-card copy). Stop keys/hashes stay stable (`about`, `skills`, `projects`, `services`,
  `info`, `contact`); only visible labels may change.
- Navbar labels, `lib/site-metadata.ts`, OG/Twitter image copy, live footer (`components/footer.tsx`).
- Asset: `public/cases/directorio-solidario.webp` (flyer shared by the user).

## Out of scope
- Cal.com/Calendly booking (future feature). "Descargar CV" removed until the CV is updated.
- English version. Dead legacy components (`hero-section.tsx`, `projects-section.tsx`, `skills-section.tsx`).

## Constraints
- Copy in Spanish (MX), tú, tone per brief §12. Code/identifiers/comments in English.
- Phone number and schedule not displayed; WhatsApp via `wa.me` button only.
- Next.js 14 App Router, React 18, Tailwind 3, shadcn/ui, pnpm. Theme tokens only. Both 3D board and lite mode render the same sections.

## TDD
Mode: strict (source: user global CLAUDE.md "Strict TDD Mode: enabled"). Runner: `pnpm test` (vitest).
Pure logic/data invariants go RED→GREEN→REFACTOR; section markup verified by `tsc`, lint, build and browser.

## Delivery
Strategy: ask-on-risk. Forecast: ~600 authored changed lines (asset excluded) → exceeds the ~400
budget; chain strategy to be asked before any PR. Work-unit commits on the feature branch; push/PR are the user's decision.
RDD: on (global). Review assessed per work-unit commit.

## Tasks
- [x] T1 — Content model + helpers: restructure `lib/content.ts` per brief; WhatsApp URL helper; invariant tests. Route: delegated writer (writer trigger: 2+ non-trivial files).
- [x] T2 — Sections: about (hero, bio, manifesto, nickname, community), skills→"Cómo trabajo" (pillars + tools strip), projects→"Casos", services→offer, contact-info (WhatsApp, community invite, no phone/schedule), remove "Descargar CV", shortcut copy. Route: delegated writer.
- [ ] T3 — Chrome & metadata: navbar labels, `lib/site-metadata.ts`, OG/Twitter copy, footer cleanup (broken "Blog" link, newsletter, tagline). Route: delegated writer.
- [ ] T4 — Browser verification (3D + lite, light/dark, mobile) by the parent.

## Acceptance criteria
- No `#` links or `/placeholder.svg` remain in live content; no "BarrilitoDev" as the person's name in title/meta.
- Hero, bio, manifesto, pillars, cases, offer, community and contact match `docs/profile-brief.md`.
- Phone/schedule not visible; WhatsApp button opens `https://wa.me/<number>`.
- `pnpm test`, `npx tsc --noEmit`, `pnpm lint`, `pnpm build` pass.

## Progress
- Brief approved and saved (`docs/profile-brief.md`).
- T1 done (commit pending — see below). `lib/content.ts` restructured into `profile`, `pillars`, `tools`,
  `featuredCases` (4), `secondaryCases` (3), `offer` (5 services + terms + no-hago), `community`,
  `contactInfo` (phone kept as data only). Added `lib/whatsapp.ts` (`digitsOnly`, `buildWhatsAppUrl`).
  Old `skills`/`projects` kept as clearly-marked `@deprecated` legacy exports so the out-of-scope dead
  components (`hero-section.tsx`, `projects-section.tsx`, `skills-section.tsx`) keep compiling without
  being touched; `services` old export was removed since `services.tsx` is in-scope for T2.
  - RED: `pnpm test -- lib/whatsapp.test.ts` failed with "Cannot find module './whatsapp'" before
    `lib/whatsapp.ts` existed. `pnpm test -- lib/content.test.ts` failed with "featuredCases is not
    iterable" before the restructure.
  - GREEN: both suites pass after implementation; full `pnpm test` → 196/196 passed.
  - `npx tsc --noEmit`: 6 errors remain, all inside `components/game/sections/{services,contact-info}.tsx`
    (T2-scoped files still referencing the pre-restructure shape) — expected until T2 lands.
  - `pnpm lint`: passes (only pre-existing `no-img-element` warnings).

- T2 done (commit pending — see below). Rewrote `components/game/sections/{about,skills,projects,services,contact-info}.tsx`
  against the new content shape; `contact-form.tsx` got a small copy-only refresh (title, description, copyright
  name), logic untouched. `about.tsx` now carries hero + bio + nickname story + manifesto; "Descargar CV" removed,
  CTAs are "Ver casos" (→ `projects` stop) and "Hablemos" (→ `contact` stop). `contact-info.tsx` has the big
  WhatsApp button (via `buildWhatsAppUrl`), no phone/schedule display, community block + invite. Board stop labels
  in `board-config.ts` updated to match: "Habilidades"→"Cómo trabajo", "Proyectos"→"Casos", "Servicios"→"Oferta"
  (keys/hashes unchanged; `board-config.test.ts` only asserts keys/colors, not labels, so it still passes).
  Community block placed in contact-info (not duplicated in about) per the "your call" instruction.
  - `pnpm test`: 196/196 passed.
  - `npx tsc --noEmit`: clean (0 errors) — the T1 gap in services.tsx/contact-info.tsx is now closed.
  - `pnpm lint`: passes (only the same pre-existing `no-img-element` warnings; the new `<img>` in
    `projects.tsx` for case images carries its own eslint-disable comment, consistent with the codebase's
    existing pattern for the same rule).

## Next step
T3 — navbar labels, site metadata, OG/Twitter copy, footer cleanup.
