# Feature: SEO and reliability follow-ups

Locator: `odd/tasks/seo-followups.md` · Engram mirror: `odd/seo-followups/tasks`
Branch: `claude/seo-followups-9784d0` (base `main` @ 787edc3)

## Objective
Apply the relevant advisory findings from the PR #22 native reviews
(`review-ac993c9f5b44c84c`, `review-c306cba04a6b3b6f`, `review-ce1c0cdc89fa7f58`).

## Why
- Maintenance mode 307-redirects every URL to a `noindex` page: a long maintenance window could
  make Google drop the home page. Planned downtime should answer `503` + `Retry-After` on the
  original URL so crawlers retry instead of deindexing.
- `lib/seo.ts` parses `contactInfo.location` without guarding its shape.
- The contact action's client-key lookup (now async `headers()`) has no test.
- `package.json` does not pin the Node version Next 16 requires (>= 20.9).

## Scope
- T1 `lib/maintenance.ts`: replace unused constants with a pure `resolveMaintenanceAction(pathname, enabled)`
  (+ test); `proxy.ts` rewrites to `/maintenance` with `503` + `Retry-After` during maintenance.
- T2 `lib/seo.ts`: `postalAddress` omits missing parts (+ test).
- T3 `lib/contact.ts`: pure `clientKeyFromHeaders(headers)` (+ test); `app/actions/contact.ts` uses it.
- T4 `package.json`: `engines.node` pinned to the supported LTS lines.

## Constraints
- Next.js 16 proxy (Node runtime), pnpm, vitest. Maintenance switch stays `NEXT_PUBLIC_MAINTENANCE_MODE`.
- Behavior outside maintenance mode unchanged (`/maintenance` still redirects to `/`).

## TDD
Mode: strict (source: user global CLAUDE.md "Strict TDD Mode: enabled"). Runner: `pnpm test` (vitest).
Pure logic RED→GREEN→REFACTOR; proxy wiring verified with a production build and `curl`.

## Delivery
Strategy: ask-on-risk. Forecast: ~180 authored changed lines → single PR. Work-unit commits on the
feature branch; push/PR are the owner's decision (owner asked to continue after merging PR #22).

## Tasks
- [x] T1 Maintenance mode answers 503 + Retry-After via rewrite. Route: inline (pure module + test + proxy).
  TDD: RED 6 failing (`resolveMaintenanceAction` missing) → GREEN 6/6; suite 271/271; tsc, lint OK.
  Prod build with `NEXT_PUBLIC_MAINTENANCE_MODE=true` + `next start`: `GET /` → 503, `retry-after: 3600`,
  maintenance content on `/`; `/robots.txt` 200. Normal build: `/` 200, `/maintenance` 307 → `/`.
- [x] T2 Guard postal address parsing. Route: inline.
  TDD: RED 3 failing (`postalAddress` not exported) → GREEN 14/14; tsc OK. Blank parts dropped; blank location → no `address`.
- [x] T3 Testable client-key extraction. Route: inline.
  TDD: RED 4 failing (`clientKeyFromHeaders` missing) → GREEN; suite 278/278; tsc, lint OK. Action now calls
  `clientKeyFromHeaders(await headers())`; `x-real-ip` is also trimmed.
- [x] T4 Pin Node engine. Route: inline (one line).
  `engines.node: "22.x || 24.x"`: both LTS lines Next 16 supports (>= 20.9) and Vercel runs; Node 20 is deprecated
  on Vercel from 2026-10-01, and an open `>=` range would silently jump to future majors. Checks: frozen install, build OK.

Not applied: React Compiler lint warnings refactor (separate feature, touches the 3D board).

## Acceptance criteria
- With `NEXT_PUBLIC_MAINTENANCE_MODE=true`, `GET /` returns `503`, `Retry-After`, maintenance content, URL unchanged.
- Without it, `/` returns 200 and `/maintenance` redirects to `/`.
- `pnpm test`, `pnpm lint`, `tsc --noEmit`, `pnpm build` pass.

## Progress
- T1–T4 done. Branch review (owner granted): lineage review-0bacd0a25dd03be6 approved + acknowledged.
  Accepted WARNING R3-001: new `proxy.test.ts` drives `proxy()` with a `NextRequest` (503 + Retry-After +
  rewrite target in maintenance, pass-through and 307 home outside it); `proxy.ts` imports `./lib/maintenance`
  relatively so vitest resolves it. Suite 282/282, tsc, lint, build OK.
  Not applied SUGGESTION R3-002: no end-to-end test that `buildJsonLd` omits `address` for a blank location
  (would need to mock `lib/content`; helper itself is covered).
- Next: owner decides push/PR.
