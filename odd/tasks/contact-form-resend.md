# Feature: Contact form delivery via Resend

Locator: `odd/tasks/contact-form-resend.md` · Engram mirror: `odd/contact-form-resend/tasks`
Branch: `claude/contact-form-messages-53c117` (base `main` @ 2c1e9ef)

## Objective
Messages submitted through the contact form (`components/game/sections/contact-form.tsx`) reach the
owner's inbox by email via Resend, with the visitor's address as `replyTo`, and are protected against spam.

## Why
`handleSubmit` only flips a local `sent` flag: every message is silently lost. There is no API route
or Server Action. The user chose option 1 (email via the Vercel Marketplace Resend integration) plus
anti-spam protection.

## Scope
- Use the user's EXISTING Resend account (not the Vercel Marketplace integration: user already has an account and wants to avoid extra Vercel billing). API key stored as Vercel env var `RESEND_API_KEY`, entered by the user. Sending domain `send.barrilito.dev` (configurable).
- New pure module `lib/contact.ts` (+ test): payload validation/normalization, honeypot + minimum
  fill-time checks, best-effort in-memory per-IP rate limiter.
- New Server Action `app/actions/contact.ts`: validate → spam checks → rate limit → send via Resend REST API (`fetch`, no SDK dependency).
- `components/game/sections/contact-form.tsx`: call the action, pending/error states, hidden honeypot
  field, render timestamp.

## Out of scope
- `components/contact-section.tsx` is a legacy duplicate with no importers (dead code); left untouched.
- Persistent storage of messages, distributed rate limiting (Upstash), BotID.

## Constraints
- Next.js 14.2 App Router, React 18 (`useFormState`/`useFormStatus` from `react-dom`), Tailwind 3, shadcn/ui, pnpm.
- Secrets only on the server; never echo env values. Recipient defaults to `siteContent` email
  (`contacto@barrilito.dev`), overridable with `CONTACT_TO_EMAIL`.
- Spam rejections return the same success response as a real send (do not tip off bots).
- The in-memory rate limiter is per Fluid Compute instance: best-effort only, documented as such.
- DNS for `barrilito.dev` is third party: the user must add the SPF/DKIM records Resend provides
  for `send.barrilito.dev` before production sends are delivered.

## TDD
Mode: strict (source: user global CLAUDE.md "Strict TDD Mode: enabled"). Runner: `pnpm test` (vitest).
Pure logic in `lib/contact.ts` goes RED→GREEN→REFACTOR; action/form wiring verified by `tsc`, lint,
build and browser.

## Delivery
Strategy: ask-on-risk. Forecast: ~350 authored changed lines (lockfile excluded), under the ~400 budget.
Work-unit commits on the feature branch; push/PR are the user's decision.

## Tasks
- [ ] T0 User creates a Resend API key in the existing account, verifies `send.barrilito.dev`, and adds `RESEND_API_KEY` with `vercel env add` (user-only: secrets) — Status: pending user.
- [x] T1 `lib/contact.ts` + `lib/contact.test.ts`: validation, honeypot, min fill time, rate limiter — route: delegated writer (2 non-trivial files).
- [x] T2 Server Action + form wiring with Resend — route: delegated writer (2+ non-trivial files). Env: `RESEND_API_KEY` (required), `CONTACT_FROM_EMAIL`, `CONTACT_TO_EMAIL` (required: the owner's personal Gmail, set by the user).
- [ ] T3 (partial) Verify: tests, `tsc`, lint, build, browser submit (success, validation error, honeypot) — route: inline/per-action.

## Acceptance criteria
- Valid submission sends one email to the recipient with subject, name, email, message and `replyTo` = visitor.
- Invalid fields return field-level errors in Spanish UI copy; the form keeps the user's input.
- Honeypot filled or submitted faster than the minimum fill time → no email, generic success response.
- More than N submissions per IP per window → friendly rate-limit error, no email.
- Missing Resend config → logged server error and a friendly failure message, no crash.

## Progress / evidence
- 2026-09-24: Vercel CLI logged in, project linked (`jblancohs-projects/barrilito-dev`), Resend terms accepted;
  `integration add` requires an extra browser setup step before the resource is created.
- T1 done: commit 42852c7 (35 tests RED→GREEN; pnpm test 143 pass; tsc clean; lint clean except 5 pre-existing warnings).
- RDD: `.gitignore` change from `vercel link` (`.env*`) — consent declined for that candidate.

- Marketplace install abandoned before provisioning (no resource created); switched to existing Resend account.

- T2 done: commits 7eaa8bd (lib/contact-submission.ts, lib/resend.ts + tests) and 4df24c9 (app/actions/contact.ts, contact-form.tsx).
  RED observed (missing modules) → GREEN; pnpm test 161 pass; tsc clean; lint only 5 pre-existing warnings; pnpm build ok.
  `reply_to` confirmed against Resend REST docs (Context7). `useFormState` typed via `/// <reference types="react-dom/canary" />`.
- T3 browser (lite mode, dev server): short message → field error + "Revisa los campos marcados." with input kept and aria-invalid;
  valid message without RESEND_API_KEY → friendly error + server log "missing Resend configuration" (no secrets);
  honeypot filled → fake success, no send; "Enviar otro" resets fields and startedAt; honeypot not visible.
  PENDING: real delivery test once the user adds RESEND_API_KEY and verifies send.barrilito.dev.
- RDD: range 42852c7..ff818dc declined by user; range 7eaa8bd..31264d0 (medium) declined by user.

- T2b: user has no mailbox on barrilito.dev (DonDominio, no paid email) → CONTACT_TO_EMAIL required (no fallback),
  public email removed from contact-info section and lib/content.ts, error copy "Intenta de nuevo más tarde.",
  dead legacy components/contact-section.tsx deleted (it referenced the removed field). RED (4 failing copy asserts) → GREEN 161; tsc clean.

## Next step
User completes T0 (Resend domain + `vercel env add RESEND_API_KEY` + `vercel env add CONTACT_TO_EMAIL` + `vercel env pull`); then real send test (T3).
