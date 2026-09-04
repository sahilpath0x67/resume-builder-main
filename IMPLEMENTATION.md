# UI/UX Overhaul — Implementation Guide

Follow these steps in order. Each step is self-contained.

---

## Step 1 — Replace globals.css

```
src/app/globals.css   ← replace entirely with the new file
```

This new file:
- Defines all design tokens as CSS variables (colors, spacing, type scale, shadows)
- Full dark mode via `.dark` class on `<html>`
- Responsive typography using `clamp()` — auto-scales from 320px to 1440px+
- All button, form, tab, alert, badge, skeleton, toast styles
- Responsive two-panel layout classes
- Mobile panel toggle helpers
- Accessibility: skip-link, focus-visible, reduced-motion support
- Print styles

---

## Step 2 — Replace layout.tsx

```
src/app/layout.tsx   ← replace entirely with the new file
```

Changes:
- Loads Inter via `next/font/google` (eliminates layout shift, faster)
- Full SEO metadata: title template, description, OG tags, Twitter card
- JSON-LD structured data for Google rich results
- Viewport export (required in Next.js 14+)
- Skip-nav link for keyboard/screen reader users
- PWA manifest link

**After replacing, update these values:**
- `NEXT_PUBLIC_URL` env var in Vercel to your real domain
- OG image description to match your actual app

---

## Step 3 — Replace next.config.js

```
next.config.js   ← replace with the new file
```

Adds: image optimisation (AVIF/WebP), HTTP compression, security headers.

---

## Step 4 — Add new components

Copy these new files into your project:

```
src/components/Header.tsx          ← new file
src/components/FormComponents.tsx  ← new file
```

**Header.tsx** gives you:
- Sticky header with dark mode toggle (persisted to localStorage)
- Mobile Edit/Preview panel toggle buttons
- Brand logo + name (name hides on very small screens)

**FormComponents.tsx** gives you:
- `<Input>` — accessible input with label, error, hint, prefix/suffix
- `<Textarea>` — with character counter support
- `<Select>` — custom styled select with ARIA
- `<LoadingButton>` — spinner + disabled state
- `<Alert>` — success/error/warning/info banners with dismiss
- `<EmptyState>` — empty state with icon, title, CTA

---

## Step 5 — Replace page.tsx

```
src/app/page.tsx   ← replace entirely with the new file
```

What changed:
- Full responsive two-panel layout (stacks on mobile, side-by-side on desktop)
- Mobile panel toggle (Edit / Preview)
- Proper ARIA tablist / tabpanel / tab roles on all tabs
- Lazy-loaded right panels via `React.lazy` + `Suspense`
- Experience and Education entries as card-based lists with add/remove
- Character counter on summary field
- `LoadingButton` for generate button with spinner state
- Auto-switches to preview panel after generation on mobile
- Proper `aria-live` regions for error/success messages

---

## Step 6 — Replace auth/page.tsx

```
src/app/auth/page.tsx   ← replace with the new file
```

What changed:
- Three modes: login / signup / reset (no page reload)
- Google sign-in button at the top
- Responsive card (works on 320px up)
- Real `autoComplete` attributes (helps password managers + iOS autofill)
- Enter key submits the form
- Terms of service text on signup
- Accessible labels, `aria-required`, `aria-busy`

---

## Step 7 — Add SEO files

```
src/app/sitemap.ts    ← new file (auto-generates /sitemap.xml)
src/app/robots.ts     ← new file (auto-generates /robots.txt)
public/manifest.json  ← new file (PWA support)
```

---

## Step 8 — Create required public assets

You need to create these image files and put them in `/public`:

| File | Size | Purpose |
|---|---|---|
| `public/og-image.png` | 1200×630px | Social media link previews |
| `public/favicon.ico` | 32×32 or 48×48 | Browser tab icon |
| `public/icon.svg` | Any | SVG favicon (modern browsers) |
| `public/apple-touch-icon.png` | 180×180 | iOS home screen icon |
| `public/icon-192.png` | 192×192 | Android PWA icon |
| `public/icon-512.png` | 512×512 | Android PWA splash |

**Free tools:**
- OG image: [canva.com](https://canva.com) — use 1200×630 custom size
- Favicon + icons: [favicon.io](https://favicon.io) — paste your logo, downloads all sizes

---

## Step 9 — Verify dark mode still works

Your existing `makeTheme()` helper should still work. The new CSS variables
map directly to the dark mode values. Check these:

1. Open app in browser
2. Open DevTools → Console → type: `document.documentElement.classList.toggle('dark')`
3. Everything should invert correctly

If any component uses hard-coded colors instead of CSS variables, update it
to use the token (e.g. replace `color: '#1a1a2e'` with `color: 'var(--text-primary)'`).

---

## Step 10 — Test responsive breakpoints

Open Chrome DevTools → Toggle device toolbar → test these:

| Width | Device | Check |
|---|---|---|
| 320px | iPhone SE | No horizontal scroll, tabs scrollable, form usable |
| 375px | iPhone 14 | Same, check touch targets (min 44px) |
| 768px | iPad | Panels should still stack |
| 1024px | iPad Landscape | Two-panel layout kicks in |
| 1440px | Desktop | Layout fills width properly |

---

## Common issues & fixes

**Issue:** Tailwind classes not applying after replacing CSS  
**Fix:** The new globals.css uses `@import "tailwindcss"` (Tailwind v4 syntax).
Confirm your `postcss.config.js` uses `@tailwindcss/postcss` not `tailwindcss`.

**Issue:** Dark mode flicker on page load  
**Fix:** The Header component reads from `localStorage` on mount.
Add this script tag to `<head>` in layout.tsx to prevent flash:
```tsx
<script dangerouslySetInnerHTML={{ __html: `
  const t = localStorage.getItem('theme');
  if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
` }} />
```

**Issue:** `next/font` error about Inter  
**Fix:** Make sure you're importing from `'next/font/google'` not `'@next/font/google'`.

**Issue:** Panels not toggling on mobile  
**Fix:** The `collapsed` class sets `display: none` via CSS.
If you use Tailwind classes elsewhere, make sure the CSS file is loaded.

---

## What's NOT included (your existing code to keep)

These files are not changed — keep your existing versions:
- `src/components/ResumePreview.tsx` — your existing preview (referenced by new page.tsx)
- `src/components/CoverLetterPanel.tsx` — keep as-is
- `src/components/ATSScorePanel.tsx` — keep as-is
- `src/components/LinkedInPanel.tsx` — keep as-is
- `src/app/api/` — all API routes unchanged
- `src/lib/` — Firebase, Gemini helpers unchanged
- All resume templates

The new `page.tsx` calls these components the same way, just wraps them in
proper ARIA tabpanels and lazy-loads them.
