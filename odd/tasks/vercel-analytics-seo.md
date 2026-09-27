# Feature: Next.js 16 upgrade + Vercel Analytics + SEO

Locator: `odd/tasks/vercel-analytics-seo.md` · Engram mirror: `odd/vercel-analytics-seo/tasks`
Branch: `claude/vercel-analytics-seo-9784d0` (base `main` @ 83c2a1d)

## Objective
Measure real traffic and Core Web Vitals with Vercel Web Analytics + Speed Insights, close the SEO
gaps (robots, sitemap, canonical, structured data, favicon, noindex on maintenance), and first bring
the framework up to date (Next.js 14.2.16 → 16, React 18 → 19).

## Why
- No telemetry today: no visibility into visits, referrers or field performance (Google ranks on CWV).
- `/robots.txt` and `/sitemap.xml` do not exist, there is no canonical or JSON-LD, `/favicon.ico`
  404s (icon lives at `public/assets/favicon.ico`) and `/maintenance` is indexable.
- Next.js 14.2.16 misses security patches (e.g. CVE-2025-29927 middleware bypass, fixed in 14.2.25)
  and is two majors behind (latest 16.3.6). Owner chose to upgrade to 16 first (2026-09-26).

## Scope
- T1 upgrade: `package.json`/`pnpm-lock.yaml` (next, react, react-dom, types, eslint 9,
  eslint-config-next), `.eslintrc.json` → `eslint.config.mjs`, `lint` script → ESLint CLI,
  `middleware.ts` → `proxy.ts` (`proxy` export), `app/actions/contact.ts` (`await headers()`),
  `useFormState` → `useActionState` in `contact-form.tsx` and `project-brief.tsx`.
- T2 analytics: `@vercel/analytics`, `@vercel/speed-insights` in `app/layout.tsx`; proxy matcher skips `_vercel`.
- T3 SEO: pure `lib/seo.ts` (+ test) with robots/sitemap/JSON-LD builders; `app/robots.ts`,
  `app/sitemap.ts`, JSON-LD in `app/page.tsx`; layout metadata (canonical, authors, robots,
  viewport themeColor); `app/favicon.ico`; maintenance `noindex`; proxy matcher skips robots/sitemap.

## Constraints
- Next.js App Router, pnpm, Tailwind 3, plain three.js (no r3f). Node 22 locally; Next 16 needs >= 20.9.
- `package-lock.json` is stale legacy, left untouched (pnpm is the package manager).
- Site copy stays in Spanish (MX); code/identifiers in English. SSR `ClassicHome` stays the crawlable content.
- Web Analytics and Speed Insights must be enabled in the Vercel dashboard by the owner.

## TDD
Mode: strict (source: user global CLAUDE.md "Strict TDD Mode: enabled"). Runner: `pnpm test` (vitest).
Pure logic (`lib/seo.ts`) RED→GREEN→REFACTOR; framework wiring verified by `tsc`, lint, build and browser.

## Delivery
Strategy: ask-on-risk. Forecast: ~330 authored changed lines (lockfile excluded) → under the ~400
budget, but owner asked for two PRs: PR 1 = T1 (upgrade), PR 2 = T2+T3 (analytics + SEO).
Work-unit commits on the feature branch; push/PR are the owner's decision.

## Tasks
- [x] T1 Upgrade to Next.js 16 + React 19 + ESLint 9 flat config + proxy. Route: inline (mechanical, already mapped by exploration: 1 server action, 2 hook swaps, config renames).
  Evidence: next 16.3.6, react 19.3.0, eslint 9.39.5; `tsconfig.json` rewritten by `next build` (jsx react-jsx, target ES2017).
  eslint-config-next 16 adds React Compiler rules: `react-hooks/refs` and `react-hooks/set-state-in-effect`
  flag pre-existing patterns (board-game, use-board-scene, render-mode-context, contact-form, project-brief) →
  set to `warn` (follow-up refactor, not in scope); `tailwind.config.ts` require → ESM import.
  Checks: `pnpm test` 254/254, `pnpm lint` 0 errors (12 warnings), `tsc --noEmit` OK, `pnpm build` OK;
  browser: 3D board renders, no console errors; contact form submit → server action ran, error state shown, fields kept.
  Pre-existing unrelated: `@types/node` 20.17 below vitest 5 peer range.
  Commit 9674bd2. RDD: medium, granted → lineage review-ce1c0cdc89fa7f58 approved + acknowledged (burned).
  Advisory (SUGGESTION, not applied): async client key untested; Node engine unpinned; compiler rules downgraded; no automated useActionState assertion.
- [x] T2 Vercel Web Analytics + Speed Insights. Route: inline (layout + proxy matcher).
  Evidence: @vercel/analytics 2.0.1, @vercel/speed-insights 2.0.0 at end of `<body>`; proxy matcher skips `_vercel`.
  Checks: `tsc` OK, lint 0 errors; browser dev: both debug scripts load, pageview logged to `/_vercel/insights/view`, no errors.
  Commit 9035582. RDD: medium, under_budget (87 lines) → pending in slice with T3.
- [x] T3 SEO: robots, sitemap, JSON-LD, canonical/viewport metadata, favicon, maintenance noindex. Route: inline (one new pure module + test, small wiring files).
  TDD: RED `lib/seo.test.ts` (module missing) → GREEN 11/11; full suite 265/265.
  Checks: `tsc` OK, lint 0 errors, `pnpm build` OK (`/robots.txt`, `/sitemap.xml` static); dev server:
  robots/sitemap/favicon 200, canonical + theme-color + robots/googlebot meta present, JSON-LD parses;
  built `/maintenance` has `noindex, nofollow`; no console errors.
  Commit 9b6d9d7. RDD: slice 9674bd2..9b6d9d7 medium, under_budget (313 lines) → no review due; stays pending.

## Acceptance criteria
- `pnpm test`, `pnpm lint`, `tsc --noEmit`, `pnpm build` pass on Next 16.
- Contact form and quote brief still submit (server action + `useActionState`).
- `/robots.txt`, `/sitemap.xml`, `/favicon.ico` return 200; home has canonical, theme-color and a valid JSON-LD graph; `/maintenance` is `noindex`.
- Analytics and Speed Insights scripts load (debug mode in dev) with no console errors.

## Progress
- T1, T2, T3 done. Next: owner decides push/PRs (PR 1 = up to 9674bd2, PR 2 = 9035582..9b6d9d7).
- Full-branch review (owner granted): lineage review-c306cba04a6b3b6f approved + acknowledged.
  Accepted WARNING R3-robots-disallow-hides-noindex: robots.txt no longer disallows /maintenance
  (a disallow would hide its noindex from crawlers). SUGGESTIONS not applied: async client key
  untested; maintenance inherits canonical "/" (harmless under noindex).
- Owner actions after deploy: enable Web Analytics + Speed Insights in the Vercel dashboard; set
  `NEXT_PUBLIC_SITE_URL=https://barrilito.dev` if the custom domain differs from the Vercel production
  domain; submit the sitemap in Google Search Console.
- Follow-ups: refactor the 5 React Compiler lint warnings and restore those rules to `error`; pin Node engine (>= 20.9).
