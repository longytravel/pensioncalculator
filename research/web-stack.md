# Web Stack Research — UK Pension/Retirement Calculator (Vercel, Aug 2026)

Assumptions: Node 22, npm 11, Windows dev machine, deploy target Vercel, single non-technical
end user (a friend), an AI chatbot needs read access to calculator state.

## 1. Framework — Next.js

- Current stable: **Next.js 16** (latest patch line 16.2.x, e.g. 16.2.11, late July 2026), App Router is stable and the recommended model.
- Turbopack is now the **default, stable** bundler for both dev and production builds — no flags needed.
- React 19.2 is the paired React version; Next 16 runs on React's canary-derived 19.2 feature set.
- Breaking/notable changes to design around:
  - **Async request APIs are mandatory**: `cookies()`, `headers()`, `params`, `searchParams` must be `await`ed. Run `npx @next/codemod@latest next-async-request-api .` if migrating.
  - **New caching defaults**: fetches/route handlers default to `no-store` (dynamic) rather than cached; caching is now opt-in via **Cache Components** and the `'use cache'` directive. For a calculator with no real backend data, this mostly simplifies things — just don't rely on old implicit caching.
  - Middleware file renamed to `proxy.ts` in newer 16.x releases (confirm at scaffold time — check `nextjs.org/docs/app/guides/upgrading/version-16`).
- Scaffold command:
  ```bash
  npx create-next-app@latest kirsten-pension --yes
  # --yes accepts the 2026 recommended defaults: TypeScript, Tailwind CSS, ESLint, App Router, Turbopack, src/ dir, "@/*" import alias
  ```
- TypeScript: scaffolded `tsconfig.json` default (strict mode) is fine as-is; no need to hand-roll. TypeScript 5.9+ is current; TS7 (native Go port) is emerging in the ecosystem but not required.

## 2. UI — shadcn/ui, Radix/Base UI, Tailwind v4

- **Tailwind CSS v4** is CSS-first: no `tailwind.config.js` by default. Configure design tokens directly in your global CSS via `@import "tailwindcss";` and `@theme { --color-...: ...; --font-display: ...; }`. The old JS config still works if you need it, but `@theme` is the forward-compatible path. Engine is the new Rust-based Oxide — big performance win, no dev impact for this project size.
- **shadcn/ui**: as of **July 2026, Base UI is the new default primitive library** for new shadcn projects (Radix UI remains fully supported, not deprecated — you can choose it explicitly at `init`, or migrate later with `npx shadcn@latest migrate radix`). Base UI is mature (`@base-ui-components/react` ~1.6, 6M+ weekly downloads) and is where shadcn's active development is now focused.
  - **Recommendation**: accept the shadcn default (Base UI) for a greenfield project — it gets the ongoing component work (Combobox, Number Field, etc.) and there's no reason to swim against the current for a new build.
- **Slider control**: use the shadcn `Slider` (Base UI/Radix underneath). It natively supports an array of values, so the same primitive covers both a single-value slider and a dual-thumb range if you need one later (e.g. a contribution range). Pair each slider with a controlled `<Input type="number">` synced to the same state atom so users can type an exact figure — this is the standard "slider + number input" pattern and isn't a separate library.
  - Native keyboard support (arrow/Page/Home/End) and click-on-track-to-jump satisfy **WCAG 2.2 SC 2.5.7 (Dragging Movements)** out of the box, since clicking/tapping is already a non-drag alternative.
- **Large touch targets / "big clear" design**: WCAG 2.2 SC 2.5.8 sets a *minimum* of 24×24 CSS px, but for a non-technical user aim well above that — 44–48px minimum tap targets (Apple/Google HIG norm), oversized slider thumbs (e.g. `h-8 w-8`+), thick tracks, large step buttons either side of the slider for +/- nudges, and generous spacing between controls.
- **Dark mode**: `next-themes` + Tailwind's `dark:` class strategy remains the standard, low-friction pairing with shadcn — no change from established practice.
- **Typography for low reading age / readability**: use **Lexend** (Google Font, purpose-built and research-backed for reading fluency) or **Atkinson Hyperlegible** (Braille Institute, optimized for low vision) as the body/display font, loaded via `next/font/google` for zero layout shift. Use large base font size (18–20px body, not the web-default 16px), generous line-height (≥1.5 per WCAG), and avoid dense paragraphs — short sentences, one idea per screen.

