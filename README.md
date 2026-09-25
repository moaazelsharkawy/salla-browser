# Salla Browser

Salla Browser is a PWA-first directory and browser experience for apps in the Salla ecosystem. It uses React + TypeScript + Vite + Tailwind + Supabase and is prepared for Capacitor packaging.

## Included

- Flat/soft responsive UI inspired by the current Salla product language.
- Arabic (Cairo) and English (Outfit), RTL/LTR.
- Smart top search: filters Salla apps while typing and can send URLs/web searches to the browser view.
- App directory, categories, country filtering, featured apps, verified/status badges.
- App details and embedded iframe browser with back/home/refresh/external-open controls.
- Email/password authentication.
- Optional biometric/passkey sign-in using WebAuthn + a Supabase Edge Function.
- Pinned/favorite apps and recent-open tracking.
- Developer app-submission flow with review states.
- Admin dashboard for apps, categories, and submission moderation.
- PWA install support and Capacitor config.
- Supabase migration with RLS, app asset bucket, passkey tables, and starter categories.

## Local setup

```bash
cp .env.example .env
npm install
npm run dev
```

Set:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
VITE_DEFAULT_SEARCH_ENGINE=https://www.google.com/search?q=
```

Without Supabase keys the public home page uses built-in demo cards so you can inspect the UI.

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/migrations/202609250001_initial.sql`.
3. Create your first normal account from the app.
4. Promote that account once from SQL Editor:

```sql
update public.profiles
set role = 'admin'
where email = 'YOUR_ADMIN_EMAIL';
```

5. Deploy the passkey Edge Function:

```bash
supabase functions deploy passkey --no-verify-jwt
```

6. Set Edge Function secrets:

```bash
supabase secrets set PASSKEY_RP_ID=your-domain.com
supabase secrets set PASSKEY_ORIGIN=https://your-domain.com
supabase secrets set PASSKEY_RP_NAME="Salla Browser"
```

For local passkey development use `PASSKEY_RP_ID=localhost` and `PASSKEY_ORIGIN=http://localhost:5173`.

## Passkeys / biometrics

The passkey flow does not store biometric data. WebAuthn keeps biometric verification on the device. The server stores the public credential, counter, and a short-lived challenge. After successful WebAuthn verification, the Edge Function generates a one-time Supabase magic-link token hash and the client exchanges it for a normal Supabase session.

Passkeys require HTTPS in production.

## Embedded browser limitation

A PWA cannot force every public website to load inside an iframe. Sites can block embedding with CSP or `X-Frame-Options`; Google search commonly does this. The browser therefore includes a prominent external-open fallback, and every listed app has an `embed_mode` (`iframe` or `external`) controlled by the admin.

For an Android/iOS release, the included `capacitor.config.ts` is the starting point for packaging. A native in-app-browser/WebView adapter can later be plugged into the same `/browse` route without changing the directory or admin data model.

## PWA build

```bash
npm run build
npm run preview
```

The Vite PWA plugin generates the service worker and installable manifest.

## Security decisions

- URLs are normalized and `javascript:`, `data:`, `file:` and `vbscript:` inputs are rejected client-side.
- Directory publishing and category management are admin-only under RLS.
- User submissions are private to the submitting user and admins.
- Passkey challenges are service-role only and expire after five minutes.
- App browsing history is not stored globally. Only per-user recent app opens are stored for signed-in users.
- The iframe uses a restricted sandbox and an external-open fallback.

## Next production passes

Before public release, use your final domain/app IDs, replace the temporary PWA icons with the final Salla Browser icon, validate every RLS policy in a staging Supabase project, and test iframe compatibility for each approved app before setting `embed_mode=iframe`.
