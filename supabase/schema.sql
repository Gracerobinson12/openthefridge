-- Open the Fridge database schema
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- Run it once on a fresh project.

-- ───────────── Content filter ─────────────
-- Words that can't be posted anywhere (recipes, comments, names, groups).
-- Add more any time in Table Editor → blocked_words. Matching is whole-word and ignores case.
create table public.blocked_words (word text primary key);
insert into public.blocked_words (word) values
  ('fuck'), ('fucker'), ('fucking'), ('motherfucker'), ('shit'), ('shitty'), ('bullshit'),
  ('bitch'), ('cunt'), ('asshole'), ('dickhead'), ('whore'), ('slut'), ('porn'), ('nudes');

create function public.has_blocked_word(t text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from blocked_words w where coalesce(t, '') ~* ('\m' || w.word || '\M'));
$$;

-- ───────────── Profiles ─────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null check (username ~ '^[a-z0-9._]{3,24}$'),
  display_name text not null default '',
  avatar_url text,
  bio text check (char_length(bio) <= 80),
  tiktok_handle text,
  is_admin boolean not null default false,
  banned boolean not null default false,
  terms_accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false);
$$;

-- Not banned: used by every "create" rule below.
create function public.can_post() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select not banned from profiles where id = auth.uid()), false);
$$;

-- Create a profile automatically when someone signs up.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, display_name, terms_accepted_at)
  values (
    new.id,
    lower(coalesce(new.raw_user_meta_data ->> 'username', 'cook' || substr(new.id::text, 1, 8))),
    coalesce(new.raw_user_meta_data ->> 'display_name', ''),
    nullif(new.raw_user_meta_data ->> 'terms_accepted_at', '')::timestamptz
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Lets the sign-up screen check a username before creating the account.
create function public.username_available(name text) returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (select 1 from profiles where username = lower(name))
     and not public.has_blocked_word(name);
$$;
grant execute on function public.username_available(text) to anon, authenticated;

-- People can't make themselves admins or un-ban themselves.
-- (Runs as the caller, so the dashboard / SQL editor can still set them.)
create function public.protect_profile_flags() returns trigger
language plpgsql set search_path = public as $$
begin
  if (new.is_admin is distinct from old.is_admin or new.banned is distinct from old.banned)
     and not public.is_admin() and current_user = 'authenticated' then
    raise exception 'Not allowed';
  end if;
  return new;
end $$;
create trigger protect_profile_flags before update on public.profiles
  for each row execute function public.protect_profile_flags();

-- ───────────── Recipes ─────────────
create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  category text not null check (category in ('Desserts','Appetizers','Breakfast','Lunch','Party Food','Holiday')),
  total_time text not null default '' check (char_length(total_time) <= 40),
  servings text not null default '' check (char_length(servings) <= 40),
  ingredients jsonb not null default '[]',
  steps jsonb not null default '[]',
  photos text[] not null default '{}' check (cardinality(photos) <= 8),
  slide_order text[],
  is_public boolean not null default true,
  is_hidden boolean not null default false, -- set automatically after several reports, or by an admin
  -- Imported from a video: credit + link back to the original creator
  source_url text check (source_url ~ '^https://'),
  source_platform text check (source_platform in ('youtube', 'tiktok')),
  source_author text check (char_length(source_author) <= 100),
  source_thumbnail text check (source_thumbnail ~ '^https://'),
  created_at timestamptz not null default now()
);
create index recipes_created_idx on public.recipes (created_at desc);

create table public.likes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

-- "Save to Tin"
create table public.saves (
  user_id uuid not null references public.profiles (id) on delete cascade,
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

-- ───────────── Groups ─────────────
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  color text not null default '#C3DEFF',
  owner_id uuid not null references public.profiles (id) on delete cascade,
  invite_code text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 6)),
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table public.group_recipes (
  group_id uuid not null references public.groups (id) on delete cascade,
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  shared_by uuid not null references public.profiles (id) on delete cascade,
  note text check (char_length(note) <= 200),
  created_at timestamptz not null default now(),
  primary key (group_id, recipe_id)
);