## 3. Charts — Recharts vs visx vs Chart.js vs Nivo vs Tremor

| Library | Bundle | React 19 | Accessibility | Fit for this app |
|---|---|---|---|---|
| **Recharts** (v3, ~2.4M weekly dl) | ~150KB | Yes | First-class ARIA roles on series/points | **Recommended** — composable `<ComposedChart>`/`<AreaChart>` covers stacked pot-over-time area, a low/mid/high fan chart (three `<Area>` layers with shared X), and a simple have-vs-need `<BarChart>`, all with one library and one mental model |
| Nivo | 500KB+ | Yes | Best-in-class — meets WCAG 2.1 AA out of the box, no extra work | Great a11y but heaviest bundle for a single-page personal tool; overkill |
| visx | ~15KB (modular) | Yes | DIY (you build the ARIA) | Most control, most code — not worth the build time here |
| Chart.js | ~60KB (canvas) | Yes | Needs `chartjs-plugin-a11y` plugin | Canvas rendering is fine but weaker default a11y and less natural fan-chart compositing |
| Tremor | ~200KB | Yes | Inherits its underlying chart lib | Pre-styled for SaaS dashboards; less flexible for the specific fan-chart shape needed |

**Recommendation: Recharts.** Install: `npm install recharts` (v3.x current). It directly supports all three chart shapes the calculator needs (stacked area, fan/band chart via layered semi-transparent Areas, simple bar) with reasonable bundle size and built-in ARIA.

## 4. State & persistence — ~20 inputs, localStorage, shareable URL, AI chatbot read access

**Recommendation: Zustand (client store + persist middleware) + nuqs (URL-shareable subset).**

- **Zustand** (`zustand`, ~2.9KB, current v5): single store holds all ~20 calculator inputs plus derived state. No Context provider needed, minimal boilerplate, and the store is trivially readable outside React via `useCalculatorStore.getState()` — exactly what an AI chatbot integration (a server route or client-side tool call) needs for read access without threading props through the component tree.
- **`persist` middleware** (built into Zustand) syncs the whole store to `localStorage` automatically, so the friend's in-progress inputs survive a refresh/close — no manual serialization code.
- **nuqs** (`nuqs`, current v2.x) for the subset of inputs worth putting in the URL (so she can share a specific scenario as a link) — typed, validated search-param state that stays in sync with the URL bar. Don't try to cram all 20 inputs into the URL; pick the handful that define "a scenario" (e.g. current age, retirement age, pot size, monthly contribution) and mirror those via nuqs while the rest live in Zustand/localStorage only.
- **Zod** (see section 6) validates anything coming from the URL or localStorage before it hits the store, since both are user-editable/untrusted.

Code sketch:
```ts
// store/calculator.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CalculatorState {
  currentAge: number
  retirementAge: number
  currentPot: number
  monthlyContribution: number
  // ...remaining ~16 inputs
  setField: <K extends keyof CalculatorState>(key: K, value: CalculatorState[K]) => void
}

export const useCalculatorStore = create<CalculatorState>()(
  persist(
    (set) => ({
      currentAge: 35,
      retirementAge: 67,
      currentPot: 20000,
      monthlyContribution: 200,
      setField: (key, value) => set({ [key]: value } as Partial<CalculatorState>),
    }),
    { name: 'kirsten-pension-calculator' } // localStorage key
  )
)

// AI chatbot (server or client) reads a plain snapshot with no React needed:
const snapshot = useCalculatorStore.getState()
```

```ts
// app/(calculator)/page.tsx — shareable subset via nuqs
import { useQueryState, parseAsInteger } from 'nuqs'
const [retirementAge, setRetirementAge] = useQueryState('retireAt', parseAsInteger.withDefault(67))
```

## 5. Guided tour / coach marks

**Recommendation: react-joyride** (`react-joyride`, v3 — ground-up rewrite shipped March 2026).
- Supports React 16.8 through **React 19** natively.
- Replaced Popper.js with Floating UI (matches modern positioning stack used elsewhere).
- New hook-based API, actively maintained (673K weekly downloads, only 3 open issues as of the rewrite), MIT-licensed, free.
- Alternatives ruled out: **Shepherd.js**'s React wrapper (`react-shepherd`) is *not* React 19 compatible (you'd have to drop to the vanilla library and hand-wire it); Shepherd also requires a paid license for commercial use. **driver.js** is a lightweight, framework-agnostic DOM highlighter with no first-class React bindings — fine for a quick one-off but you'd be writing more glue than with Joyride. **intro.js** has weaker 2026 maintenance signals than Joyride's rewrite.

