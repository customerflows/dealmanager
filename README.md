# Deal Manager

Real-money deal pipeline manager for Swiss real-estate acquisitions, migrated from a
Claude Artifact into a standalone Vite + React + TypeScript app with Supabase for
auth, storage, and per-user data isolation.

## Stack

- Vite + React 18 + TypeScript, Tailwind CSS
- Supabase: Postgres (RLS), Auth (email/password), Storage
- `src/DealManagerApp.tsx` — the original artifact UI, ported as-is (see "What changed" below)

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In **Project Settings → API**, copy the **Project URL** and **anon public key**.
3. Copy `.env.example` to `.env` and fill them in:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

## 2. Run the database migration

Open **SQL Editor** in the Supabase dashboard, paste the contents of
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql), and run it.

This creates:
- `profiles` (role: `user` | `admin`, auto-created on signup via trigger)
- `properties` — one row per deal; the flexible per-deal fields (purchase price,
  tenant schedule, sale units, etc.) live in a `data jsonb` column, mirroring what
  the UI already reads/writes
- `manual_persons` — contacts ("Personen" view)
- Row Level Security on all three: every user sees only their own rows; a `profiles.role
  = 'admin'` user sees everyone's (see `is_admin()` in the migration)
- A private `deal-documents` Storage bucket with matching per-user access policies,
  path convention `{user_id}/{property_id}/{filename}`

(Alternatively, if you have the Supabase CLI linked to the project: `supabase db push`.)

## 3. Run it locally

```bash
npm install
npm run dev
```

Sign up with an email/password on the login screen. That creates your `auth.users`
row and, via trigger, a matching `profiles` row with `role = 'user'`.

### Promote yourself to admin

In the SQL Editor:
```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```
Admins get a "Meine Deals" / "Alle Deals" toggle in the sidebar to see every user's
pipeline; everyone else only ever sees their own.

## 4. Deploy

Any static host works (`npm run build` outputs `dist/`). Config is included for:

- **Vercel** — `vercel.json` has the SPA rewrite. Import the repo, set
  `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` as environment variables, deploy.
- **Netlify** — `netlify.toml` has the build command and SPA redirect. Same env vars.
- **Cloudflare Pages** — build command `npm run build`, output directory `dist`, same
  env vars (Cloudflare Pages handles SPA fallback automatically for a Vite build).

Add your own domain in whichever platform's dashboard once deployed.

## What changed from the artifact

- **Storage**: `window.storage.get/set` (Claude Artifacts' sandbox KV API) is gone.
  `src/lib/dealsApi.ts` now talks to Supabase — it bulk-upserts the in-memory
  properties/persons array on every change (debounced 600ms) and deletes rows no
  longer present. This keeps the ~10k-line UI component's existing
  "one big array in state" pattern intact rather than rewriting every mutation
  site into granular row updates.
- **Auth**: `src/auth/` adds email/password sign-in via Supabase Auth. The app is
  gated behind it (`src/App.tsx`); signed-out users see a login screen instead of
  the deal pipeline.
- **Multi-user + admin**: every deal/contact is scoped to `user_id`; RLS enforces
  isolation at the database level (not just in the UI). Admins (`profiles.role =
  'admin'`) get a view-all toggle.
- **PDF storage**: uploaded PDFs are now archived in the private `deal-documents`
  bucket (they used to be discarded after extraction). A download link appears in
  the deal detail footer.
- **AI extraction — stubbed, not removed**: the artifact called
  `api.anthropic.com` directly from the browser, which only works inside the
  Artifacts sandbox (it injects auth you don't have in a real deployment — this
  call would fail with CORS/401 in production). `extractFromPDF()` /
  `extractFromMultiplePDFs()` in `DealManagerApp.tsx` are now stubs that return an
  empty, correctly-shaped result so uploads still create a deal (for manual
  entry) without erroring. The original extraction prompts and JSON-repair logic
  are preserved and ready to deploy in
  [`supabase/functions/extract-pdf/index.ts`](supabase/functions/extract-pdf/index.ts) —
  see the comment at the top of that file for the two steps to re-enable it
  (`supabase secrets set ANTHROPIC_API_KEY=...`, deploy the function, swap the
  stub for a `fetch` call).
- **`// @ts-nocheck`** at the top of `DealManagerApp.tsx`: the artifact is written
  in loose, untyped JS-in-TSX style throughout (no prop types anywhere). Rather
  than retrofit types across 10k lines, that one file opts out of type-checking;
  everything else in the project (`src/lib`, `src/auth`, `src/App.tsx`) is
  normal strict TypeScript.
- Everything else — the pipeline board, deal detail, KPI calculations, the
  Leaflet map (rendered via a self-contained `srcDoc` iframe pulling Leaflet
  from a CDN, unrelated to Artifacts), Case-Check/Ampel logic, fee models,
  investor memo — is unchanged.

## Known limitation

Saves are a full-array sync (upsert everything currently in state, delete
anything missing), not per-field row updates. Fine for a single person or small
team's deal count; if this ever needs real-time multi-editor collaboration on the
same deal, that's the first thing to rework (see `persistProperties` in
`src/lib/dealsApi.ts`).
