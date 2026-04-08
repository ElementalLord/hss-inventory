# Backup and Recovery Guide

## What to back up

- Supabase database schema and data.
- `users`, `items`, `transactions`, `item_reservations`, `checkin_reports`, and `app_audit_log`.
- Edge function source in `supabase/functions/`.
- Migrations in `supabase/migrations/`.

## Backup routine

1. Export the database regularly with Supabase CLI or the hosted backup tools.
2. Keep a copy of the latest `supabase/migrations/` folder in git.
3. Verify that audit log rows are present for user and inventory changes.
4. Store at least one off-site copy of the SQL export.

## Suggested snapshot command

If you use the Supabase CLI locally, create a database dump from the connected project and store it outside the repo.

## Recovery checklist

1. Restore the latest database backup into a clean Supabase project or a staging copy first.
2. Re-run migrations from `supabase/migrations/` in order.
3. Deploy edge functions again, especially `send-otp` and `privileged-action`.
4. Confirm the developer account still exists and cannot be deleted.
5. Check that `app_audit_log` is receiving new rows after a test edit.
6. Validate login, user approval, role change, item add/edit/delete, and restore flows.

## Extra safety notes

- Test restores before you need them.
- Keep one protected privileged account offline and documented.
- After any schema change, repeat a backup and restore smoke test.
