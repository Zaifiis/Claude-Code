# Profinity Solutions — Agency Website

A dark, 3D, interactive marketing site for **Profinity Solutions** (AI automation
agency). Built with Next.js 14 (App Router) + TypeScript + Tailwind CSS, animated
with Framer Motion, with a react-three-fiber 3D hero. It **exports to static HTML**
for upload to Hostinger shared hosting — no Node server required.

## Tech
- Next.js 14 (App Router), TypeScript, Tailwind CSS
- `framer-motion` (scroll/entrance animation)
- `three` + `@react-three/fiber` + `@react-three/drei` (3D hero)
- `lucide-react` (icons)
- Fonts: Space Grotesk (display) + Inter (body), self-hosted via `next/font`
- shadcn-style structure: UI in `components/ui/*`, `cn()` in `lib/utils.ts`

## Run & build

```bash
npm install
npm run dev      # local dev at http://localhost:3000
npm run build    # static export -> ./out
```

`next.config.js` sets `output: 'export'` + `images.unoptimized`, so `npm run build`
writes a fully static site to the **`out/`** folder.

## Deploy to Hostinger (shared hosting)
1. Run `npm run build`.
2. Open the generated **`out/`** folder.
3. Upload the **contents of `out/`** (not the folder itself) into your Hostinger
   **`public_html`** directory (via File Manager or FTP).
4. That's it — it's plain HTML/CSS/JS, no Node needed.

## Before you go live — fill in the TODOs
All editable content lives in **`lib/site-config.ts`**. Search for `TODO`:

| What | Where in `lib/site-config.ts` |
|------|-------------------------------|
| Logo image | add `public/logo.jpeg` (see `public/PLACE-LOGO-HERE.txt`) |
| Email, phone, address | `SITE_CONFIG.contact` |
| Social links | `SITE_CONFIG.socials` (empty ones are hidden automatically) |
| Contact form endpoint | `SITE_CONFIG.formEndpoint` (Formspree-style URL; blank = mailto fallback) |
| Case study videos | `CASE_STUDIES[].video` (mp4 or YouTube URL; blank = branded poster) |
| Hero headline / tagline | `SITE_CONFIG.heroHeadline` |

- The **contact form** posts to `SITE_CONFIG.formEndpoint`. Because static hosting has
  no backend, set this to a Formspree (or similar) endpoint. If left blank, the form
  falls back to opening the visitor's email client (`mailto:`).
- **Case study videos**: the `CaseVideo` component takes an mp4 or YouTube URL from
  `CASE_STUDIES`. With no URL it shows a branded poster ("Video coming soon").
- **Blog**: posts come from the `POSTS` array (empty → "First posts coming soon"
  empty state). Add entries there when ready.

## Structure
```
app/                 # routes: / about services portfolio blog contact
components/ui/        # glowing-effect, gradient-menu (nav), 3d-pin,
                      # statistics-card, moving-dot-card, glow-card
components/sections/  # hero (+ 3D canvas), bento, pins, cta, faq, forms…
lib/site-config.ts    # ALL content + TODO constants (single source of truth)
lib/utils.ts          # cn()
public/logo.jpeg      # your logo (add it)
```

## Notes
- The 3D hero lazy-loads (`next/dynamic`, `ssr:false`), caps pixel ratio at 2,
  drops to fewer cubes on mobile, pauses its render loop when off-screen or the tab
  is hidden, and shows a static gradient for `prefers-reduced-motion` users.
- Dark theme only, brand palette centralised in `tailwind.config.ts` + `globals.css`.
