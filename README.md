# Micro SaaS - Automated Website Builder (Cloudflare Pages + Supabase)

## Overview

- **Generates** single-page landing sites from simple form inputs.
- **Stores** site definitions in Supabase table `sites`.
- **Serves** sites on subdomains like `{slug}.yourdomain.com` via Pages Functions, with `/s/{slug}` fallback.

## Stack

- **UI**: React + Vite (hosted on Cloudflare Pages)
- **Auth**: Supabase email/password
- **Data**: Supabase `sites` table (JSON data)
- **Edge render**: Cloudflare Pages Functions (React SSR to HTML)

## Setup

1. Create a Supabase project. Get `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
2. Create table `sites`:

```sql
create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  owner uuid references auth.users(id) on delete set null,
  slug text unique not null,
  data jsonb not null,
  created_at timestamp with time zone default now()
);
create index if not exists sites_slug_idx on public.sites (slug);
```

3. Row Level Security:

```sql
alter table public.sites enable row level security;
create policy "owners can upsert their sites" on public.sites
  for insert with check (auth.uid() = owner)
  using (auth.uid() = owner);
create policy "public read" on public.sites for select using (true);
```

4. Set env variables locally: create `.env` with

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Also set in `wrangler.toml` for Pages Function (or via Pages project settings):

```
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
ROOT_DOMAIN=yourdomain.com
```

## Develop

1. Install deps: `npm i`
2. Run: `npm run dev` (Vite)
3. Preview Pages Function locally: `npm run build` then `npm run pages:dev`
   - Visit http://localhost:8788/s/mybrand after you create a site.

## Deploy to Cloudflare Pages

1. Push to Git and connect repo to Cloudflare Pages.
2. Build command: `npm run build`
3. Output dir: `dist`
4. Functions: set directory `functions/` in Pages settings.
5. Set environment variables in Pages project.
6. To enable `{slug}.yourdomain.com`, add a wildcard DNS record `*.yourdomain.com` to your Pages project (subdomain) and set `ROOT_DOMAIN` to `yourdomain.com`.

## Notes

- This MVP renders a single Landing template. Add more templates in `templates/` and a `template` field in `sites.data` to switch.
- For custom domains per customer, continue using subdomain routing via Pages and DNS.