-- Membership check used by policies (security definer avoids policy recursion).
create function public.is_group_member(gid uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from group_members where group_id = gid and user_id = auth.uid());
$$;

-- Owner automatically becomes a member.
create function public.add_owner_as_member() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into group_members (group_id, user_id) values (new.id, new.owner_id);
  return new;
end $$;
create trigger on_group_created after insert on public.groups
  for each row execute function public.add_owner_as_member();

-- Join a group with its invite code.
create function public.join_group(code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare gid uuid;
begin
  if not public.can_post() then raise exception 'Your account can’t join groups right now.'; end if;
  select id into gid from groups where invite_code = upper(trim(code));
  if gid is null then raise exception 'No group with that code'; end if;
  insert into group_members (group_id, user_id) values (gid, auth.uid()) on conflict do nothing;
  return gid;
end $$;

-- ───────────── Word filter on everything people write ─────────────
create function public.check_words() returns trigger
language plpgsql security definer set search_path = public as $$
declare txt text;
begin
  -- Only the fields people type (not photo links or ids).
  select string_agg(value, ' ') into txt
  from jsonb_each_text(to_jsonb(new))
  where key in ('title', 'total_time', 'servings', 'ingredients', 'steps', 'body',
                'username', 'display_name', 'bio', 'tiktok_handle', 'name', 'note');
  if public.has_blocked_word(txt) then
    raise exception 'Please keep it kind. That wording isn’t allowed on Open the Fridge.';
  end if;
  return new;
end $$;
create trigger check_words before insert or update on public.recipes for each row execute function public.check_words();
create trigger check_words before insert or update on public.comments for each row execute function public.check_words();
create trigger check_words before insert or update on public.profiles for each row execute function public.check_words();
create trigger check_words before insert or update on public.groups for each row execute function public.check_words();
create trigger check_words before insert or update on public.group_recipes for each row execute function public.check_words();

-- ───────────── Reports, blocks, moderation ─────────────
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  recipe_id uuid references public.recipes (id) on delete cascade,
  comment_id uuid references public.comments (id) on delete cascade,
  reported_user_id uuid references public.profiles (id) on delete cascade,
  reason text not null check (char_length(reason) <= 300),
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);

-- Hide a recipe automatically once 3 different people report it, until an admin reviews it.
create function public.auto_hide_reported() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.recipe_id is not null and (
    select count(distinct reporter_id) from reports where recipe_id = new.recipe_id and status = 'open'
  ) >= 3 then
    update recipes set is_hidden = true where id = new.recipe_id;
  end if;
  return new;
end $$;
create trigger auto_hide_reported after insert on public.reports
  for each row execute function public.auto_hide_reported();

create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

-- ───────────── Row level security ─────────────
alter table public.blocked_words enable row level security;
alter table public.profiles enable row level security;
alter table public.recipes enable row level security;
alter table public.likes enable row level security;
alter table public.saves enable row level security;
alter table public.comments enable row level security;
alter table public.follows enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_recipes enable row level security;
alter table public.reports enable row level security;
alter table public.blocks enable row level security;
-- (blocked_words has no policies: only you, in the Supabase dashboard, can see or change it.)

create policy "profiles are readable" on public.profiles for select to authenticated using (true);
create policy "edit own profile" on public.profiles for update to authenticated using (id = auth.uid() or public.is_admin());

create policy "read visible recipes" on public.recipes for select to authenticated using (
  author_id = auth.uid() or public.is_admin()
  or (not is_hidden and (
    is_public
    or exists (select 1 from group_recipes gr where gr.recipe_id = id and public.is_group_member(gr.group_id))
  ))
);
create policy "create own recipes" on public.recipes for insert to authenticated with check (author_id = auth.uid() and public.can_post());
create policy "edit own recipes" on public.recipes for update to authenticated using (author_id = auth.uid() or public.is_admin());
create policy "delete own recipes" on public.recipes for delete to authenticated using (author_id = auth.uid() or public.is_admin());

