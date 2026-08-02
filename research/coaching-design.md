# Coaching Layer Design — Insight Engine, Adaptive Accountant List, Cost of Delay, Tone, Prioritised Action Plan

Compiled 2 August 2026, extended same day with §5 (the prioritised action plan — the payoff of the product) and §6 (the purity contract: the entire advisory layer is a pure function of state). Depends on: `research/uk-pension-rules.md`, `research/contractor-tax.md`, `lib/fields.ts`, `content/guides.ts`. All £ figures below that are hard-coded in copy come from those research files (2026/27 tax year); everything marked `{...}` is computed by the engine at render time.

**Compliance frame (non-negotiable, see uk-pension-rules.md §9):** every insight states arithmetic about *her numbers* and general rules — never "you should", never "we recommend", never "the best option for you". Actions point at a slider, a guide, or a question for her accountant/provider. That keeps the whole layer on the guidance side of the FCA advice boundary; a disclaimer alone would not.

---

## 1. THE INSIGHT ENGINE

### 1.1 State and types

The rules need three things the current `CalculatorValues` doesn't hold: an IR35 status input (contractor-tax.md says this MUST be an explicit gate, never assumed), derived projection outputs, and a couple of pure helpers so copy can quote pounds instead of percentages.

> **Alignment note (post-store):** `lib/store.ts` now holds `workingArrangement: WorkingArrangement` from `lib/engine/contractor.ts` — use that, not the `ir35Status` sketched below. Mapping: `outside → 'ltd_outside_ir35'`, `inside-ltd → 'ltd_inside_ir35'`, `inside-umbrella → 'umbrella'`, plus `'employee'`, `'sole_trader'` and `'unknown'` (the default). The store's per-field `unknown` flags and `fundRiskLevel` also exist and are used by §5–§6.

```ts
import type { CalculatorValues, FieldName } from '@/lib/fields'

export type Ir35Status = 'outside' | 'inside-ltd' | 'inside-umbrella' | 'unknown'

/** Engine outputs + helpers, all in today's money. Computed once per recalc. */
export interface Derived {
  yearsToRetirement: number
  projectedMonthly: number        // e.g. 1226
  targetMonthly: number           // targetIncome / 12, e.g. 2725
  shortfallMonthly: number        // max(0, target - projected)
  coverage: number                // projected / target, 0..n
  potNow: number                  // avivaBalance + peoplesPensionBalance
  totalMonthlyContribution: number// personal (gross of relief) + employer
  mortgagePayment: number         // £/month on current schedule
  mortgageClearAge: number        // currentAge + mortgageYearsLeft
  houseEquity: number             // houseValue - mortgageBalance
  statePensionMonthly: number     // 1046 * min(qualifyingYears, 35) / 35
  bridgeYears: number             // max(0, statePensionAge - retirementAge)
  /** FV of saving £m/month from now to retirement, real terms. */
  fvOfMonthly(m: number): number
  /** Sustainable extra £/month income from an extra £pot at retirement. */
  incomeFromPot(pot: number): number
  /** £ cost over the years to retirement of her charge rate vs a cheaper one. */
  chargeDrag(cheaperRate: number): number
  /** Net £ in pocket from £10,000 company profit taken as dividend at her band. */
  dividendNetOf10k: number        // ≈ 5,200–7,200 depending on band — engine derives
  /** FV difference between starting a contribution now vs in 12 months. */
  delayCost12m(m: number): number
}

export interface InsightState extends CalculatorValues {
  ir35Status: Ir35Status
  d: Derived
}

export type Severity = 'good' | 'watch' | 'act'
export type Topic =
  | 'horizon' | 'gap' | 'contributions' | 'ir35' | 'pots' | 'charges'
  | 'state-pension' | 'mortgage' | 'house' | 'business' | 'isa' | 'delay'

export interface Insight {
  id: string
  topic: Topic
  severity: Severity
  when: (s: InsightState) => boolean
  /** Under 12 words. Template fn so her real numbers appear. */
  headline: (s: InsightState) => string
  /** Two sentences max. Pounds, never percentages, wherever possible. */
  detail: (s: InsightState) => string
  action?: { label: string; target: FieldName | `guide:${string}` | 'accountant-list' }
}

/** £12,340 style formatting; round to nearest £ (or £10 above 10k for calm copy). */
const gbp = (n: number) =>
  Math.round(n).toLocaleString('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 })
```

### 1.2 Selection and display logic

- **Inline (after each answer):** show the single highest-priority matching insight whose `topic` maps to the field just answered (mapping table in §1.4). One card, never a stack.
- **Results panel:** filter all rules by `when`, dedupe to one insight per `topic` (severity `act` > `watch` > `good`, then array order). Display order: **one `good` first** (open on a win — tone rule T1), then up to two `act`, then `watch`, cap five total. Never show more than two `act` cards on one screen regardless of how many fire.
- Severity is *energy*, not alarm: `good` = green tick, `watch` = neutral dot, `act` = "biggest win available" styling — never red, never a warning triangle (tone rule T6).

### 1.3 The rules

