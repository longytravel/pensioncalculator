# JACK & JONES — Visual Brand Research
Compiled 2 Aug 2026 for a private, password-gated personal finance app for a J&J contractor. Goal has since been clarified by the user: lean into visual familiarity (she should recognise it), while the app itself must not present as an official J&J product.

**UPDATE (same day, second pass): verified directly against the live https://www.jackjones.com/en-gb storefront.** Rather than relying only on logo-history/aggregator sites, I downloaded the actual page HTML and its production CSS bundle (`/assets/style-i6yrsfnn.css`, ~580KB) and extracted the real `:root` custom properties, `@font-face` rules, border-radius values, and text-transform usage straight from the source. This **replaces** the earlier navy-accent assumption in section 2 below — the real on-site brand colour is black/white, not navy blue. Section headers below are marked "(live-site verified)" where the new data supersedes the original research; the original research is kept underneath for the logo-history/typeface-name context, which the live CSS corroborates almost exactly.

Original sources (18 calls): [1000logos.net](https://1000logos.net/jack-jones-logo/), [Fonts In Use](https://fontsinuse.com/uses/46599/jack-and-jones-identity), [brandpalettes.com](https://brandpalettes.com/jack-and-jones-color-codes/), [Bestseller corporate — Jack & Jones brand page](https://bestseller.com/brands/jack-jones), [Wikipedia — Jack & Jones](https://en.wikipedia.org/wiki/Jack_%26_Jones), [jackjones.us homepage](https://www.jackjones.us/en-us), [JJXX about page](https://www.jackjones.us/en-us/jjxx/about-jjxx), [Wikimedia Commons SVG file record](https://commons.wikimedia.org/wiki/File:Jack_%26_Jones_logo.svg), [WhatFontIs — Italian Plate No2 similar fonts](https://www.whatfontis.com/Italian-Plate-No2-Bold.similar), [TypeType — Italian Plate No1 similar fonts](https://typetype.org/fonts/italian-plate-no1-similar-fonts/), [Fontstand — Italian Plate No2](https://fontstand.com/fonts/italian-plate-no2), [Seeklogo](https://seeklogo.com/vector-logo/425894/jack-jones), [adgully — SS'26 campaign](https://www.adgully.com/post/14282/jackjones-unveils-spring-summer-26-campaign-rooted-in-music-movement-and-travel), [Aryan Age — "Rush" campaign](https://www.aryanage.com/article/35288/jack-jones-shifts-into-high-gear-with-spring-summer--26-volume-2--rush).

Second-pass sources (direct fetch, not search): `https://www.jackjones.com/en-gb` (raw HTML, 776KB), `https://www.jackjones.com/assets/style-i6yrsfnn.css` (raw CSS, ~580KB) — both downloaded and grepped directly, so every value quoted in the "(live-site verified)" subsections below is copy-pasted from production source, not inferred.

---

## 1. Logo

- **Wordmark**: "JACK & JONES", always fully capitalised, ampersand retained (not "JACK JONES" without it). Some renderings stack it two-tier ("JACK &" over "JONES"); the flat single-line "JACK & JONES" is the more common current usage on-site and in nav/footer.
- **History**: one major redesign in the brand's ~35-year history. Pre-2018: bold italic slab-ish sans with the ampersand boxed in a red arched square. 2018 redesign (agency **e-Types**, designer Jonas Hecksher) moved to a stricter, more "laconic" mark, shifting the accent from **red to blue**, and reviving a plain ampersand rather than the boxed one, "accentuating the essentials" of the denim heritage story.
- **Typeface**: since 2018 the brand typeface is **Italian Plate No2 Expanded** by the Danish foundry **Playtype** — a geometric/functional grotesk with a large x-height, elliptical curve shape, equal stem width, and straight (not rounded) terminals. It's used bold/expanded, all-caps, tight tracking. This is a paid commercial font — do not attempt to source or embed the real file.
- **Ampersand treatment**: slightly distinct in weight/angle from the letters around it — described as adding "elegance and playfulness" against the otherwise blunt, functional letterforms. That contrast (heavy geometric caps + one softer glyph) is the most recreatable "feel" cue.
- **Sub-brands**: JACK & JONES **ORIGINALS**, **CORE**, and **PREMIUM** are described as J&J's three "jeans lifestyles"; **R.D.D. (Royal Denim Division)** is a heritage/workwear sub-line; **JJXX** (est. 2020) is the women's spin-off with its own logo lockup but the same typeface family; **PLUS** and **JUNIOR** extend sizing/age range. No public style guide describes sub-brand logo treatment precisely — assume same wordmark logic, sub-name set in the same face, usually smaller/secondary to the main mark.
- **Recreating the feel in CSS text (not the logo)**: heavy weight (800–900), all-caps, tight/negative letter-spacing (e.g. `-0.01em` to `-0.02em` at display sizes), large x-height sans — this is what reads as "on-brand" without touching the actual mark.

## 2. Colour palette — (live-site verified, supersedes earlier navy assumption)

Extracted verbatim from the `:root{}` block of jackjones.com/en-gb's production CSS:

| Token (as named on-site) | Hex | Use |
|---|---|---|
| `--color-primary` / `--button-color-primary` | `#000000` | **The actual brand/button colour is black, not blue.** Primary CTAs are black bg, flip to white bg on hover (`--button-color-primary-hover:#fff`). |
| `--body-background-color` | `#ffffff` | Page background is pure white, not off-white. |
| `--text-color` | `#000000` | Body/heading text. |
| `--text-color-muted` | `#72757e` | Secondary/helper text. |
| `--text-color-disabled` | `#e0e0e1` | Disabled state. |
| `--text-color-discount` | `#b90a2d` | **Sale/discount price text colour** — deep red, not the brighter `--color-red`. |
| `--color-red` | `#fb0101` | Separate, brighter red used elsewhere (badges/alerts), lower prominence than the discount colour. |
| `--color-danger` | `#d12727` | Error states. |
| `--color-info` | `#0468db` | Utility "info" blue — used for informational UI, not as the core brand colour. |
| `--dark-blue-color` | `#003366` | A minor secondary blue token exists, but it's a utility variable, not `color-primary`. |
| `--link-color` / `--link-color-hover` | `#43464e` / `#1d1f22` | Links are dark grey, not blue. |
| `--color-light` | `#f1f1f1` | Muted/neutral surface (cards, notification backgrounds). |
| `--color-gray` / `--color-light-gray` / `--color-dark-gray` | `#cccccc` / `#dddddd` / `#a8a8a8` | Border/divider greys. |
| `--footer-top-background` / `--footer-middle-background` | `#000000` (white text) | Footer is a solid black band. |
| `--footer-bottom-background` | `#ffffff` (black text) | Bottom-most footer strip flips back to white. |
| `--color-success` / `--color-warning` | `#5ece7b` / `#ecc713` | Standard system feedback colours, not brand-specific. |

**Correction to the original research**: the earlier third-party "brand blue #00268A" story (from the 2018 red→blue rebrand) does **not** show up as the live site's actual `color-primary`. In production the site runs **black-on-white with a deep-red sale accent** — blue exists only as a minor utility/info token. For "familiar at a glance," black/white/red-accent is the more accurate palette to copy than navy.

## 3. Typography (site + logo) — (live-site verified)

Extracted from `@font-face` rules in the production CSS — this is exactly what loads in the browser:

- **`Italian Plate No2 Expanded`** — self-hosted (`/fonts/plate.woff2` weight 400, `/fonts/plate-black.woff2` weight 700). This is `--font-family-primary`, used for headings and the main brand voice. Confirms the original research exactly. Commercial Playtype font — do not source the real files.
- **`bebas-neue-pro`** — loaded from Adobe Typekit (`use.typekit.net`), weight 700. This is `--font-family-secondary`, likely used for condensed labels/callouts. **Bebas Neue Pro is the paid superset of the free Google Font "Bebas Neue"** — same family lineage, so Bebas Neue is an unusually close (not just similar-looking) free substitute here.
- **`Tondo`** (weight "lighter") — another self-hosted Playtype face, softer/more geometric-humanist than Plate, likely used for lighter secondary text. No paid license needed to imitate the *feel* — treat as a "soft body companion" role.
- Base font size is a small `12px` (`--font-base`), input fields fall back to generic `sans-serif`.

**Free Google Font substitutes for `next/font/google`:**
- **Display / headings** (substitute for Italian Plate No2 Expanded) → **`Archivo`**, set to its Expanded width axis, weights 700–900, uppercase. Archivo is one of the few free variable fonts with a true Expanded width instance, matching Plate's wide geometric proportions better than a merely-bold face would.
- **Condensed labels / secondary display** (substitute for bebas-neue-pro) → **`Bebas Neue`** — the closest legitimate free relative available, uppercase, use sparingly for tags/eyebrows/prices the way the live site uses its secondary face.
- **Body / UI text / numbers** (substitute for Tondo) → **`Inter`**, weights 400–600. Tondo itself has no strong free equivalent; Inter is the safer choice for a finance app's tables and figures (better numeral legibility than trying to chase Tondo's softness).
- Correction to the original research: drop the earlier `Barlow Condensed` recommendation — the real site doesn't use a Barlow-shaped face anywhere; Archivo Expanded + Bebas Neue are closer to what's actually loading.