create policy "likes readable" on public.likes for select to authenticated using (true);
create policy "like as self" on public.likes for insert to authenticated with check (user_id = auth.uid());
create policy "unlike as self" on public.likes for delete to authenticated using (user_id = auth.uid());

create policy "own saves" on public.saves for select to authenticated using (user_id = auth.uid());
create policy "save as self" on public.saves for insert to authenticated with check (user_id = auth.uid());
create policy "unsave as self" on public.saves for delete to authenticated using (user_id = auth.uid());

create policy "comments readable" on public.comments for select to authenticated using (true);
create policy "comment as self" on public.comments for insert to authenticated with check (author_id = auth.uid() and public.can_post());
create policy "delete own comments" on public.comments for delete to authenticated using (author_id = auth.uid() or public.is_admin());

create policy "follows readable" on public.follows for select to authenticated using (true);
create policy "follow as self" on public.follows for insert to authenticated with check (follower_id = auth.uid());
create policy "unfollow as self" on public.follows for delete to authenticated using (follower_id = auth.uid());

create policy "members see groups" on public.groups for select to authenticated using (public.is_group_member(id) or owner_id = auth.uid() or public.is_admin());
create policy "create groups" on public.groups for insert to authenticated with check (owner_id = auth.uid() and public.can_post());
create policy "owner edits group" on public.groups for update to authenticated using (owner_id = auth.uid());
create policy "owner deletes group" on public.groups for delete to authenticated using (owner_id = auth.uid() or public.is_admin());

create policy "members see members" on public.group_members for select to authenticated using (public.is_group_member(group_id));
create policy "leave group" on public.group_members for delete to authenticated using (user_id = auth.uid());

create policy "members see group recipes" on public.group_recipes for select to authenticated using (public.is_group_member(group_id));
create policy "members share to group" on public.group_recipes for insert to authenticated
  with check (shared_by = auth.uid() and public.is_group_member(group_id) and public.can_post());
create policy "sharer removes" on public.group_recipes for delete to authenticated using (shared_by = auth.uid() or public.is_admin());

create policy "file reports" on public.reports for insert to authenticated with check (reporter_id = auth.uid());
create policy "admins read reports" on public.reports for select to authenticated using (public.is_admin());
create policy "admins resolve reports" on public.reports for update to authenticated using (public.is_admin());

create policy "own blocks" on public.blocks for select to authenticated using (blocker_id = auth.uid());
create policy "block as self" on public.blocks for insert to authenticated with check (blocker_id = auth.uid());
create policy "unblock as self" on public.blocks for delete to authenticated using (blocker_id = auth.uid());

-- ───────────── Photo storage ─────────────
-- Photos are shrunk in the app before upload; 5 MB is a safety cap.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('recipe-photos', 'recipe-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "anyone can view recipe photos" on storage.objects for select
  using (bucket_id = 'recipe-photos');
create policy "upload into own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'recipe-photos' and (storage.foldername(name))[1] = auth.uid()::text and public.can_post());
create policy "delete own photos" on storage.objects for delete to authenticated
  using (bucket_id = 'recipe-photos' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- ───────────── Video imports (TikTok / YouTube → recipe) ─────────────
-- Written only by the import-recipe Edge Function (no policies = not reachable from the app directly).
create table public.import_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  url text not null,
  created_at timestamptz not null default now()
);
create index import_log_user_idx on public.import_log (user_id, created_at desc);
alter table public.import_log enable row level security;

-- Same video imported twice? Reuse the first result instead of calling the AI again.
create table public.import_cache (
  url text primary key,
  result jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.import_cache enable row level security;

-- ───────────── Account deletion (required by the App Store) ─────────────
create function public.delete_my_account() returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from auth.users where id = auth.uid();
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ───────────── Make yourself the admin ─────────────
-- After you sign up in the app, run this once (with your username) so you can
-- see reports and remove posts from Profile → Moderation:
--   update public.profiles set is_admin = true where username = 'yourusername';
