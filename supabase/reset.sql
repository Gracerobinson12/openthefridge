-- ⚠️  RESET: wipes an existing Supabase project so schema.sql can be run fresh.
-- This permanently deletes ALL tables, data, functions and user accounts in the project.
-- Only run this on the old project you want cleared.
--
-- Supabase → SQL Editor → New query → paste this whole file → Run.
-- Supabase will warn that the query is destructive: confirm to run it.
-- Then run schema.sql in a new query.
-- (Photos in Storage are removed separately in the dashboard: see the end of this file.)

-- 1. Remove every old table, view, function and trigger in the app's schema, then recreate it empty.
drop schema if exists public cascade;
create schema public;
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on schema public to postgres, service_role;
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to postgres, anon, authenticated, service_role;

-- 2. Remove old sign-up triggers that pointed at the old tables.
drop trigger if exists on_auth_user_created on auth.users;

-- 3. Delete all old user accounts (they have no profile in the new app and couldn't log in properly).
delete from auth.users;

-- 4. Remove old access rules on photo storage (the new ones are created by schema.sql).
do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname = 'storage' and tablename = 'objects' loop
    execute format('drop policy if exists %I on storage.objects', p.policyname);
  end loop;
end $$;

-- 5. Old photos: in the dashboard go to Storage → for each old bucket: "…" → Empty bucket, then Delete bucket.
--    (Supabase doesn't allow deleting stored files from SQL.)
