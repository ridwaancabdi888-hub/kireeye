# Kireeye Supabase SQL

**Source of truth:** the live Supabase project (`inudfriwqiegtnrnqcov`) and its tracked migration history (`supabase_migrations.schema_migrations`, 17 baseline migrations from 2026-07-20).

- `migrations/` — new ordered, idempotent migrations. Every schema change from 2026-07-21 onward lives here and is applied through the Supabase migration system so repo and live database stay in sync.
- `schema.sql`, `auth_setup.sql`, `phase2.sql` … `phase6_booking_integrity.sql` — **DEPRECATED historical snapshots** kept for reference only. Do not run them; the live database already contains their contents (verified 2026-07-21, see `docs/database.md`).