## 4. Layout and feel — (live-site verified)

- **Border-radius**: the live checkout/basket primary CTA (`.adyen-checkout__button--pay`) is literally `border-radius:0`. Across the stylesheet the next most common *brand* (non-third-party-widget) values are `2px`, `3px`, and `5px` — small pill/badge elements go up to `999px`/`50%` (avatars, swatches), but primary buttons and CTAs are sharp or near-sharp. This confirms the "sharp Scandinavian minimalism" call, now with real numbers: **0–4px, not 8px+**.
- **Grid density**: `--homepage-column-gap: 4px` — product-tile grids are laid out with almost no gutter, an edge-to-edge tile-mosaic look. `--container-max-width: 1920px` — the layout goes genuinely full-bleed on large screens rather than capping at a conventional ~1280–1440px content width.
- **Spacing scale** (`--spacer-*`): 2xs `.25rem`, xs `.5rem`, sm/base `1rem`, lg `2rem`, xl `2.5rem`, 2xl `5rem`, 3xl `10rem` — a fairly conventional 4/8pt-adjacent rem scale, nothing exotic.
- **Uppercase**: `text-transform:uppercase` appears **113 times** in the stylesheet (plus 19 more with `!important`) — uppercase is used extremely heavily and consistently, more than "some labels," closer to a house rule for nav, buttons, tags, and headings.
- **Letter-spacing**: contrary to the original research's guess of tight/negative tracking, the real CSS only shows a handful of explicit values — `normal`, `0`, `1px`, and `.05rem` (~0.05em) — i.e. **flat or very slightly positive tracking**, not negative/tightened. Don't tighten display type; if anything add a touch of positive tracking on small uppercase labels for legibility.
- **Prices/numbers are heavy**: price and discount elements are consistently `font-weight:800` — numbers get the same heavy treatment as headlines, not a lighter tabular style.
- Nav structure (from the live page): primary nav `MEN / WOMEN / KIDS`, secondary `New In / Clothing / Deals / Denim / Shoes / Accessories / Sale / Premium / Plus size`; footer split into JACK & JONES / JJXX / Help / About Bestseller blocks; a loyalty programme called **"&CLUB"** also uses the ampersand motif.
- Verdict unchanged and now confirmed with real numbers: **minimal Scandinavian retail** — dense full-bleed photography grid, near-zero-radius sharp UI, heavy uppercase, restrained black/white/red palette.