Install: `npm install react-joyride`

## 6. Forms & validation

**Recommendation: skip react-hook-form; use plain controlled state (Zustand) + Zod for validation/parsing only.**

- react-hook-form (`react-hook-form@7.66.x`) + Zod (`zod@4.1.x`) + `@hookform/resolvers@5.2.x` is the current, well-maintained combo — but RHF's model (register fields, validate on submit/blur) is built for traditional forms with a submit button. A slider-driven calculator updates continuously and has no "submit" — every input change should immediately recompute projections.
- Better fit: sliders/number-inputs write straight into the Zustand store on every change (already controlled, already centralized), and **Zod schemas** validate/clamp values at three boundaries: (a) when parsing values coming in from the URL (nuqs), (b) when rehydrating from localStorage, and (c) as a single source of truth for min/max/step constraints shared between the UI and the projection math.
- Use `zod` (`npm install zod`) alone, without react-hook-form, unless a later feature (e.g. an email-capture or settings form) genuinely needs RHF's submit/error-state ergonomics — add it then, scoped to that one form.

## 7. Testing

- **Vitest** for the pure TypeScript financial/projection functions (compound growth, drawdown, tax bands, etc.) — these are plain functions with no DOM, ideal Vitest targets. Config: `vitest.config.mts` using `@vitejs/plugin-react` and `vite-tsconfig-paths`, environment `node` for pure calc functions (use `jsdom` only for the handful of tests that touch React components).
  ```bash
  npm install -D vitest @vitejs/plugin-react vite-tsconfig-paths
  ```
- **Playwright** for the end-to-end walkthrough flow (react-joyride tour steps, slider interactions, chart rendering, localStorage persistence across reload).
  ```bash
  npm init playwright@latest
  ```
- Note: Vitest cannot render async Server Components — keep those covered by Playwright E2E rather than trying to unit-test them.

## 8. Deployment — Vercel, Hobby plan, single-user access gate

