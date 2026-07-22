# Phase 1 Verification — Database Security Hardening

Date: 2026-07-21 · Migration: `security_hardening_rls_v1` (applied to live DB and tracked in migration history)

## Verified directly in the live database after applying the migration

| # | Issue | Status |
|---|---|---|
| 1 | Employee→company read policy self-join bug (`ce.company_id = ce.id`) | **FIXED** — policy now matches `ce.company_id = companies.id`; employees of a company can read it |
| 2 | Client-side booking INSERT with arbitrary prices | **FIXED** — no customer INSERT policy remains on `bookings`; only the server API (service role) creates bookings |
| 3 | Client-side payment INSERT with arbitrary status (self-approval) | **FIXED** — no customer INSERT policy remains on `payments`; only the server API creates payments |
| 4 | Forgeable audit logs by any authenticated user | **FIXED** — client INSERT now requires `is_platform_admin()` and matching `actor_id`; server writes bypass RLS |
| 5 | Reviews unreadable + no completed-booking requirement | **FIXED** — `reviews public read` (SELECT), `admins manage reviews` (ALL), and INSERT now requires the reviewer's own **completed** booking for the same vehicle; `unique(booking_id)` enforces one review per booking |
| 6 | Defense in depth for booking money columns | **ADDED** — `protect_booking_financials` trigger confirmed live on `bookings`; client sessions cannot change customer/vehicle/subtotal/commission/total |

## Advisor-equivalent checks (run via SQL; the managed advisor endpoint requires a separate tool approval)

- SECURITY DEFINER functions without a pinned `search_path`: **none** — all pass.
- Foreign keys without a leading index: **none** — all FK columns are indexed.
- RLS enabled on all 17 public tables: **confirmed**.

## Data safety

No rows were deleted or modified; the migration only changed policies, one function, and one trigger. Pre-migration schema is preserved in `docs/database.md`.
