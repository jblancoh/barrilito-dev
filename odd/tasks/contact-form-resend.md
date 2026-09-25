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
- Provision Resend via Vercel Marketplace (`resend/resend-email`, domain `send.barrilito.dev`, region `us-east-1`).
- New pure module `lib/contact.ts` (+ test): payload validation/normalization, honeypot + minimum
  fill-time checks, best-effort in-memory per-IP rate limiter.
- New Server Action `app/actions/contact.ts`: validate → spam checks → rate limit → send with Resend.
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
- [ ] T0 Provision Resend integration and pull env vars — route: inline (CLI state). Status: blocked on user browser setup step.
- [x] T1 `lib/contact.ts` + `lib/contact.test.ts`: validation, honeypot, min fill time, rate limiter — route: delegated writer (2 non-trivial files).
- [ ] T2 Server Action + form wiring with Resend — route: delegated writer (2+ non-trivial files). Depends on T0 env var names.
- [ ] T3 Verify: tests, `tsc`, lint, build, browser submit (success, validation error, honeypot) — route: inline/per-action.

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

## Next step
User completes the Resend browser setup; meanwhile T1.