Steps:
1. Push repo to GitHub.
2. Import the repo in the Vercel dashboard (or `vercel link`) — Next.js is auto-detected.
3. Every push to `main` deploys to production; every PR/branch gets a unique **Preview Deployment** URL automatically.
4. Environment variables: set in Project Settings → Environment Variables, scoped per environment (Development/Preview/Production). Anything the browser needs must be prefixed `NEXT_PUBLIC_`; everything else stays server-only. Redeploy is required after changing env vars (they don't hot-apply).

Hobby plan limits (2026): 60s max function duration, 100GB Fast Data Transfer/month, 1M function invocations, 4 CPU-hours, 6,000 build minutes/month, 100 deployments/day, personal/non-commercial use only — all comfortably enough for a single-user calculator.

**Access gate — important finding**: Vercel's built-in **Password Protection** is *not* available on Hobby — it requires Enterprise, or the $150/month Advanced Deployment Protection add-on on Pro. Hobby only gets "Vercel Authentication" which protects preview URLs, not your production domain.
- **Recommendation**: since this is free-tier and single-friend-use, implement a lightweight **shared-password `middleware.ts`** (Vercel has an official Basic-Auth template: `vercel.com/templates/next.js/basic-auth-password`) — no login UI, no database, checks a password against an env var, sets a cookie. This is explicitly *not* a strong security boundary (not encrypted, brute-forceable) but is appropriate for "keep search engines and randoms out of my friend's pension numbers," not for protecting sensitive regulated data at scale.

## 9. Accessibility & performance

- **WCAG 2.2 AA** essentials directly relevant here:
  - **2.5.7 Dragging Movements** — sliders must support a non-drag way to set values (click-on-track and keyboard arrows, both native to Radix/Base UI Slider, satisfy this).
  - **2.5.8 Target Size (Minimum)** — interactive targets ≥24×24 CSS px; go bigger (44px+) for this audience.
  - Standard name/role/value programmatic exposure for all custom controls (Base UI/Radix components handle this by default; don't override ARIA attributes manually).
  - Charts: Recharts' built-in ARIA roles cover the baseline; add explicit `aria-label`/`<title>` summaries per chart and don't rely on color alone to distinguish the low/mid/high fan bands (use patterns/labels too).
- **Core Web Vitals 2026**: INP (Interaction to Next Paint, replaced FID) is now the hardest metric to pass (43% of sites fail the 200ms threshold) — keep client JS light by defaulting to Server Components where there's no interactivity, lazy-load the chart library and the tour library (`next/dynamic`), and avoid heavy synchronous work in slider `onChange` handlers (debounce/defer expensive recalculation if the projection math gets non-trivial). LCP is bounded by TTFB, so keep the calculator page itself statically served where possible.

## Recommended stack

| Package | Version (as of Aug 2026) | Why |
|---|---|---|
| `next` | 16.2.x (latest patch) | Stable App Router, Turbopack default, current LTS-track release |
| `react` / `react-dom` | 19.2.x | Paired with Next 16 |
| `typescript` | ^5.9 | Scaffolded default, strict mode |
| `tailwindcss` | ^4 | CSS-first `@theme` config, Oxide engine |
| `shadcn` (CLI) + Base UI primitives | latest CLI, Base UI ~1.6 | New shadcn default (July 2026); Slider/Input give accessible big-touch-target controls |
| `next-themes` | latest | Dark mode toggle, standard shadcn pairing |
| `recharts` | ^3 | Best fit for stacked area + fan chart + bar, first-class ARIA, moderate bundle |
| `zustand` | ^5 | Central store for ~20 inputs, `persist` middleware → localStorage, `getState()` for AI chatbot read access |
| `nuqs` | ^2 | Shareable scenario state via URL search params |
| `zod` | ^4 | Validation/parsing at URL, localStorage, and shared min/max/step boundaries |
| `react-joyride` | ^3 | Guided tour/coach marks, React 19-native, actively maintained |
| `vitest` + `@vitejs/plugin-react` + `vite-tsconfig-paths` | latest | Unit tests for pure projection/tax math |
| `@playwright/test` | latest | E2E for tour + slider + persistence flows |
| Vercel (Hobby) + custom `middleware.ts` shared-password gate | — | Free tier is enough; Hobby lacks Password Protection, so gate access with Vercel's official Basic-Auth middleware template instead |

## Exact scaffold commands

```bash
# 1. Scaffold
npx create-next-app@latest kirsten-pension --yes
cd kirsten-pension

# 2. UI layer
npx shadcn@latest init
npx shadcn@latest add slider input button card

# 3. State, validation, charts, tour
npm install zustand nuqs zod recharts react-joyride next-themes

# 4. Testing
npm install -D vitest @vitejs/plugin-react vite-tsconfig-paths
npm init playwright@latest

# 5. Deploy
# push to GitHub, then import the repo at vercel.com/new
# add a SITE_PASSWORD env var in Vercel Project Settings and wire it into middleware.ts
# using Vercel's basic-auth-password template as the starting point
```

## Sources consulted (WebSearch, Aug 2026 queries)
- nextjs.org/blog/next-16, nextjs.org/docs/app/guides/upgrading/version-16, nextjs.org/docs/app/api-reference/cli/create-next-app
- tailwindcss.com/blog/tailwindcss-v4, github.com/tailwindlabs/tailwindcss discussions
- ui.shadcn.com/docs/changelog/2026-07-base-ui-default, ui.shadcn.com/docs/components/radix/slider
- LogRocket "Best React chart libraries in 2026", pkgpulse.com Recharts/Nivo/visx/Tremor guides
- github.com/47ng/nuqs discussions, jotai.org/docs/guides/nextjs, aiwisdom.dev state management 2026
- npmjs.com react-joyride, usertourkit.com "Is React Joyride still maintained in 2026?"
- dev.to react-hook-form+zod 2026 guide
- nextjs.org/docs/app/guides/testing/vitest, vitest.dev/guide/browser
- vercel.com/docs/plans/hobby, vercel.com/docs/deployment-protection, vercel.com/templates/next.js/basic-auth-password
- w3.org/TR/WCAG22, webability.io accessible fonts 2026
- digitalapplied.com Core Web Vitals 2026 INP guide
