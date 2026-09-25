# Salla Browser v003

A lightweight Salla ecosystem browser / app hub built with React, TypeScript, Vite, Supabase, PWA support, and optional WebAuthn passkeys.

## Highlights

- Borderless Flat + Soft UI with dedicated light and dark palettes.
- Stronger Cairo / Outfit typography and reduced motion.
- One account dialog; no duplicate hamburger menu.
- Live filtering inside the Salla app directory.
- Web searches open Google externally instead of attempting blocked iframe embedding.
- Embedded browsing is reserved for approved directory apps configured with `embed_mode = iframe`.
- Favorites, submissions, admin dashboard, Supabase RLS, PWA install, and passkeys.

## Setup

```bash
cp .env.example .env
npm install
npm run build
npm run dev
```

Required frontend environment values:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

See `README_AR.md` for the full Arabic deployment notes.