```ts
export const INSIGHTS: Insight[] = [

  // ── HORIZON ────────────────────────────────────────────────────────────

  {
    id: 'horizon-real-time',
    topic: 'horizon', severity: 'good',
    when: s => s.d.yearsToRetirement >= 10,
    headline: s => `${s.d.yearsToRetirement} years is enough time to change this picture`,
    detail: s => `Money paid in this year has ${s.d.yearsToRetirement} years to grow before it is needed. The years between now and then are usually the highest-earning of a working life — the best paying-in years, not the leftover ones.`,
  },
  {
    id: 'horizon-short',
    topic: 'horizon', severity: 'watch',
    when: s => s.d.yearsToRetirement > 0 && s.d.yearsToRetirement < 10,
    headline: s => `${s.d.yearsToRetirement} years to go — paying in beats growth from here`,
    detail: s => `Over a shorter run, what goes in matters more than what the market does. Each £500 paid in monthly from now adds roughly ${gbp(s.d.incomeFromPot(s.d.fvOfMonthly(500)))} a month to retirement income.`,
    action: { label: 'Try the contribution sliders', target: 'personalMonthlyContribution' },
  },
  {
    // Guard rule: the slider currently floors at 57, but keep this so the rule
    // set stays safe if bounds ever change or a saved value slips through.
    id: 'retire-before-57',
    topic: 'horizon', severity: 'act',
    when: s => s.retirementAge < 57,
    headline: s => `A pension cannot pay you anything at ${s.retirementAge}`,
    detail: s => `Private pensions unlock at 57 (from April 2028), whatever is in them. Stopping at ${s.retirementAge} would need ${gbp((57 - s.retirementAge) * s.targetIncome)} covered entirely from savings, ISAs or business cash first.`,
    action: { label: 'See how ISAs bridge the gap', target: 'guide:pension-vs-isa' },
  },
  {
    id: 'bridge-to-state-pension',
    topic: 'horizon', severity: 'watch',
    when: s => s.d.bridgeYears >= 2,
    headline: s => `No State Pension until ${s.statePensionAge} — ${s.d.bridgeYears} years to self-fund`,
    detail: s => `From ${s.retirementAge} to ${s.statePensionAge}, all ${gbp(s.d.targetMonthly)} a month comes from your own pots. When the State Pension starts it adds ${gbp(s.d.statePensionMonthly)} a month and the pressure on your savings drops.`,
  },
  {
    id: 'planning-age-low',
    topic: 'horizon', severity: 'watch',
    when: s => s.planningAge < 90,
    headline: () => `Planning to ${''}an average age is a coin flip`,
    detail: s => `A woman reaching 65 today lives to about 87 on average — and half live longer. Setting this to 95 costs nothing today and means the plan still works if you are one of them.`,
    action: { label: 'Nudge the planning age', target: 'planningAge' },
  },

  // ── TARGET VS PROJECTION ───────────────────────────────────────────────

  {
    id: 'gap-large',
    topic: 'gap', severity: 'act',
    when: s => s.d.coverage < 0.6,
    headline: s => `The gap is ${gbp(s.d.shortfallMonthly)} a month — and it moves`,
    detail: s => `Today's plan produces ${gbp(s.d.projectedMonthly)} against the ${gbp(s.d.targetMonthly)} you picked. Every slider on this page moves that first number, and you have ${s.d.yearsToRetirement} years of compounding on your side.`,
    action: { label: 'See what closes it fastest', target: 'employerMonthlyContribution' },
  },
  {
    id: 'gap-closing',
    topic: 'gap', severity: 'watch',
    when: s => s.d.coverage >= 0.6 && s.d.coverage < 1,
    headline: s => `${gbp(s.d.shortfallMonthly)} a month short — genuinely close`,
    detail: s => `The plan already covers ${gbp(s.d.projectedMonthly)} of the ${gbp(s.d.targetMonthly)} a month you want. Closing the rest needs roughly ${gbp(s.d.shortfallMonthly / Math.max(0.01, s.d.incomeFromPot(s.d.fvOfMonthly(1))))} a month more going in — try it on the slider and watch.`,
    action: { label: 'Try it', target: 'personalMonthlyContribution' },
  },
  {
    id: 'on-track',
    topic: 'gap', severity: 'good',
    when: s => s.d.coverage >= 1,
    headline: () => `This plan covers the life you priced`,
    detail: s => `The projection reaches ${gbp(s.d.projectedMonthly)} a month against a target of ${gbp(s.d.targetMonthly)}. Worth revisiting once a year, or whenever income changes — not something to re-check weekly.`,
  },
  {
    id: 'target-below-minimum',
    topic: 'gap', severity: 'watch',
    when: s => s.targetIncome < 13900,
    headline: () => `That target is below what essentials typically cost`,
    detail: () => `Independent research prices a minimum single retirement at £13,900 a year — covering needs, not treats — and that assumes no rent or mortgage. A target below it usually means the plan looks healthier than the life it buys.`,
    action: { label: 'Compare the lifestyle cards', target: 'targetIncome' },
  },
  {
    id: 'target-above-earnings',
    topic: 'gap', severity: 'watch',
    when: s => s.targetIncome > s.salary && s.salary > 0,
    headline: () => `You've set retirement income above today's earnings`,
    detail: () => `Most people need less once the mortgage, commuting and paying-in stop. Nothing wrong with ambition — just worth checking the target against the lifestyle cards so the gap shown is a real one.`,
    action: { label: 'Check the cards', target: 'targetIncome' },
  },

  // ── CONTRIBUTIONS ──────────────────────────────────────────────────────

  {
    id: 'relief-top-up',
    topic: 'contributions', severity: 'good',
    when: s => s.personalMonthlyContribution > 0,
    headline: s => `Your ${gbp(s.personalMonthlyContribution)} becomes ${gbp(s.personalMonthlyContribution * 1.25)} before it grows`,
    detail: s => `The government adds basic-rate tax relief automatically — pay in ${gbp(s.personalMonthlyContribution)} and ${gbp(s.personalMonthlyContribution * 1.25)} lands in the pot. That top-up happens every single month, before any investment growth.`,
  },
  {
    id: 'nothing-going-in',
    topic: 'contributions', severity: 'act',
    when: s => s.d.totalMonthlyContribution === 0,
    headline: () => `Nothing is going in yet — the pots are coasting`,
    detail: s => `The ${gbp(s.d.potNow)} already saved will grow, but nothing new is being added. Even £250 a month from here adds roughly ${gbp(s.d.incomeFromPot(s.d.fvOfMonthly(250 * 1.25)))} a month to the projection — move the slider and watch it happen.`,
    action: { label: 'Try £250 a month', target: 'personalMonthlyContribution' },
  },
  {
    id: 'company-route-open',
    topic: 'contributions', severity: 'act',
    when: s => s.ir35Status === 'outside' && s.employerMonthlyContribution === 0,
    headline: () => `Company profit can reach your pension almost untaxed`,
    detail: s => `£10,000 of company profit becomes about ${gbp(s.d.dividendNetOf10k)} in your pocket as a dividend — but the full £10,000 as a company pension contribution, with no National Insurance and a lower Corporation Tax bill too. This is exactly the question in your accountant email.`,
    action: { label: 'See your accountant questions', target: 'accountant-list' },
  },
  {
    id: 'company-route-active',
    topic: 'contributions', severity: 'good',
    when: s => s.ir35Status === 'outside' && s.employerMonthlyContribution > 0,
    headline: s => `${gbp(s.employerMonthlyContribution)} a month straight from profit — the strongest route`,
    detail: s => `Every pound goes in whole: no National Insurance on either side, and it reduces the company's Corporation Tax. Over ${s.d.yearsToRetirement} years that stream alone builds roughly ${gbp(s.d.fvOfMonthly(s.employerMonthlyContribution))}.`,
  },
  {
    id: 'annual-allowance-near',
    topic: 'contributions', severity: 'watch',
    when: s => (s.personalMonthlyContribution * 1.25 + s.employerMonthlyContribution) * 12 > 50000,
    headline: () => `You're near the £60,000 yearly pension limit`,
    detail: () => `Personal and company contributions share one £60,000 annual allowance. Unused allowance from the last three tax years can raise it — your accountant can confirm the exact headroom before anything goes over.`,
    action: { label: 'Add this to the accountant list', target: 'accountant-list' },
  },
  {
    id: 'carry-forward-window',
    topic: 'contributions', severity: 'act',
    when: s => s.ir35Status === 'outside' && s.businessCashAmount >= 30000,
    headline: () => `Three past years' unused allowance may still be usable`,
    detail: s => `With ${gbp(s.businessCashAmount)} expected in the company, a larger one-off contribution could use unused allowance from the last three tax years on top of this year's £60,000. The window rolls: each April, one old year drops off.`,
    action: { label: 'Ask your accountant for the exact figure', target: 'accountant-list' },
  },

  // ── IR35 ───────────────────────────────────────────────────────────────

  {
    id: 'ir35-unknown',
    topic: 'ir35', severity: 'act',
    when: s => s.ir35Status === 'unknown',
    headline: () => `One document decides your best route: the SDS`,
    detail: () => `Jack & Jones's parent is a large company, so by law they determine your IR35 status and must give you a Status Determination Statement. Whether it says inside or outside changes which pension route works — worth confirming before counting on the company route.`,
    action: { label: 'It is question 1 for your accountant', target: 'accountant-list' },
  },
  {
    id: 'ir35-inside-ltd',
    topic: 'ir35', severity: 'act',
    when: s => s.ir35Status === 'inside-ltd',
    headline: () => `Inside IR35, the company route needs checking first`,
    detail: () => `Tax comes off the contract money before it reaches your company, which can leave no untaxed profit to pay into a pension the usual way. Personal contributions with the automatic top-up still work in full — and your accountant may know a route via the fee-payer.`,
    action: { label: 'See the inside-IR35 questions', target: 'accountant-list' },
  },
  {
    id: 'ir35-inside-umbrella',
    topic: 'ir35', severity: 'watch',
    when: s => s.ir35Status === 'inside-umbrella',
    headline: () => `Ask your umbrella about salary sacrifice`,
    detail: () => `Umbrella employers can divert pay into your pension before tax and National Insurance are taken — a genuine saving on every pound diverted. Not all offer it and some charge a fee, so it is one phone call to find out.`,
  },

  // ── POTS & CHARGES ─────────────────────────────────────────────────────

  {
    id: 'pots-started',
    topic: 'pots', severity: 'good',
    when: s => s.d.potNow > 0,
    headline: s => `${gbp(s.d.potNow)} already saved — the start is done`,
    detail: s => `Left alone with typical growth, that becomes roughly ${gbp(s.d.potNow * Math.pow(1.05, s.d.yearsToRetirement) / Math.pow(1.025, s.d.yearsToRetirement))} by ${s.retirementAge} in today's money, before a single new pound goes in. Everything added now stacks on top of a base that already exists.`,
  },
  {
    id: 'two-pots-compare',
    topic: 'pots', severity: 'watch',
    when: s => s.avivaBalance > 0 && s.peoplesPensionBalance > 0,
    headline: () => `Two pots, two sets of charges — compare before combining`,
    detail: () => `People's Pension charges around 0.5% a year plus £6.50; Aviva's default fund is often nearer 0.28%, though it depends on the exact fund. Ask both for the charge on your specific pot, and whether any guarantees or exit fees exist, before moving anything.`,
    action: { label: 'The transfer checklist', target: 'guide:peoples-pension-transfer' },
  },
  {
    id: 'charges-high',
    topic: 'charges', severity: 'act',
    when: s => s.annualChargeRate >= 0.0075,
    headline: s => `Charges could quietly take ${gbp(s.d.chargeDrag(0.003))} before you retire`,
    detail: s => `That is the gap between your current charge and a typical low-cost fund, compounded over ${s.d.yearsToRetirement} years on your pot. Your annual statement shows the exact figure, and asking a provider about cheaper funds costs nothing.`,
    action: { label: 'What to look for', target: 'guide:fund-risk' },
  },
  {
    id: 'charges-low',
    topic: 'charges', severity: 'good',
    when: s => s.annualChargeRate > 0 && s.annualChargeRate <= 0.004,
    headline: () => `Your charges are on the cheap side — worth protecting`,
    detail: s => `Versus a typical 0.75% fund, staying at this level keeps roughly ${gbp(s.d.chargeDrag(0.0075) * -1 || 0)} of your own money over the years to ${s.retirementAge}. If you ever switch funds or providers, this is the number to defend.`,
  },
  {
    id: 'lifestyling-date-check',
    topic: 'charges', severity: 'watch',
    when: s => s.d.yearsToRetirement >= 8,
    headline: () => `Check the retirement date your funds think you have`,
    detail: s => `Default funds automatically shift into cautious assets as they approach the date on file — which may not be ${s.retirementAge}. A wrong date means winding down too early or too late; it is a five-minute login to check and a quick change to fix.`,
    action: { label: 'How to check in five minutes', target: 'guide:fund-risk' },
  },

  // ── STATE PENSION ──────────────────────────────────────────────────────

  {
    id: 'state-pension-full',
    topic: 'state-pension', severity: 'good',
    when: s => s.qualifyingYears >= 35,
    headline: () => `£1,046 a month for life is already secured`,
    detail: s => `A full State Pension pays £12,548 a year from ${s.statePensionAge}, rises with inflation, and never runs out. It is the floor under everything else in this plan — and it is done.`,
  },
  {
    id: 'state-pension-gap',
    topic: 'state-pension', severity: 'act',
    when: s => s.qualifyingYears < 35,
    headline: s => `Each missing year costs about £359 a year, for life`,
    detail: s => `You have ${s.qualifyingYears} of the 35 years needed for the full ${gbp(1046)} a month. Your real record is free to check on gov.uk in two minutes — years from raising children or caring are often already credited without people realising.`,
    action: { label: 'Check the real number on gov.uk', target: 'qualifyingYears' },
  },
  {
    id: 'salary-below-lel',
    topic: 'state-pension', severity: 'act',
    when: s => s.salary > 0 && s.salary < 6708,
    headline: () => `That salary may not bank a State Pension year`,
    detail: () => `Below £6,708 of salary, a year adds nothing to your State Pension record — dividends never count. From £6,708 the year is credited even though no National Insurance is actually due, which is why accountants usually set director salaries above this line.`,
    action: { label: 'Ask your accountant to confirm', target: 'accountant-list' },
  },

  // ── MORTGAGE & HOUSE ───────────────────────────────────────────────────

  {
    id: 'mortgage-clears-first',
    topic: 'mortgage', severity: 'good',
    when: s => s.mortgageBalance > 0 && s.d.mortgageClearAge <= s.retirementAge,
    headline: s => `Mortgage gone at ${s.d.mortgageClearAge} — ${gbp(s.d.mortgagePayment)} a month freed`,
    detail: s => `That is ${s.retirementAge - s.d.mortgageClearAge} working years with ${gbp(s.d.mortgagePayment)} a month no longer spoken for; redirected into a pension, it would add roughly ${gbp(s.d.incomeFromPot(s.d.mortgagePayment * 12 * (s.retirementAge - s.d.mortgageClearAge) * 1.1))} a month to retirement income. And retiring mortgage-free means the target figures here apply cleanly.`,
  },
  {
    id: 'mortgage-outlives-salary',
    topic: 'mortgage', severity: 'act',
    when: s => s.mortgageBalance > 0 && s.d.mortgageClearAge > s.retirementAge,
    headline: s => `The mortgage runs ${s.d.mortgageClearAge - s.retirementAge} years past the salary`,
    detail: s => `${gbp(s.d.mortgagePayment)} a month continues after work stops, on top of the ${gbp(s.d.targetMonthly)} target — which assumes a paid-off home. The levers are the retirement age, the term, or the overpayment slider below.`,
    action: { label: 'Try an overpayment', target: 'mortgageOverpayment' },
  },
  {
    id: 'all-house-no-pension',
    topic: 'mortgage', severity: 'watch',
    when: s => s.mortgageOverpayment > 0 && s.d.totalMonthlyContribution === 0,
    headline: () => `Every spare pound goes to the house, none gets the top-up`,
    detail: s => `Overpaying is a guaranteed saving and a fine choice — but it gets no tax relief, and bricks cannot pay a monthly income. £100 into the mortgage stays £100 of value; £100 into a pension starts as £125, which is why many people run a mix.`,
    action: { label: 'Compare the two sliders', target: 'personalMonthlyContribution' },
  },
  {
    id: 'equity-in-reserve',
    topic: 'house', severity: 'good',
    when: s => s.d.houseEquity >= 100000 && s.downsizeReleaseAmount === 0,
    headline: s => `${gbp(s.d.houseEquity)} of housing equity sits outside this plan`,
    detail: () => `None of it is counted in your projection, so it is a genuine reserve rather than a hope the plan leans on. If you ever wanted to see what downsizing could do, the box below models it — entirely optional.`,
  },
  {
    id: 'downsize-honesty-check',
    topic: 'house', severity: 'watch',
    when: s => s.downsizeReleaseAmount > 0,
    headline: s => `${gbp(s.downsizeReleaseAmount)} of this plan depends on moving house`,
    detail: s => `Freed at ${s.downsizeAge}, it adds roughly ${gbp(s.d.incomeFromPot(s.downsizeReleaseAmount))} a month — real money, and a legitimate plan. The honesty check: a plan that requires leaving a home you love is a fragile plan, so it is worth knowing whether the target works without it too.`,
  },

  // ── BUSINESS CASH ──────────────────────────────────────────────────────

  {
    id: 'business-lump-timing',
    topic: 'business', severity: 'watch',
    when: s => s.businessCashAmount > 0,
    headline: s => `${gbp(s.businessCashAmount)} arriving at ${s.businessCashAge} is doing a lot of work`,
    detail: () => `Money left in the company until the end usually faces more tax on the way out than steady company pension contributions along the way, and it misses years of growth. How to wind a company down tax-efficiently is a plan made years ahead — it is on your accountant list.`,
    action: { label: 'See the wind-down question', target: 'accountant-list' },
  },

  // ── ISA / BRIDGE / EMERGENCY ───────────────────────────────────────────

  {
    id: 'isa-is-the-bridge',
    topic: 'isa', severity: 'good',
    when: s => s.cashIsaBalance > 0 && s.d.bridgeYears >= 1,
    headline: s => `Your ${gbp(s.cashIsaBalance)} of savings works at any age`,
    detail: s => `Pensions unlock at 57 and the State Pension at ${s.statePensionAge}, but ISA money has no age lock at all. That makes it the natural bridge for the ${s.d.bridgeYears} years between stopping work and the State Pension starting.`,
  },
  {
    id: 'all-flexible-no-toppup',
    topic: 'isa', severity: 'watch',
    when: s => s.cashIsaMonthly > 0 && s.d.totalMonthlyContribution === 0,
    headline: () => `All new saving is flexible — none gets the top-up`,
    detail: s => `£100 into an ISA stays £100; £100 into a pension starts as £125 before any growth. The trade is access before 57 — which is a real reason, and worth being a deliberate choice rather than a default.`,
    action: { label: 'The trade-off in full', target: 'guide:pension-vs-isa' },
  },
  {
    id: 'keep-a-cushion',
    topic: 'isa', severity: 'watch',
    when: s => s.cashIsaBalance === 0 && s.d.totalMonthlyContribution >= 300,
    headline: () => `Worth keeping a cash cushion outside the pension`,
    detail: () => `Pension money cannot help in an emergency before 57, however much is in there. The usual guide is three to six months of costs in easy-access savings — nearer six with contracting income, which can be lumpy through no fault of yours.`,
  },

  // ── DELAY / MOMENTUM (see §3 for placement rules) ─────────────────────

  {
    id: 'change-just-paid',
    topic: 'delay', severity: 'good',
    // Fires once per session when a contribution slider increases.
    when: s => false /* event-driven: set by the slider change handler */,
    headline: s => `That change is worth about ${gbp(s.d.incomeFromPot(s.d.fvOfMonthly(1)) /* × the delta, computed by handler */)} a month at ${s.retirementAge}`,
    detail: () => `Nothing else to do — it compounds on its own from here. This is what "sorting the pension" actually looks like: one decision, made once.`,
  },
  {
    id: 'head-start',
    topic: 'delay', severity: 'watch',
    when: s => s.d.totalMonthlyContribution > 0,
    headline: s => `Starting this month keeps about ${gbp(s.d.delayCost12m(s.d.totalMonthlyContribution))} working for you`,
    detail: s => `That is the difference between this plan starting now and the same plan starting this time next year — not spent, just never earned. Every month earlier is a small head start that compounds for ${s.d.yearsToRetirement} years.`,
  },
]
```

### 1.4 Field → topic mapping for inline insights

| Field answered | Topics eligible |
|---|---|
| currentAge, retirementAge, planningAge | horizon, gap |
| salary | state-pension, gap |
| personalMonthlyContribution | contributions, delay |
| employerMonthlyContribution | contributions, ir35 |
| ir35Status (new field) | ir35, contributions |
| avivaBalance, peoplesPensionBalance | pots |
| annualChargeRate | charges |
| cashIsaBalance, cashIsaMonthly | isa |
| houseValue, mortgage* | mortgage, house |
| downsize* | house |
| businessCash* | business, contributions |
| statePensionAge, qualifyingYears | state-pension, horizon |
| targetIncome | gap |

---

## 2. THE ADAPTIVE ACCOUNTANT LIST

### 2.1 Structure

```ts
export interface AccountantQuestion {
  id: string
  when: (s: InsightState) => boolean
  /** Lower = earlier in the email. Ties broken by array order. */
  priority: number
  question: string | ((s: InsightState) => string)
  /** One line: why this matters, shown under the question in the app. */
  why: string
  /** One line: what a good answer sounds like, so she can judge the reply. */
  goodAnswer: string
}
```

Selection: filter by `when`, sort by priority, put the top **five** in the email body and any remainder under "If there's time". Five is deliberate — a ten-question email gets a slower, thinner reply.

### 2.2 The questions

```ts
export const ACCOUNTANT_QUESTIONS: AccountantQuestion[] = [
  {
    id: 'sds',
    when: s => s.ir35Status === 'unknown' || s.ir35Status === 'inside-ltd',
    priority: 1,
    question: 'Is my current Jack & Jones contract inside or outside IR35 — and can you send me the Status Determination Statement so I have it?',
    why: 'This one document decides which pension route works. Everything else flows from it.',
    goodAnswer: 'The actual SDS attached, with the stated reasons — not a guess from the contract type.',
  },
  {
    id: 'sds-confirm',
    when: s => s.ir35Status === 'outside',
    priority: 4,
    question: 'Can you confirm my Jack & Jones contract is still determined outside IR35, and that we hold the current Status Determination Statement?',
    why: 'The company-contribution plan rests on this staying true. Cheap to confirm annually.',
    goodAnswer: 'A yes with the SDS date, not just "should be fine".',
  },
  {
    id: 'company-contribution',
    when: s => s.ir35Status !== 'inside-umbrella',
    priority: 2,
    question: s => `How much could the company pay into my pension this year from profit, and what would that actually save compared with taking the same money as dividends? ${s.businessCashAmount > 0 || s.salary > 40000 ? 'Please show me the pounds-in-my-pocket comparison on my real numbers.' : ''}`,
    why: 'This is the single biggest tax lever a limited company contractor has — if the status allows it.',
    goodAnswer: 'A £-for-£ comparison on your figures (Corporation Tax, dividend tax, the lot) — not "pensions are generally tax-efficient".',
  },
  {
    id: 'inside-route',
    when: s => s.ir35Status === 'inside-ltd',
    priority: 2,
    question: 'Given I\'m inside IR35, is there any way to get pension money in before tax — through the fee-payer or agency, or by switching this engagement to an umbrella that offers salary sacrifice?',
    why: 'Inside IR35 via your own company, the pre-tax route is not automatic — it depends on what your specific fee-payer will do.',
    goodAnswer: 'A specific answer about your actual agency/fee-payer\'s practice, not a generic yes.',
  },
  {
    id: 'carry-forward',
    when: s => s.ir35Status !== 'inside-umbrella' &&
               (s.businessCashAmount >= 30000 ||
                (s.personalMonthlyContribution * 1.25 + s.employerMonthlyContribution) * 12 > 40000),
    priority: 3,
    question: 'How much unused pension Annual Allowance do I have from the last three tax years, across both my Aviva and People\'s Pension pots?',
    why: 'Unused allowance from three past years can sit on top of this year\'s £60,000 — and one old year drops off every April.',
    goodAnswer: 'A number, cross-checked against your pension statements — not an estimate.',
  },
  {
    id: 'salary-qualifying-year',
    when: () => true,
    priority: s => undefined as never, // see note: use 2 when salary < 6708, else 5 — implement as two entries or a priority fn
    question: 'What salary are you running for me this year, and does it definitely give me a qualifying year for my State Pension?',
    why: 'A salary below £6,708 silently costs a full year of State Pension — about £359 a year for life, per missed year.',
    goodAnswer: 'Confirmation the salary is at or above £6,708 (often £12,570), with a one-line reason.',
  },
  {
    id: 'wind-down',
    when: s => s.businessCashAmount > 0,
    priority: 6,
    question: s => `I expect around ${Math.round(s.businessCashAmount / 1000)}k to be left in the company when I eventually stop. What's the most tax-efficient way to take that out — dividends over time, Business Asset Disposal Relief, or a final pension contribution — and when do we need to start planning it?`,
    why: 'This decision is made years before the money moves, not on the day.',
    goodAnswer: 'A sketch of a plan with rough timings — not "we\'ll look nearer the time".',
  },
  {
    id: 'wholly-exclusively',
    when: s => s.employerMonthlyContribution * 12 >= 20000 || s.businessCashAmount >= 50000,
    priority: 5,
    question: 'If we make a larger one-off company contribution, are you comfortable it passes HMRC\'s "wholly and exclusively" test given my salary and what the company pays me overall?',
    why: 'For an owner-director, HMRC looks at the whole remuneration package. Your accountant\'s judgement here is exactly what a tool cannot provide.',
    goodAnswer: 'A reasoned yes referencing your actual remuneration — they carry the professional judgement on this.',
  },
  {
    id: 'records',
    when: () => true,
    priority: 9,
    question: 'What do you need from me, and by when, so none of this becomes a last-minute rush?',
    why: 'A calendar answer reduces more stress than most tax savings.',
    goodAnswer: 'A short list with dates.',
  },
]
```

*(Implementation note: `salary-qualifying-year` priority should be 2 when `salary < 6708`, else 5 — model `priority` as `number | ((s) => number)`.)*

### 2.3 The email copy

Generated with her top-five questions inserted. Subject and body deliberately short, first-person, and confident — she is not asking permission, she is running her company.

> **Subject:** Pension contributions from the company — a few questions
>
> Hi [name],
>
> I've been looking properly at my retirement plan and I'd like to start moving money from the company into my pension, rather than only taking dividends. Before I do, could you help me with these:
>
> 1. [question 1]
> 2. [question 2]
> 3. [question 3]
> 4. [question 4]
> 5. [question 5]
>
> If it's easier to talk any of this through on a call, happy to — but written answers I can keep would be really useful.
>
> Thanks,
> Kirsten

App copy above the email preview: *"These questions change as your answers do — the list below is built from what you've told us. Copy it, or edit anything before sending."* Below it, each question shows its `why` and `goodAnswer` lines so she can judge the reply when it comes back.

---

## 3. THE COST OF DELAY

**The problem:** loss-framing ("you've lost £X by waiting") is accurate and useless — for an anxious user who has just admitted avoiding this, it confirms the fear that made her avoid it. The design principle: **the past is structurally unreachable in this product.** No rule, chart, or copy may compute a number from a date earlier than today.

**The figure:** `delayCost12m(m)` — the future-value difference between starting her current total monthly contribution now versus in twelve months. For £500/month over 16 years at typical growth, roughly £13,000. One year, forward-looking, concrete.

**The framing — three rules:**
1. **Gain-frame, never loss-frame.** "Starting this month keeps about £13,000 working for you" — not "waiting costs you £13,000". Same number, opposite emotional payload.
2. **Show it only after she has something to protect.** The card never appears while contributions are zero — a £0 plan has no head start to keep, and showing delay-cost to someone who hasn't started reads as blame. First she sets a contribution, *then* the app shows what acting this month preserves.
3. **Pair every delay figure with a completed action.** The `change-just-paid` insight ("That change is worth about £X a month at 67 — nothing else to do") fires first; `head-start` follows. Momentum, then urgency — never urgency alone.

**Placement:** once per session, as a quiet card at the bottom of the results panel after the first contribution change — never a modal, never repeated on every recalculation, never on first load. If she reduces a contribution, the card does not fire (no punishment loops).

**The one permitted nod to her history**, used once in onboarding, not in the engine: *"Most people start this later than they'd like. The maths only ever cares about the next pound in, not the ones before it."*

---

## 4. TONE RULES

She said she had "been putting it off hoping for the best." The product's job is to make that sentence feel like the beginning of the story, not the confession at the end of it.

**Do:**
- **T1 — Open on a win.** Every results view leads with one `good` insight before anything marked `act`. There is always something true and positive: £30k saved, 35 NI years, £280k of equity, 16 years of runway.
- **T2 — Pounds, not percentages.** "£100 becomes £125", not "25% uplift". "£359 a year for life", not "1/35th of entitlement". Percentages only where a pound figure is impossible (charge rates as printed on statements).
- **T3 — Forward tense only.** Every number is about what the next decision does. Past-conditional grammar ("if you had", "you could have", "by now you would") is banned product-wide.
- **T4 — Name the next 15 minutes.** Every `act` insight carries an action doable today: a slider, a login, a question, an email. Big feelings shrink when the next step is small.
- **T5 — Say "worth asking / one option / many people" — never "you should" or "we recommend".** This is the FCA guidance boundary AND the right tone; the compliance rule and the kindness rule are the same rule.
- **T6 — `act` means "biggest win available", not "problem".** Style it as opportunity (e.g. "Company profit can reach your pension almost untaxed"), never alarm. No red, no warning triangles, no exclamation marks in anything above `good`.
- **T7 — Credit her instincts when they're right.** She proposed the company-contribution route herself; the copy says so ("exactly the question in your accountant email"). The tool confirms her judgement wherever honest.
- **T8 — Keep her providers' names.** "Your Aviva pot", "your People's Pension" — her actual life, not "Pension 1".

**Do not:**
- **T9 — Never call her late, behind, or a late starter.** No benchmarks against other 51-year-olds, no "people your age typically have £X" — comparison tables are shame with gridlines.
- **T10 — Never stack bad news.** Maximum two `act` cards per screen, and never two about the same field. If five things need attention, they take turns across sessions.
- **T11 — Never moralise a choice.** Overpaying the mortgage instead of the pension, ISA instead of pension, keeping the big house — each is framed as a trade with a real upside she may rightly want, never as a mistake.
- **T12 — Never celebrate with confetti or infantilise.** Warm is not cutesy. No emoji, no "amazing!!", no gold stars. The register is a capable friend who happens to know pensions: plain sentences, dry warmth, her numbers.
- **T13 — Never re-litigate an answered question.** Once she has set a value, insights build on it; they do not ask "are you sure?" unless a hard rule fires (e.g. salary below £6,708).
- **T14 — Never let a scary number stand alone.** Any shortfall or cost figure appears in the same card as the lever that moves it. A gap with no handle is anxiety; a gap with a slider is a plan.

**Litmus test for any new copy:** read it aloud as if saying it to Kirsten across a kitchen table the evening before she emails her accountant. If it would make her wince, apologise, or defend herself — rewrite. If it would make her open the laptop — ship it.

---

## 5. THE PRIORITISED ACTION PLAN — "exactly what to do to hit your goals"

This is the payoff screen. Given her complete state, it produces a ranked list of the specific actions available to her, each with a pound-figure impact computed from her real numbers by the engine — never asserted in copy. It re-ranks on every input change, deterministically.

**Compliance shape:** the plan is maximally directive about *actions* — check this, ask that, this arithmetic beats that by £X — and never names a specific fund or provider as the right one for her. "Ask Aviva what lower-cost funds are available in your scheme" is an action; "move to Fund Y" is a personal recommendation and is banned.

### 5.1 Types

```ts
/**
 * Effort is what an action takes FROM HER — time, money or life — not just admin:
 *   1  one login, call or email (≤15 minutes, costs nothing)
 *   2  a form plus a professional conversation (accountant / provider)
 *   3  a change to the monthly budget or working pattern
 *   4  a life decision that spends time (working longer)
 *   5  selling or leaving the home
 */
