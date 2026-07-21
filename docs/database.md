# Kireeye Database Documentation & Schema Backup

Snapshot of the **live** Supabase database (project `inudfriwqiegtnrnqcov`) taken 2026-07-21, immediately **before** applying migration `security_hardening_rls_v1`. The live database is the source of truth; the old `supabase/phase*.sql` files are historical snapshots and are superseded by `supabase/migrations/`.

## Migration history (live, tracked in supabase_migrations.schema_migrations)
17 migrations from `20260720165641 create_app_role_type` through `20260720170255 payment_notifications`. The database was built through the Supabase migration system — schema and repo phase files match in all verified objects.

## Enums
- `app_role`: super_admin, platform_admin, company_owner, company_employee, car_owner, customer
- `vehicle_status`: draft, pending_approval, available, reserved, rented, maintenance, suspended, rejected, archived
- `booking_status`: draft, pending, awaiting_payment, confirmed, in_progress, completed, cancelled, rejected, disputed, refunded
- `verification_status`: pending, approved, rejected, suspended

## Tables (columns; `*` = NOT NULL)
- **profiles**: id uuid*, full_name text*, phone, email, preferred_language, avatar_url, created_at
- **user_roles**: user_id uuid*, role app_role*
- **companies**: id*, owner_id*, name*, slug*, phone, whatsapp, email, status verification_status, commission_percent numeric, created_at
- **company_employees**: id*, company_id, user_id, permissions jsonb, active bool
- **employee_invitations**: id*, company_id*, email*, role_name*, permissions*, invited_by*, status*, expires_at, created_at
- **locations**: id*, name*, city*, is_airport, active
- **vehicles**: id*, company_id, owner_id, name*, make*, model*, year, category, transmission, seats, driver_available, self_drive_allowed, intercity_allowed, price_hour/day/week/month numeric, location_id, status vehicle_status, rating, booking_count, description, deposit_amount, fuel_type, plate_number, featured, created_at
- **vehicle_images**: id*, vehicle_id*, storage_path*, public_url, sort_order, created_at
- **bookings**: id*, customer_id, vehicle_id, pickup_location_id, dropoff_location_id, pickup_at*, return_at*, rental_type*, driver_required, subtotal*, commission_amount, total*, status booking_status, created_at
- **payments**: id*, booking_id, method*, amount*, currency, reference, status, proof_url, reviewed_by, reviewed_at, rejection_reason, created_at
- **reviews**: id*, booking_id (UNIQUE — one review per booking), customer_id, vehicle_id, rating int 1–5 (CHECK), comment, created_at
- **notifications**: id*, user_id*, title*, body*, type*, link, read_at, created_at
- **verification_documents**: id*, user_id*, company_id, vehicle_id, document_type*, storage_path*, status*, rejection_reason, reviewed_by, reviewed_at, created_at
- **payment_methods**: id*, name*, account_name, account_number, instructions jsonb, active, sort_order, created_at
- **site_settings**: key*, value jsonb*, updated_by, updated_at
- **support_tickets**: id*, user_id*, booking_id, subject*, message*, priority, status, assigned_to, created_at, updated_at
- **audit_logs**: id*, actor_id, action*, entity_type*, entity_id, metadata jsonb, created_at

Row counts at snapshot: profiles 2, user_roles 2, vehicles 4, vehicle_images 4, locations 4, payment_methods 5, site_settings 4; all transactional tables empty.

## Functions (public schema)
handle_new_user (SECURITY DEFINER, hardened — signup can only self-select customer/company_owner/car_owner), has_role, is_platform_admin, owns_company (all SECURITY DEFINER — safe for use inside RLS without recursion), prevent_overlapping_bookings, recalculate_vehicle_rating, after_review_change, increment_vehicle_booking_count, notify_booking_change, notify_payment_change, slugify_company_name.

## Triggers
- auth.users: `on_auth_user_created` → handle_new_user
- bookings: `prevent_booking_overlap` (BEFORE INSERT OR UPDATE OF vehicle_id, pickup_at, return_at, status — tstzrange overlap guard), `booking_confirmation_counter`, `booking_notification_trigger`
- payments: `payment_notification_trigger`
- reviews: `reviews_recalculate_vehicle_rating`

## Storage buckets
- `vehicle-images` (public), `payment-proofs` (private), `verification-documents` (private); 7 storage RLS policies.

## RLS
RLS is ENABLED on all 17 public tables (45 policies at snapshot). Full policy inventory reviewed 2026-07-21.

### Security issues found in the live policy set (fixed by `security_hardening_rls_v1`)
1. **companies / "employees read their company"** contained a self-join bug (`ce.company_id = ce.id`), so employees could never read their own company. Fixed to `ce.company_id = companies.id`.
2. **bookings / "customers create own bookings"** allowed direct browser INSERTs with arbitrary `subtotal`/`total`, bypassing server-side pricing. Removed — bookings are created only by the server API (service role).
3. **payments / "customers insert own booking payments"** allowed customers to insert payment rows with any status (e.g. self-approved). Removed — payments are created only by the server API.
4. **audit_logs / "authenticated create audit logs"** let any user forge audit entries. Replaced with an admin-only client policy; server writes bypass RLS.
5. **reviews** had no SELECT policy (reviews unreadable by anyone client-side) and the INSERT policy did not require a completed booking. Added public read, admin manage, and a completed-booking + vehicle-match + ownership requirement on insert.
6. **Defense in depth:** new `protect_booking_financials` trigger blocks client-side changes to booking customer/vehicle/money columns; only the server may change them.

### Accepted-for-now (revisit in later phases)
- Companies with any booking (not only active) can read that customer's profile.
- `vehicles` public read is gated on `status = 'available'`; the approval workflow (Phase 4) will manage transitions draft → pending_approval → available.
