# Kireeye — Full Repository & System Audit Report

Date: 2026-07-21 · Auditor: Claude (AI engineering assistant) · Branch: main

## Verification legend
Every claim in this report is tagged with how it was verified:
- **[BUILD]** Build verified — `npm run typecheck` and `npm run build` executed in a clean environment
- **[CODE]** Code reviewed — source read and analyzed
- **[PUBLIC]** Public page tested — live production URL fetched and inspected
- **[MANUAL]** Requires manual authenticated test by the project owner
- **[DB-PENDING]** Requires live Supabase inspection (connector being enabled)

## 1. Executive summary

The repository is a **thin but clean prototype**: 58 TypeScript files, ~2,100 lines of code total. Strict TypeScript passes with zero errors and the production build succeeds. **[BUILD]** There is no unsafe `any`, no `@ts-ignore`, and no deprecated Supabase auth helpers (`@supabase/ssr` is used correctly). **[CODE]**

The honest headline: **most of the specified Kireeye system does not exist yet.** The audit found fewer bugs than expected because there is simply not much code. The project needs building far more than fixing. The largest existing page is 107 lines; entire specified subsystems (granular employee permissions UI, notifications engine, document verification flow, support tickets, city/airport pages, company public profiles, featured vehicles, platform settings management, i18n coverage) are absent or skeletal.

## 2. What already works

- Clean install, typecheck, and production build all pass. **[BUILD]**
- Route protection middleware exists for /customer, /company, /admin with role-based redirects. **[CODE]**
- Server-side booking pricing: prices are computed on the server from DB values, never trusted from the browser. **[CODE]** (app/api/bookings/route.ts)
- DB-level booking overlap prevention via a `tstzrange` trigger (supabase/phase6_booking_integrity.sql). **[CODE]** — application to live DB **[DB-PENDING]**
- Signup role escalation was hardened in phase3: only customer / company_owner / car_owner can be self-selected at signup; admin roles cannot. **[CODE]** — live application **[DB-PENDING]**
- Server routes check permissions through lib/access-control.ts before using the service-role client. **[CODE]**
- 50 RLS policies exist across the SQL files. **[CODE]** — live state **[DB-PENDING]**
- Audit log inserts exist for booking creation. **[CODE]**

## 3. Critical issues (P0 — fix immediately)

### P0-1 · Middleware trusts client-writable metadata for role routing
`middleware.ts`: `role = data?.role || user.user_metadata?.role || "customer"`.
`user_metadata` can be set by the user themselves via `supabase.auth.updateUser()`. A customer who writes `role: "super_admin"` into their own metadata passes the middleware gate to `/admin` whenever the `user_roles` lookup returns null. Actual data exposure then depends entirely on RLS — defense collapses to a single layer. **Fix: remove the metadata fallback; roles come only from `user_roles`.** **[CODE]** → Fixed in commit accompanying this report.

### P0-2 · Middleware fails open
If Supabase env vars are missing, `middleware.ts` returns `NextResponse.next()` — all protected routes become publicly reachable. Fail closed on protected paths instead. **[CODE]** → Fixed in commit accompanying this report.

### P0-3 · Live database vs repo SQL drift is unverified
Seven SQL files (schema, auth_setup, phase2–6) were applied by hand in unknown order. Whether the live database actually contains the phase3 hardened trigger, the phase6 overlap trigger, and all 50 policies is unknown until live inspection. **[DB-PENDING]**

## 4. High-priority issues (P1)

- **No migration system.** SQL lives in ad-hoc phase files. Must become ordered, idempotent migrations under `supabase/migrations/`, baselined against the live schema without touching data.
- **Compressed single-line pages.** Ten+ pages are minified JSX on one line (admin dashboard: a 2,629-character line). Unreadable and unmaintainable; must be reformatted and split into components. **[CODE]**
- **Six layered CSS patch files** (globals, mobile, phase2, phase3, dashboard-mobile-menu, image-tools) instead of a design system. Consolidate carefully, preserving the working mobile fixes. **[CODE]**
- **Hardcoded fallback vehicles** in lib/marketplace-data.ts render when the DB query fails or returns empty, using fragile Wikimedia `Special:Redirect` URLs. Spec forbids demo vehicles masquerading as inventory. Replace with an honest empty/error state. **[CODE]**
- **Booking API gaps:** driver fee is hardcoded at $15/day (should be per-vehicle or a platform setting); non-cash bookings create no payment row until proof upload, leaving `awaiting_payment` bookings with nothing for admins to track. **[CODE]**
- **Docs are absent** — docs/ contains one redeploy note. All specified guides missing.

## 5. Feature-gap inventory vs specification

| Area | Exists | Missing |
|---|---|---|
| Public site | Home, vehicles list/detail, about, contact, support, terms, privacy, partners, auth pages | City pages, airport pages, company listings/profiles, featured vehicles, most-rented, reviews display, how-it-works richness |
| Customer | Dashboard, bookings, payments proof, reviews, notifications, profile (all skeletal) | Document verification flow, favorites, real notification engine, spending stats |
| Company | Dashboard, vehicles/new, employees, onboarding (skeletal) | Granular permission enforcement UI, bookings calendar, earnings/reports, resubmission flow, employee invitation acceptance |
| Admin | Dashboard, approvals, users, companies, vehicles, bookings, payments, settings, audit-logs (skeletal) | Nearly all specified depth: search/filter across entities, commission config, company approval workflow, exports, notes |
| Platform | i18n scaffold (lib/i18n.ts), PWA manifest | Somali/English/Arabic coverage, RTL, seed data, settings management |

## 6. Prioritized implementation plan

1. **Phase 1 — Security & database foundation.** Fix P0-1/P0-2; connect live Supabase; dump live schema to docs/database.md as backup; diff against SQL files; create baselined idempotent migrations; verify/repair RLS, triggers, functions, indexes, storage buckets. No data deletion.
2. **Phase 2 — Design system & refactor.** One token-based design architecture; reformat compressed pages into readable components; consolidate CSS without breaking mobile fixes.
3. **Phase 3 — Public marketplace.** Real search + filters against approved vehicles only; honest empty states; vehicle detail completeness; city/airport/company pages.
4. **Phase 4 — Super Admin control center.** Full entity management with search/filter, approval workflows, payments verification, settings, audit views.
5. **Phase 5 — Company system.** Vehicle lifecycle, bookings management, employees + granular permissions, earnings.
6. **Phase 6 — Customer completion.** Documents, notifications, reviews, payment tracking.
7. **Phase 7 — Docs, seed data, final verification report, role-based manual test checklists.**

Each phase: build-verified locally → committed → pushed to main → Vercel deployment verified → manual-test checklist issued for authenticated flows.