export type Effort = 1 | 2 | 3 | 4 | 5

export interface Action {
  id: string
  when: (s: InsightState) => boolean
  headline: (s: InsightState) => string          // <12 words, imperative
  /** £/month of retirement income at her retirement age, today's money. */
  impact: (s: InsightState) => number
  impactCopy: (s: InsightState) => string        // "worth about £235 a month at 67"
  cost: (s: InsightState) => string              // what it takes from her, honestly
  effort: Effort
  payback: 'immediate' | 'compounds' | 'at-retirement'
  /**
   * If unmet, this card is REPLACED in the list by its prerequisite step,
   * which inherits this action's score (see 5.2 rule 5). That is how "confirm
   * your SDS" can outrank everything while the company route is unverified.
   */
  requires?: { step: string; unmet: (s: InsightState) => boolean }
  firstStep: string                              // the next 15 minutes
}
```

### 5.2 The ranking algorithm — deterministic and explicable

1. **Filter** by `when(s)`.
2. **Common unit.** Every impact is expressed as £/month of retirement income in today's money: one-off pots and £ savings convert via `d.incomeFromPot`; lifelong streams (State Pension years) count at face £/month. (This slightly undervalues guaranteed inflation-linked income — acceptable, and it biases toward certainty being *under*sold, never oversold.)
3. **Cap at the goal.** `capped = min(impact, max(d.shortfallMonthly, 100))`. Once she is on track, every action's usable impact shrinks toward the £100 floor and the list naturally quietens down instead of nagging a solved plan.
4. **Score.** `score = capped / 2 ** (effort - 1)`. Each step up the effort scale halves the score — stated on screen as "ordered by what moves your number most for the least effort."
5. **Prerequisite substitution.** If `requires.unmet(s)`, swap the card for its prerequisite step carrying the same score, styled as "unlocks about £X a month". Deterministic, and it explains itself.
6. **Sort** by score desc; ties by raw impact desc; remaining ties by array order.
7. **Display** the top six; the rest under a collapsed "more options". On-screen caption: *"Ordered by what moves your number most for the least effort. Change anything above and the order changes with it."*

Because `impact` is marginal to *current* state, re-ranking is automatic: raise the contribution slider and the shortfall falls, the caps tighten, contribution-type actions sink, and cheap one-login actions (NI record, fund date) rise. No special-case code.

### 5.3 The actions

```ts
export const ACTIONS: Action[] = [

  {
    id: 'confirm-sds',
    when: s => s.workingArrangement === 'unknown',
    // Inherits company-contributions' score via the prerequisite mechanism.
    headline: () => `Confirm your IR35 status — it is one document`,
    impact: s => companyContributionDelta(s),      // what it unlocks
    impactCopy: s => `Unlocks about ${gbp(companyContributionDelta(s))} a month at ${s.retirementAge} if it says outside`,
    cost: () => `Nothing — Jack & Jones are legally required to have issued it.`,
    effort: 1, payback: 'immediate',
    firstStep: 'Ask your agency or accountant for the Status Determination Statement — question 1 in your email.',
  },

  {
    id: 'company-contributions',
    when: s => s.workingArrangement === 'ltd_outside_ir35' || s.workingArrangement === 'unknown',
    requires: { step: 'confirm-sds', unmet: s => s.workingArrangement === 'unknown' },
    headline: () => `Pay the pension from company profit, not dividends`,
    // Reference stream R = £500/mo of profit, or her current personal
    // contribution if larger (she'd redirect what she already pays).
    // Delta = full R into pension vs the dividend-taxed remnant of R.
    impact: s => companyContributionDelta(s),
    impactCopy: s => `Worth about ${gbp(companyContributionDelta(s))} a month at ${s.retirementAge}, on £500 a month of profit`,
    cost: () => `Nothing from your own pocket — company cash committed until at least 57.`,
    effort: 2, payback: 'compounds',
    firstStep: 'Send the accountant email — it is already written below.',
  },

  {
    id: 'inside-ir35-route',
    when: s => s.workingArrangement === 'ltd_inside_ir35',
    headline: () => `Ask about a pre-tax pension route inside IR35`,
    impact: s => companyContributionDelta(s) * 0.5,   // discounted: fee-payer discretion, not guaranteed
    impactCopy: s => `Up to ${gbp(companyContributionDelta(s))} a month at ${s.retirementAge} if your fee-payer or an umbrella allows it`,
    cost: () => `Possibly a change of payment arrangement; personal contributions work regardless.`,
    effort: 2, payback: 'compounds',
    firstStep: 'Ask your accountant whether your fee-payer will divert fees to a pension, or whether an umbrella with salary sacrifice beats staying as you are.',
  },

  {
    id: 'umbrella-sacrifice',
    when: s => s.workingArrangement === 'umbrella',
    headline: () => `Set up salary sacrifice through your umbrella`,
    impact: s => companyContributionDelta(s) * 0.8,
    impactCopy: s => `Roughly ${gbp(companyContributionDelta(s) * 0.8)} a month at ${s.retirementAge} on £500 a month sacrificed`,
    cost: () => `£500 less salary a month; every sacrificed pound dodges tax and both NIs.`,
    effort: 2, payback: 'compounds',
    firstStep: 'One call to the umbrella: do you offer pension salary sacrifice, and is there a fee?',
  },

  {
    id: 'raise-personal-contribution',
    when: s => s.personalMonthlyContribution < 2000,
    headline: () => `Pay in £250 a month more yourself`,
    impact: s => s.d.incomeFromPot(s.d.fvOfMonthly(250 * 1.25)),
    impactCopy: s => `Worth about ${gbp(s.d.incomeFromPot(s.d.fvOfMonthly(312.5)))} a month at ${s.retirementAge} — £250 from you becomes £312 in the pot`,
    cost: () => `£250 a month of take-home, locked away until 57.`,
    effort: 3, payback: 'compounds',
    firstStep: 'Move the contribution slider and watch the projection; then set up the direct debit with either provider.',
  },

  {
    id: 'check-ni-record',
    when: s => s.qualifyingYears < 35 || s.unknown?.qualifyingYears === true,
    headline: () => `Check your State Pension record — two minutes, free`,
    impact: s => Math.max(0, (35 - s.qualifyingYears)) * 29.9,
    impactCopy: s => `Each missing year is about £30 a month for life; you show ${s.qualifyingYears} of 35`,
    cost: () => `Free to check. Filling a past year, if needed, typically costs under £1,000 — and years from caring or raising children may already be credited.`,
    effort: 1, payback: 'at-retirement',
    firstStep: 'gov.uk State Pension forecast, signed in with the HMRC app.',
  },

  {
    id: 'fund-date-and-risk',
    when: s => s.d.yearsToRetirement >= 8,
    headline: () => `Check what your two funds think you're doing`,
    // Band, not point estimate: pot difference between a cautious-band and a
    // growth-band SMPI rate over her horizon. Displayed as "up to".
    impact: s => s.d.incomeFromPot(s.d.potNow * (Math.pow(1.05 / 1.025, s.d.yearsToRetirement) - Math.pow(1.01 / 1.025, s.d.yearsToRetirement))) * 0.5,
    impactCopy: s => `Up to ${gbp(s.d.incomeFromPot(s.d.potNow * (Math.pow(1.05 / 1.025, s.d.yearsToRetirement) - Math.pow(1.01 / 1.025, s.d.yearsToRetirement))))} a month at stake if a pot is parked in a cautious fund with ${s.d.yearsToRetirement} years to run`,
    cost: () => `Fifteen minutes of logging in. Changing a fund choice later is free on both platforms.`,
    effort: 1, payback: 'compounds',
    firstStep: 'Log into Aviva, then People\'s Pension: note each fund name and the retirement date on file. The fund-risk guide walks through it.',
  },

  {
    id: 'cut-charges',
    when: s => s.annualChargeRate >= 0.005,
    headline: () => `Ask both providers what your pots actually cost`,
    impact: s => s.d.incomeFromPot(s.d.chargeDrag(0.003)),
    impactCopy: s => `Roughly ${gbp(s.d.incomeFromPot(s.d.chargeDrag(0.003)))} a month at ${s.retirementAge} if charges came down to a typical low-cost level`,
    cost: () => `Two phone calls. If a move ever follows, check guarantees and exit fees first — the transfer guide has the exact questions.`,
    effort: 2, payback: 'compounds',
    firstStep: 'Ask each provider: what is the exact yearly charge on my pot, and what lower-cost funds are available in my scheme?',
  },

  {
    id: 'carry-forward-lump',
    when: s => s.workingArrangement === 'ltd_outside_ir35' && s.businessCashAmount >= 30000,
    requires: { step: 'company-contributions', unmet: s => s.employerMonthlyContribution === 0 },
    headline: () => `Move a lump of company cash in early, not at the end`,
    // Engine diff: min(businessCashAmount, 60000) contributed now vs arriving
    // (taxed on extraction) at businessCashAge — both paths already modelled.
    impact: s => lumpNowVsAtWinddown(s),
    impactCopy: s => `Worth about ${gbp(lumpNowVsAtWinddown(s))} a month at ${s.retirementAge} versus leaving it in the company to the end`,
    cost: () => `Company cash locked until 57; needs your accountant's carry-forward figure and comfort on affordability first.`,
    effort: 2, payback: 'compounds',
    firstStep: 'Add the carry-forward question to the accountant email — it is in the list.',
  },

  {
    id: 'work-one-more-year',
    when: s => s.retirementAge < 70,
    headline: s => `Retire at ${s.retirementAge + 1} instead of ${s.retirementAge}`,
    impact: s => s.d.projectionAt(s.retirementAge + 1) - s.d.projectedMonthly,   // engine re-run, add to Derived
    impactCopy: s => `Worth about ${gbp(s.d.projectionAt(s.retirementAge + 1) - s.d.projectedMonthly)} a month, every month after — one more year of paying in, growing, and one fewer year to fund`,
    cost: () => `A year of retired life. The only action here that costs time instead of money — which is why it ranks below anything cheaper that closes the same gap.`,
    effort: 4, payback: 'at-retirement',
    firstStep: 'Move the retirement age slider one notch and see whether the cheaper actions above close the gap first.',
  },

  {
    id: 'part-time-glide',
    when: s => s.retirementAge < 70,
    headline: () => `Taper to part-time instead of stopping dead`,
    // Modelled as ~half salary for 2 years past retirementAge: pots untouched
    // + small contributions continue. Engine scenario, add to Derived.
    impact: s => s.d.partTimeGlideDelta(2),
    impactCopy: s => `Two part-time years are worth about ${gbp(s.d.partTimeGlideDelta(2))} a month after — the pots stay untouched while the pressure comes off`,
    cost: () => `Two more years of some work — on contracting terms you already control.`,
    effort: 3, payback: 'at-retirement',
    firstStep: 'Nothing to sign today: note it as the fallback if the gap remains after the money actions.',
  },

  {
    id: 'isa-bridge',
    when: s => s.d.bridgeYears >= 1 || s.retirementAge <= 58,
    headline: () => `Build the before-57 bridge in an ISA`,
    impact: s => s.d.incomeFromPot(s.d.fvOfMonthly(200) * 0.8),   // no relief; conservative growth on cash-side mix
    impactCopy: s => `£200 a month builds roughly ${gbp(s.d.fvOfMonthly(200) * 0.8)} of any-age money by ${s.retirementAge} — this buys freedom before 57, not extra income after`,
    cost: () => `£200 a month with no tax top-up — the price of keeping it reachable.`,
    effort: 3, payback: 'gradual' as never /* 'compounds' */,
    firstStep: 'Decide the pension/ISA split with the guide — it is a genuine judgement call, not arithmetic.',
  },

  {
    id: 'overpay-mortgage',
    when: s => s.mortgageBalance > 0 && s.mortgageYearsLeft > 2,
    headline: () => `Overpay the mortgage £100 a month`,
    // Interest saved + payment freed earlier, engine-computed; guaranteed.
    impact: s => s.d.overpayDelta(100),
    impactCopy: s => `Saves about ${gbp(s.d.overpayInterestSaved(100))} of interest and clears the mortgage ${s.d.overpayMonthsEarlier(100)} months sooner — a guaranteed return, worth about ${gbp(s.d.overpayDelta(100))} a month at ${s.retirementAge}`,
    cost: () => `£100 a month, with no tax relief and hard to get back out — which is why the pension routes usually rank above it.`,
    effort: 3, payback: 'at-retirement',
    firstStep: 'Check your lender\'s fee-free overpayment limit (commonly 10% of balance a year), then try the overpayment slider.',
  },

  {
    id: 'downsize-later',
    when: s => s.d.houseEquity >= 150000,
    headline: () => `Price up downsizing — as a reserve, not a plan`,
    impact: s => s.d.incomeFromPot(s.downsizeReleaseAmount > 0 ? s.downsizeReleaseAmount : s.d.houseEquity * 0.25),
    impactCopy: s => `Freeing ${gbp(s.downsizeReleaseAmount > 0 ? s.downsizeReleaseAmount : s.d.houseEquity * 0.25)} would add about ${gbp(s.d.incomeFromPot(s.downsizeReleaseAmount > 0 ? s.downsizeReleaseAmount : s.d.houseEquity * 0.25))} a month — powerful, and the most expensive thing on this list to be wrong about`,
    cost: () => `Your home. Ranked last on purpose: everything above it should be exhausted first.`,
    effort: 5, payback: 'at-retirement',
    firstStep: 'Only this: check what smaller places near you actually cost, so the downsizing box holds a real number instead of a hope.',
  },
]
```

*(Helpers `companyContributionDelta`, `lumpNowVsAtWinddown`, `projectionAt`, `partTimeGlideDelta`, `overpayDelta/InterestSaved/MonthsEarlier` are engine functions to add to `Derived` — each is a diff of two full projection runs, so the numbers are always the engine's own, never copy-time arithmetic. `companyContributionDelta(s)` = income from FV of £max(500, personalMonthlyContribution)/mo paid whole, minus income from FV of the same profit taken as dividends at her band and saved — ≈ £235/mo on defaults.)*

### 5.4 Worked re-rank on her defaults (sanity check for the implementer)

Defaults: outside IR35 unconfirmed (`unknown`), £250 personal, £0 company, 35 NI years, 0.5% charge, shortfall £1,499/mo. Approximate scores (`capped/2^(effort-1)`): **confirm-sds ≈ 235** (inherits company route, effort 1) → **fund-date-and-risk ≈ 120** (band, effort 1) → **cut-charges ≈ 38** → **raise-personal ≈ 65/4 ≈ 16**... list opens with the SDS card on top, which is exactly right. She then sets `workingArrangement = 'ltd_outside_ir35'` and `employerMonthlyContribution = 500`: the SDS card vanishes, company-contributions is satisfied and drops out, the shortfall falls, every cap tightens, and the top of the list becomes fund-date-and-risk and check-ni-record — the cheap verifications. The product visibly answers "done — what's next?" without a single special case.

---

## 6. PURITY CONTRACT — the whole advisory layer is one function of state

**The rule:** insights, actions, accountant questions and the email are produced by a single pure entry point:

```ts
advise(state: InsightState): {
  insights: RenderedInsight[]
  actions: RankedAction[]
  accountantQuestions: RenderedQuestion[]
  emailBody: string
}
```

No advisory copy is stored, cached across state changes, or hardcoded to today's snapshot of her. Memoise by a hash of `state` if needed; recompute on every input change. The two "once per session" behaviours in §3 (`change-just-paid`, `head-start`) are **presentation-layer throttles**: the engine always returns them when their conditions hold; the UI decides whether to show them again. Purity lives in the engine, politeness lives in the view.

**Unknown-state table** — what each layer says before she answers, and how it flips after. `workingArrangement` defaults to `'unknown'` and per-field `unknown` flags exist in the store; use them, never a guess:

| Unknown | Before she answers | After |
|---|---|---|
| `workingArrangement = 'unknown'` | Insight `ir35-unknown` (act); action list shows `confirm-sds` carrying the company route's inherited score; email leads with the SDS question. Copy says "if it says outside" — conditional, never assumed. | `ltd_outside_ir35`: company rules activate in full. `ltd_inside_ir35`: `inside-ir35-route` replaces the company action; personal-contribution insights emphasised. `umbrella`: `umbrella-sacrifice`. `employee`: company cards suppressed; employer-match framing only. `sole_trader`: personal relief-at-source route only. |
| `unknown.avivaBalance` / `unknown.peoplesPensionBalance` | Projection uses the estimate but every insight quoting `potNow` appends "— based on your estimate; the real statement figure sharpens this." Action `fund-date-and-risk` gains a second first-step: note the balance while logged in. | Flag clears automatically when she types a figure (store already does this). Caveat text disappears. |
| `qualifyingYears` untouched default (35) | The `state-pension-full` good insight softens to "likely secured — worth the free two-minute check", and `check-ni-record` stays in the action list at effort 1. Never celebrate an assumed 35 as fact. | Real number entered: full celebration at ≥35, or the gap rules with real pound figures below 35. |
| `fundRiskLevel` (store default `'growth'`) | Treated as unverified until the fund-check step is marked answered: `fund-date-and-risk` shows the "up to £X" band. | Marked checked: band collapses; if she recorded `cautious` with 8+ years to run, the horizon insight fires with the engine's own growth-band delta. |
| `annualChargeRate` at 0.5% default | Charge insights phrase as "at a typical 0.5% —" and `cut-charges` first step is "find the real number on your statement". | Real rate entered: pound-figure drag computed on it directly. |

**Test invariant for CI:** for any two states `a`, `b` with `a ≡ b`, `advise(a) ≡ advise(b)`; and for every rule, flipping only the fields its `when` reads must be sufficient to change its output. No rule may read module-level state, dates other than `state`-derived ages, or Kirsten-specific constants beyond the sourced 2026/27 tax figures in `contractor.ts`.