## 5. Tone of voice

- Confident, heritage-forward, denim-first: "Our denim heritage is stitched into every pair of jeans and trousers we make — it's our DNA."
- Marketing copy is short, casual, price- and trend-led: "Stay stylishly updated with the latest arrivals," "SELECTED DENIM – ALL JUST $25."
- Known campaign tagline: **"Made from cool."** (agency Co+, Copenhagen; Christopher Walken campaign).
- Current SS'26 campaign is structured as themed "chapters" — Music, Rush, Travel — leaning on youth/street/music culture rather than corporate fashion-speak.
- JJXX (women's line) tone is more overtly empowerment-driven: "free, independent, powerful, capable, and cool," framed around four values — social, strong, energetic, dedicated.
- Overall: short sentences, punchy fragments, confident/casual register, denim-and-culture vocabulary rather than luxury or corporate language.

---

## Ethical/IP line — what's fine vs. what's not

Context update: this app is for a **J&J contractor**, and the user has explicitly asked to copy the brand so it's recognisable to her — so this leans into visual familiarity rather than staying arm's-length. The line that still matters:

**Not OK — would make it look like an official J&J product:**
- Reproducing the actual JACK & JONES logo/wordmark file (SVG/PNG) from any logo archive or from the live site's assets.
- A fake official-looking header — i.e. presenting the app's UI chrome as if it were a genuine Bestseller/J&J surface (their real nav labels, their real footer structure copied verbatim, "Official Website"-style framing).
- Using the real self-hosted "Italian Plate"/"Tondo" font files or the Typekit "bebas-neue-pro" kit pulled from their CDN — these are licensed to Bestseller.
- Reproducing Bestseller/J&J trademarks or taglines as if original to the app.

**Fine — this is the actual ask, and it's a reasonable one:**
- The real palette (black/white/deep-red-accent) taken from the live CSS.
- The typographic *feel* via free substitute fonts (Archivo Expanded, Bebas Neue, Inter) rather than the real font files.
- Layout conventions: near-zero border-radius, heavy uppercase, tight grid gutters, full-bleed imagery where relevant, the heavy/800-weight numerals.
- A wordmark rendered as plain CSS text for the personal tool's own title (e.g. in the display font, uppercase, black) is fine — it's a typographic homage, not a copied asset. Just don't set it to literally read "JACK & JONES" with an official-looking lockup — give the app its own name in that style instead.

---

## Theme block (Tailwind v4 `@theme`, light + dark) — built from real live-site hex values

Drop into your global CSS. Load fonts via `next/font/google` (`Archivo`, `Bebas_Neue`, `Inter`) and map their CSS variables to the font tokens below.

```css
@theme {
  /* Fonts — map these to next/font variables, e.g.
     --font-display: var(--font-archivo);       (Expanded width, 700-900)
     --font-label: var(--font-bebas-neue);       (condensed, uppercase labels/prices)
     --font-sans: var(--font-inter); */
  --font-display: "Archivo", ui-sans-serif, system-ui, sans-serif;
  --font-label: "Bebas Neue", ui-sans-serif, system-ui, sans-serif;
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;

  --radius: 0.125rem; /* 2px — matches the live site's near-zero-radius CTAs */

  /* Light mode — taken directly from jackjones.com/en-gb's :root */
  --color-background: #ffffff;      /* --body-background-color */
  --color-foreground: #000000;      /* --text-color */
  --color-primary: #000000;         /* --color-primary / --button-color-primary */
  --color-primary-foreground: #ffffff;
  --color-accent: #b90a2d;          /* --text-color-discount — the real "sale" accent, not blue */
  --color-accent-foreground: #ffffff;
  --color-muted: #f1f1f1;           /* --color-light */
  --color-muted-foreground: #72757e;/* --text-color-muted */
  --color-border: #dddddd;          /* --color-light-gray */
}

:root[data-theme="dark"] {
  --color-background: #000000;      /* mirrors the site's own black footer band */
  --color-foreground: #ffffff;
  --color-primary: #ffffff;         /* inverted: white "button" on black surface */
  --color-primary-foreground: #000000;
  --color-accent: #e23a58;          /* lightened discount-red for dark-mode contrast */
  --color-accent-foreground: #000000;
  --color-muted: #1a1a1a;
  --color-muted-foreground: #a8a8a8;/* --color-dark-gray */
  --color-border: #2a2a2a;
}
```

Usage notes:
- Headings → `font-display` (Archivo, Expanded axis if available), uppercase, weight 700–900, **flat or slightly positive tracking** (`0` to `0.05em`) — the live site does not tighten/negative-track its display type, despite that being a common assumption for this kind of face.
- Small uppercase labels, price tags, nav eyebrows → `font-label` (Bebas Neue), uppercase — used sparingly, the way the real secondary face is used, not for every heading.
- Body copy, numbers, table data → `font-sans` (Inter); give price/total figures `font-weight:800` to match the site's heavy-numeral convention.
- Buttons/cards → `rounded-[var(--radius)]` (2px) — primary CTAs can go all the way to `0` to match the real checkout button exactly.
- `--color-accent` (deep red) is the discount/negative/attention colour on the real site — good fit for "over budget," "shortfall," or "action needed" states in a finance app; don't use it as a generic decorative accent.
- Keep `--color-primary` black/white-only, as the live site does — resist the urge to reintroduce a blue "brand colour"; it isn't one in production.
