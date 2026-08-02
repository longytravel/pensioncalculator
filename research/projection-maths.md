# UK Pension Projection Maths — Implementation Spec
Prepared 2 Aug 2026. All rates/allowances are 2026/27 tax year unless stated.

## 0. Architecture recommendation

- **Accumulation**: simulate year-by-year (or month-by-month) in code, not a single closed-form
  formula. Closed-form annuity-due algebra is used for (a) unit tests / sanity checks and (b) the
  inverse "how much to save" calculation. A loop is needed anyway once charges, escalating
  contributions, lifestyling glidepaths, and tax relief timing are added — keep the closed form as
  the *validated core*, wrap it in a loop for the real feature set.
- **Decumulation**: default to the **deterministic 3-scenario model** (Low/Mid/High growth), because
  it mirrors the regulated illustrations (SMPI) a user may already receive from providers, is fast,
  and is easy to explain. Offer **Monte Carlo as an optional "stress test" layer**, specifically on
  the decumulation phase, where sequence-of-returns risk actually bites. Don't Monte Carlo the
  accumulation phase in v1 — low value for the complexity.
- **Real terms by default**, nominal as a toggle (see §1.6).
- **Tax**: pure function `grossToNet(gross, statePension, bandTable)` — a band-walk, parameterised
  by a bands table so Scotland is just a different table, not different code.

## 1. Accumulation model

### 1.1 Core formula — lump sum + growing annuity-due of contributions

Future value of existing pot:
  FV_lump = P0 * (1 + r)^n

Future value of a **growing annuity-due** (contribution paid at the *start* of each period, growing
at rate g per period, invested at rate r per period, for n periods):

  FV_contrib = C * [ (1+r)^n - (1+g)^n ] / (r - g) * (1+r)      [ if r ≠ g ]
  FV_contrib = C * n * (1+r)^n                                   [ if r = g, limiting case ]

Total pot at horizon: FV = FV_lump + FV_contrib

"Annuity-due" (not ordinary annuity) because pension contributions are conventionally paid at the
start of the month/period they cover.

### 1.2 Monthly vs annual compounding

Use the **effective monthly rate** derived geometrically from the annual nominal assumption, not
annual/12:

  r_month = (1 + r_annual)^(1/12) - 1

This avoids overstating growth relative to how funds actually compound. Contributions escalate
**annually, not monthly** (that's how salary reviews / inflation-linked contribution increases
actually happen) — so structure the loop as: for each year, run 12 monthly annuity-due steps at a
fixed contribution amount, then step the contribution up by (1+g) for the next year. A pure
closed-form monthly-growing-annuity is unrealistic for this reason; a year-by-year loop of the
formula above (n=12 per year) is the practical implementation.

```typescript
function projectPot(
  startingPot: number,
  monthlyContribution: number, // gross, at start of first year
  annualGrowthRate: number,    // nominal, net of charges (see §1.4)
  annualContributionGrowth: number, // g — inflation- or salary-linked (see §1.3)
  years: number
): number {
  const rMonth = Math.pow(1 + annualGrowthRate, 1 / 12) - 1;
  let pot = startingPot;
  let contribution = monthlyContribution;
  for (let y = 0; y < years; y++) {
    pot = growingAnnuityDueFV(pot, contribution, rMonth, 0, 12); // g=0 within the year
    contribution *= 1 + annualContributionGrowth; // step up for next year
  }
  return pot;
}

function growingAnnuityDueFV(
  startingValue: number,
  payment: number,
  r: number,
  g: number,
  n: number
): number {
  const growthFactor = Math.pow(1 + r, n);
  const lumpFV = startingValue * growthFactor;
  const contribFV =
    Math.abs(r - g) < 1e-9
      ? payment * n * growthFactor
      : (payment * (growthFactor - Math.pow(1 + g, n))) / (r - g) * (1 + r);
  return lumpFV + contribFV;
}
```

### 1.3 Escalating contributions (inflation- or salary-linked)

Two escalation modes, same formula, different g:
- **Inflation-linked**: g = assumed CPI (keeps *real* contribution constant)
- **Salary-linked**: g = assumed salary growth rate (keeps contribution as constant % of salary)

Recommend defaulting to salary-linked escalation for employed users (matches how workplace pension
%-of-salary contributions actually behave) and offering inflation-linked as the alternative for
self-employed / fixed-contribution users.

### 1.4 Charges as an annual drag

Net the fund's ongoing charges off the gross growth assumption **geometrically**, not by simple
subtraction, for correctness (subtraction is a common industry shorthand and is close enough below
~1% total charge, but geometric is exact and equally cheap to compute):

  r_net = (1 + r_gross) / (1 + charge_annual) - 1

Where `charge_annual` = platform fee + fund OCF (+ any adviser charge). Apply this once to get a
single net growth rate fed into §1.1; don't apply charges as a separate cashflow line unless the
product wants to show "charges paid: £X" as a UI line item, in which case compute
`FV(r_gross) - FV(r_net)` as the charges-drag figure for display.

### 1.5 Tax relief on personal contributions (gross-up)

- **Relief at source** (most SIPPs/personal pensions, and some workplace schemes): user pays a NET
  amount; provider claims 20% basic-rate relief from HMRC and adds it. Gross-up:

    gross_contribution = net_contribution / (1 - basic_rate) = net_contribution / 0.8

  Higher/additional-rate taxpayers claim the *extra* relief (beyond 20%) via Self-Assessment as a
  **tax refund / lower tax bill**, not as more money into the pension — model this as a separate
  "effective net cost of contribution" figure for UI purposes, not as a bigger pot.

- **Net pay arrangement** (many workplace pensions): contribution is deducted from gross salary
  before tax, so the "gross contribution" *is* the deduction — no gross-up step, and higher-rate
  relief is automatic and immediate (no self-assessment claim needed).

- **Employer contributions**: added on top of the (already-grossed) employee contribution at their
  stated gross amount — never gross these up, employers pay gross with no relief mechanic.

Implementation: expose a `contributionType: 'relief_at_source' | 'net_pay' | 'salary_sacrifice'`
input; only relief-at-source needs the /0.8 step. (Salary sacrifice behaves like net pay for pot
growth, but also removes NI — out of scope for the pot maths, relevant only to a "cost to you" UI
figure.)

### 1.6 Real vs nominal

- **Default to real terms ("today's money")** — this is what MoneyHelper, PLSA and most consumer
  tools do, because people reason in today's purchasing power, not in inflated future pounds that
  mean nothing intuitively.
- Deflation formula, applied at the point of *display*, not baked into the growth-rate maths:

    real_value_at_year_n = nominal_value_at_year_n / (1 + CPI)^n

- Compute everything in nominal terms internally (this keeps charges, tax bands — which are
  themselves stated in today's nominal pounds and usually assumed frozen or CPI-uprated — and
  contribution escalation consistent), then deflate only the final pot/income figures for display.
- Offer a nominal toggle for users who want to cross-check against fixed nominal targets (e.g. "pay
  off a nominal mortgage balance").

## 2. Assumption defaults

| Scenario | Nominal growth (global-equity-heavy default fund) | Nominal growth (cautious/lifestyled) | Basis |
|---|---|---|---|
| Low | 2% | 1% | FCA COBS 13 Annex 2 historical "low" projection maximum; still the reference floor used industry-wide since the 2014 rate cut (5/7/9% → 2/5/8%) |
| Mid | 5% | 3.5% | FCA COBS 13 Annex 2 "intermediate" maximum; also close to Vanguard/Morningstar-style capital-market-assumption midpoints for a global 80/20-equity fund net of nothing |
| High | 8% | 5.5% | FCA COBS 13 Annex 2 "high" maximum |

Important nuance: **these FCA 2/5/8% figures are regulatory *maximums*, not forecasts** — since
2017-ish rule changes, firms use "fund-specific" rates (classified Type A–G by volatility, ranging
roughly −1% for cash to 8% for equity/property, reviewed quarterly) which are often *below* these
caps for real funds. Recommend treating 2/5/8% as the sanctioned ceiling and defaulting the actual
mid-case assumption at or just under 5% for a genuinely equity-heavy fund, dropping to ~3.5–4% mid
for a cautious/lifestyled fund glidepath.

| Assumption | Default | Source |
|---|---|---|
| CPI inflation | 2.0% (BoE target) or 2.5% (common long-run planning convention seen across MSE/industry calculators) — **recommend 2.5%** as the planning default since it's more conservative and widely used in consumer tools | Bank of England target; MoneyHelper-adjacent calculators |
| Salary growth | CPI + 1% (i.e. ~3.5% nominal at 2.5% CPI) | Standard planning convention; no single authoritative figure — flag as adjustable assumption |
| Total charges (platform + fund OCF) | 0.5% default; range 0.3%–0.85% | Platform fees 0.15–0.45%, OCF 0.06–0.25% (passive) to 0.5–1.0%+ (active); FCA workplace-default charge cap is 0.75% AMC |

**Resulting real (CPI-deflated) returns at 2.5% CPI:**

| Scenario | Growth fund real | Cautious fund real |
|---|---|---|
| Low | −0.5% | −1.5% |
| Mid | 2.4% | 1.0% |
| High | 5.4% | 2.9% |

(computed as (1+nominal)/(1+CPI) − 1, e.g. mid: 1.05/1.025 − 1 = 2.44%)

## 3. Decumulation model

### 3.1 Safe withdrawal rate (SWR) approach

- **US origin**: Bengen's 1994 "4% rule" — 4% of an initial 50/50 stock/bond US portfolio, inflation
  -uprated thereafter, historically survived every 30-year US retirement.
- **UK/global evidence is lower**: Morningstar's 2026 UK figure is **3.7–3.9%** (30-year horizon, 90%
  success probability, 30–50% equity portfolio) — because UK long-run real returns are lower than
  the US, UK platform/fund costs are higher, and Morningstar's methodology is forward-looking
  (capital market assumptions) rather than historical-US-backtest.
- **Vanguard** UK-oriented work suggests **3–4%** for a 30-year retirement with no legacy goal.
- **Bengen's 2025 update** ("A Richer Retirement") raises his own figure to **4.7%** starting (up to
  ~5.25–5.5% with spending flexibility) — but this uses a more diversified (beyond 50/50) US-centric
  portfolio; treat as upper-bound context, not a UK default.
- **Okusanya/FinalytiQ** critique: flat 3–4% "rules" ignore individual circumstances; UK retirees'
  real spending tends to *decline* ~1–2%/year through retirement (the "retirement smile"), and
  dynamic/guardrail strategies (Guyton-Klinger) can sustain **~5–5.7%** starting rates by cutting
  spending after bad years.

**Recommended defaults**: Low 3.0% / Mid 3.5% / High 4.0% for the static SWR model; expose a
"dynamic/guardrails" mode (start 4.5–5%, cut spending by ~10% after a year the pot falls >X% below
plan) as an advanced option, clearly labelled as more optimistic but requiring active management.

Mechanic: `income_year_1 = pot * SWR`; `income_year_t = income_year_(t-1) * (1 + CPI)` regardless of
actual portfolio performance that year (classic fixed-real-withdrawal rule) — run until pot hits
zero or the modelled horizon ends, whichever first, and report which happened.

### 3.2 Amortisation / drawdown-to-zero-at-age-X

Closed-form, invertible — solve for a level (real) annual income that exhausts the pot exactly at a
chosen planning age. Annuity-due form (income drawn at start of year):

  income = pot * r / [ (1 - (1+r)^-n) * (1+r) ]

where r = assumed **real** net return during drawdown, n = years from retirement to planning age.
Use real r directly here (rather than nominal-then-deflate) since this is explicitly a "level real
income" solve.

```typescript
function amortisedIncome(pot: number, realRate: number, years: number): number {
  if (Math.abs(realRate) < 1e-9) return pot / years; // zero-growth edge case
  return (pot * realRate) / ((1 - Math.pow(1 + realRate, -years)) * (1 + realRate));
}
```

This is a planning benchmark, not a promise — running the pot to exactly zero at a chosen age has
zero margin if the person lives longer, so present it alongside (a) the SWR method and (b)
partial annuitisation, not as a sole output.

### 3.3 Annuity purchase

Model as optional partial or full annuitisation of the pot at retirement. Current UK annuity income
per £100,000 purchase price is genuinely volatile day-to-day (tracks gilt yields) and quotes vary
15%+ across providers — treat any table as **illustrative only, not a live quote**, and say so in
the UI. Indicative Aug-2026 level, single-life, no-guarantee figures (mid-market, healthy life):

| Age | Annual income per £100,000 (level, single life) |
|---|---|
| 60 | ~£6,200 |
| 65 | ~£7,700 |
| 70 | ~£9,200 |
| 75 | ~£11,500 |

Adjustments to apply to the base table:
- **Escalating (RPI-linked)** annuity: roughly 30–40% *less* starting income than level, for the
  same purchase price (it grows with inflation instead).
- **Joint life** (income continues to survivor, typically at 50–100%): roughly 10–15% less starting
  income than single life, depending on survivor % and age gap.
- **Enhanced/impaired-life** annuities (smoker, health conditions): can pay 10–40%+ more — out of
  scope unless the product collects health data.

### 3.4 Sequence-of-returns risk (plain English, for the spec/UI copy)

A market fall early in retirement does far more damage than the same fall late in retirement (or
during accumulation), because you're forced to sell a bigger *proportion* of an already-shrinking
pot to fund withdrawals — locking in the loss permanently. The same fall while still contributing
(accumulation) or late in a long drawdown barely matters, because you're either buying more units
cheaply or have few years of withdrawals left to be damaged. This is precisely what a deterministic
straight-line growth model **cannot** show — it's the core justification for offering Monte Carlo /
historical bootstrap on the decumulation phase specifically (§7).

### 3.5 Longevity and planning age

- ONS **cohort** life expectancy at 65 (2023-based cohort data, i.e. including projected future
  mortality improvements): approx. **19.8 more years for men (→ ~84.8)**, **22.5 more years for
  women (→ ~87.5)**. Cohort figures run several years higher than *period* life expectancy (which
  ignores future mortality improvement) — use cohort, not period, for retirement planning.
- The commonly-cited "1 in 4 of today's 65-year-olds will live into their 90s" shape is directionally
  right but **verify the exact current percentile figures against the ONS interactive life
  expectancy calculator** before hardcoding a specific "1-in-4 lives to age X" claim in the product —
  this was not confirmed against a primary-source figure in this research pass; don't ship it as a
  precise stated fact without that check.
- **Recommended default planning age: 95**, for both sexes and for a couple (i.e. plan until the
  *later* of two lives if modelling a couple) — comfortably past median cohort life expectancy for a
  private-pension-holding demographic (typically longer-lived than the general population) while
  not being so extreme (100) that it forces unrealistically low sustainable income for the median
  case. Offer 100 as an explicit "extra caution" toggle.

## 4. Tax in retirement

### 4.1 Pension Commencement Lump Sum (PCLS) / Lump Sum Allowance (LSA)

- 25% of a pot can normally be taken tax-free on first accessing it, from age 55 (rising to 57 in
  2028).
- Capped by the **Lump Sum Allowance**: **£268,275** lifetime cap on total tax-free cash across *all*
  pensions combined (replaced the old Lifetime Allowance from 6 April 2024). Once used up, further
  lump sums are taxed as income.
- Model: `pcls = min(0.25 * pot, remaining_LSA)`.

### 4.2 Income tax on withdrawals — 2026/27 bands

**England, Wales, Northern Ireland** (thresholds frozen to 2031):

| Band | Range | Rate |
|---|---|---|
| Personal Allowance | £0 – £12,570 | 0% |
| Basic rate | £12,571 – £50,270 | 20% |
| Higher rate | £50,271 – £125,140 | 40% |
| Additional rate | above £125,140 | 45% |

Personal Allowance taper: reduced £1 for every £2 of income above £100,000, reaching £0 at £125,140.

**Scotland** (different bands — must be a separate table, same band-walk code): starter 19%
(£12,571–£15,397), basic 20%, intermediate 21%, higher 42%, advanced 45%, top 48% (exact thresholds
change annually — parameterise, don't hardcode into logic).

### 4.3 State Pension interaction

- New full State Pension 2026/27: **£241.30/week = £12,547.60/year** (needs 35 qualifying NI years).
  Basic State Pension (pre-2016 retirees): £184.90/week = £9,614.80/year.
- State Pension **is taxable income** but paid gross (no tax deducted at source) — in practice it
  uses up Personal Allowance first (via tax code adjustments on other income), so model:
  `PA_remaining_for_drawdown = max(0, PA - statePension)`, then tax the drawdown income through the
  remaining bands.
- **No National Insurance** is charged on State Pension or any private pension income, at any age.

### 4.4 Net income algorithm

```typescript
interface TaxBand {
  upTo: number | null; // null = no upper limit
  rate: number;        // e.g. 0.20
}

function personalAllowanceWithTaper(totalGross: number, basePA = 12570): number {
  if (totalGross <= 100000) return basePA;
  const taper = Math.min(basePA, (totalGross - 100000) / 2);
  return Math.max(0, basePA - taper);
}

function grossToNet(
  drawdownGross: number,
  statePensionGross: number,
  bands: TaxBand[] // ordered ascending by upTo; starts at the basic-rate boundary (£12,571 in E&W)
): { net: number; taxPaid: number } {
  const totalGross = drawdownGross + statePensionGross;
  const allowance = personalAllowanceWithTaper(totalGross);
  let taxable = Math.max(0, totalGross - allowance);
  let tax = 0;
  let bandFloor = allowance; // first band starts where the allowance ends
  for (const band of bands) {
    const bandTop = band.upTo ?? Infinity;
    const bandWidth = Math.max(0, bandTop - bandFloor);
    const taxableInBand = Math.min(taxable, bandWidth);
    tax += taxableInBand * band.rate;
    taxable -= taxableInBand;
    bandFloor = bandTop;
    if (taxable <= 0) break;
  }
  return { net: totalGross - tax, taxPaid: tax };
}
```

PCLS is tax-free and applied *before* this function runs (it isn't "income" for this purpose) — only
the taxable drawdown portion + State Pension + other taxable income feed `grossToNet`.

## 5. Inverse calculation — "how much do I need to pay in?"

**Inputs**: target income (state whether gross or net), target retirement age R, current age A,
existing pot P0, assumptions (growth r, inflation i, charges c, contribution escalation g, tax
bands, State Pension amount/age).

**Step 1 — required pot at retirement (P_R):**
- If decumulation method = amortisation-to-zero: **closed form**, invert §3.2's formula directly:
    `P_R = target_income * (1 - (1+r)^-n) * (1+r) / r`
- If decumulation method = SWR: `P_R = target_gross_income_equivalent / SWR` — simple division, but
  only closed-form if the target was already expressed as *gross* pension income. If the user's
  target is *net* (take-home) income, see Step 1b.

**Step 1b — gross-up net target (needs a numeric solver):** because UK income tax is a nonlinear
band function (plus the PA taper, plus State Pension eating into the allowance), there's no clean
algebraic inverse of `grossToNet`. Use **bisection**:

```typescript
function solveGrossForNet(
  targetNet: number,
  statePension: number,
  bands: TaxBand[]
): number {
  let lo = 0, hi = targetNet * 2; // net <= gross always, so gross is bounded above by 2x net
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const { net } = grossToNet(mid, statePension, bands); // mid = drawdown gross
    if (net < targetNet) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2; // drawdown gross required; add statePension for total gross income
}
```

`grossToNet` is monotonic increasing in gross income, so bisection converges reliably; 40 iterations
is far more than needed for penny-level accuracy (converges to well under a penny inside 25
iterations for a realistic bracket). Newton's method would converge faster but needs a derivative
(the marginal rate at that income, which is just the current band's rate — trivial to compute), so
Newton is a reasonable upgrade if performance ever matters; bisection is simpler and robust enough
for a UI that runs this once per user interaction.

**Step 2 — required monthly contribution (closed form once P_R is known):**

```typescript
function requiredMonthlyContribution(
  shortfall: number,      // P_R - FV(existingPot to retirement)
  monthlyRate: number,    // (1+r_annual)^(1/12) - 1, net of charges
  monthlyContributionGrowth: number, // usually escalate annually not monthly — see §1.2
  totalMonths: number
): number {
  const unitFVFactor =
    Math.abs(monthlyRate - monthlyContributionGrowth) < 1e-9
      ? totalMonths * Math.pow(1 + monthlyRate, totalMonths)
      : ((Math.pow(1 + monthlyRate, totalMonths) - Math.pow(1 + monthlyContributionGrowth, totalMonths)) /
          (monthlyRate - monthlyContributionGrowth)) * (1 + monthlyRate);
  return shortfall / unitFVFactor;
}
```

This step is pure algebra (§1.1 rearranged) — no solver needed, **provided** the contribution
escalation rate and growth rate are fixed inputs. A solver would only be needed here too if, e.g.,
higher-rate tax relief on the contribution itself depended on income in a circular way (contribution
size affects taxable income affects relief rate affects required contribution) — out of scope for a
first version; flag as a known simplification (assume relief rate is fixed at the user's stated
marginal rate, not recalculated iteratively).

**Pseudocode for the end-to-end solve:**

```typescript
function requiredMonthlyContributionForTarget(input: {
  targetNetIncome: number;
  isNet: boolean;
  statePensionAtRetirement: number;
  decumulationMethod: 'swr' | 'amortise';
  swr?: number;
  drawdownYears?: number;
  realDrawdownRate?: number;
  currentPot: number;
  monthsToRetirement: number;
  annualGrowthRate: number; // net of charges
  annualContributionGrowth: number;
  taxBands: TaxBand[];
}): number {
  const targetGrossDrawdown = input.isNet
    ? solveGrossForNet(input.targetNetIncome, input.statePensionAtRetirement, input.taxBands)
    : input.targetNetIncome; // already gross

  const requiredPot =
    input.decumulationMethod === 'swr'
      ? targetGrossDrawdown / input.swr!
      : (targetGrossDrawdown * (1 - Math.pow(1 + input.realDrawdownRate!, -input.drawdownYears!)) *
          (1 + input.realDrawdownRate!)) / input.realDrawdownRate!;

  const monthlyRate = Math.pow(1 + input.annualGrowthRate, 1 / 12) - 1;
  const fvExistingPot = input.currentPot * Math.pow(1 + monthlyRate, input.monthsToRetirement);
  const shortfall = requiredPot - fvExistingPot;

  if (shortfall <= 0) return 0; // already on track

  return requiredMonthlyContribution(
    shortfall,
    monthlyRate,
    input.annualContributionGrowth / 12, // approximate monthly-equivalent for the formula's g term
    input.monthsToRetirement
  );
}
```

## 6. Other assets

- **House sale / downsizing**: don't model house-price growth (too speculative for this tool) —
  take the *net proceeds* as a direct user input in today's money (`saleProceeds − sellingCosts(~2–3%)
  − newHomeCost − movingCosts`), treat as a single lump-sum cash injection at a stated age, consistent
  with the real/nominal toggle (it's already "today's money" if the user enters it that way). If
  they'll rent post-sale, model ongoing rent as a retirement expense line instead of/alongside the
  lump sum, not as a growth-modelled asset.
- **Cash ISA**: model as a separate balance, growing at a low cash-savings rate (~2–3% nominal,
  roughly inflation-matching), **completely tax-free on growth and withdrawal** — no `grossToNet`
  step applies. Useful as a bridge income source before pension-access age (55/57) since it has no
  age restriction.
- **Business cash / company sale**: don't try to compound-grow this — it's a lump sum whose size and
  timing are genuinely uncertain. Take it as a scenario input (best/likely/worst case amount at an
  estimated age, or an on/off toggle) rather than folding it into the deterministic core projection;
  optionally include as an extra Monte Carlo draw (e.g. log-normal amount, uncertain timing) if the
  product wants to show its effect on outcome ranges.
- **State Pension**: model as a real (inflation-linked) income stream starting at State Pension age
  (currently 66, rising to 67 by 2028) and continuing for life — for modelling purposes, treat it as
  flat in *real* terms (i.e. grows with CPI in nominal terms), which approximates the triple lock's
  intent without needing to model the "highest of earnings/CPI/2.5%" mechanic explicitly (that
  mechanic tends to modestly outpace CPI over time, so this is a conservative simplification, not an
  optimistic one).

## 7. Uncertainty: deterministic vs Monte Carlo

- **Default**: deterministic 3-scenario (Low/Mid/High, §2) for both accumulation and decumulation —
  fast, explainable, comparable to regulated illustrations.
- **Optional layer, decumulation only**: Monte Carlo to show sequence-of-returns risk properly.
  - Return model: lognormal annual returns, `mean = mid nominal assumption`, `volatility (annualised
    SD) = 15%` for a global-equity-heavy portfolio, `10%` for a 60/40-style blend (historical 60/40
    SD has run ~8–9.5% over various US-data windows; round up slightly for UK/global uncertainty and
    to avoid overstating safety).
  - Draws: independent per year (simple lognormal) is the pragmatic default; a historical bootstrap
    (resampling real historical annual return sequences, including their autocorrelation) is a
    defensible upgrade if the team wants more realism, at the cost of needing a maintained return
    dataset.
  - **1,000–5,000 runs** is plenty for stable percentiles at this scale (diminishing returns above
    ~2,000 for a single-user-facing tool; 5,000 if compute is cheap and you want smoother tail
    percentiles).
  - Present as a **fan chart** (10th/25th/50th/75th/90th percentile of pot value or sustainable
    income by year) plus a single headline **"probability of not running out of money by age
    [planning age]"** — this mirrors Morningstar's own 90%-success-threshold framing, which is
    already the most recognisable convention in this space.

```typescript
function monteCarloDrawdown(
  pot: number,
  annualWithdrawal: number, // real terms, held flat, since returns are simulated in real terms here
  meanReturn: number,
  volatility: number,
  years: number,
  runs: number
): { survivalRate: number; percentiles: Record<number, number[]> } {
  const outcomes: number[][] = [];
  let survived = 0;
  for (let i = 0; i < runs; i++) {
    let balance = pot;
    const path: number[] = [balance];
    for (let y = 0; y < years; y++) {
      const z = randomNormal(); // standard normal draw
      const annualReturn = Math.exp(meanReturn - 0.5 * volatility ** 2 + volatility * z) - 1;
      balance = Math.max(0, (balance - annualWithdrawal) * (1 + annualReturn));
      path.push(balance);
    }
    if (path[path.length - 1] > 0) survived++;
    outcomes.push(path);
  }
  return { survivalRate: survived / runs, percentiles: computePercentiles(outcomes, [10, 25, 50, 75, 90]) };
}
```

## 8. Validation test cases (for developer unit tests)

Present these as **worked methodology**, not hand-derived long-decimal fixtures — generate exact
expected values by running the actual formula/code (or a spreadsheet), then cross-check at least one
scenario against MoneyHelper's pension calculator before hardcoding as a test fixture. Hand
arithmetic on compounding formulas is error-prone at the decimal-place level; the *formula and
inputs* below are the load-bearing part.

1. **Pure lump-sum compounding** (sanity check on §1.1's first term):
   P0 = £100,000, r = 5% nominal, n = 10 years, no contributions.
   `FV = 100,000 × 1.05^10 = £162,889.46`. Exact — safe to hardcode.

2. **Level monthly contributions, no escalation, no existing pot** (sanity check on the
   annuity-due formula with g=0):
   C = £500/month, r_annual = 5% → r_month = 1.05^(1/12) − 1 ≈ 0.4074%, n = 240 months.
   `FV = C × [(1+r)^n − 1]/r × (1+r)`. Compute in code; expect a figure in the region of £204,000 —
   treat this as an order-of-magnitude check only, get the exact figure from the implementation.

3. **Charges drag**: same as test 1 but r_gross = 8%, charge = 0.5% → r_net = 1.08/1.005 − 1 ≈
   7.463%. Confirms the geometric netting formula (§1.4) rather than naive 8%−0.5%=7.5% subtraction
   — the two should differ by a few basis points, useful as a regression test that geometric netting
   is actually being used.

4. **Real vs nominal deflation**: FV nominal after 20 years at 5% growth from £50,000 = £132,665.
   At 2.5% CPI over 20 years, deflator = 1.025^20 ≈ 1.6386.
   `Real value = 132,665 / 1.6386 ≈ £80,955`. Confirms §1.6.

5. **PCLS + tax on drawdown** (validates §4.4 end-to-end): Pot = £400,000 at retirement, no State
   Pension yet in payment. Take 25% PCLS = £100,000 tax-free (under the £268,275 LSA cap — fine).
   Draw £30,000 gross from the remaining £300,000 in year 1. Tax (England/Wales 2026/27 bands):
   first £12,570 free, next £17,430 at 20% = £3,486. **Net = £30,000 − £3,486 = £26,514.** Cross-
   check this exact scenario against MoneyHelper's or a payslip calculator's "£30,000 salary" net
   figure (pension income uses the same PAYE bands as salary, modulo NI) — they should match closely
   since no NI applies to either in this comparison once you strip NI out of the salary calculator's
   result.

6. **Inverse calculation round-trip** (validates §5 end-to-end): Take the pot and contribution
   result from test 2, treat its FV as a "required pot," and feed it back into
   `requiredMonthlyContribution` — should return £500/month (± rounding) confirming the forward and
   inverse formulas are true inverses of each other. This is the cheapest, highest-value regression
   test in the whole spec: it catches algebra mistakes in either direction without needing any
   external reference number at all.

## Sources

- FCA Handbook, COBS 13 Annex 2 — https://www.handbook.fca.org.uk/handbook/COBS/13/Annex2.html
- Quilter — growth rates used in illustrations — https://www.quilter.com/investments/platform-funds/fund-research-and-information/growth-rates-used-in-illustrations/
- FCA — "Rates of return for FCA prescribed projections" (Sept 2017) — https://www.fca.org.uk/publication/research/rates-return-fca-prescribed-projections.pdf
- PLSA / Pensions UK — Retirement Living Standards press release — https://www.pensionsuk.org.uk/Press-Centre/Press-Releases/Article/Latest-Retirement-Living-Standards-show-costs-for-Minimum-retiree-needs-have-fallen-while-Moderate-and-Comfortable-Standards-see-modest-rises
- Morningstar — "What's a Safe Retirement Withdrawal Rate for 2026?" — https://www.morningstar.com/retirement/whats-safe-retirement-withdrawal-rate-2026
- Morningstar — "Here's What Your Retirement Spending Rate Should Be in 2026" — https://www.morningstar.com/retirement/heres-what-your-retirement-spending-rate-should-be-2026
- Kiplinger — Bengen 4% rule update — https://www.kiplinger.com/retirement/retirement-planning/the-4-rule-gets-a-closer-look
- Bullseye Retirement Planning — Bengen's new rate — https://www.bullseyeretirement.com/articles/bengen-new-5-percent-rule
- Vanguard — "Sustainable spending rates in turbulent markets" (UK, March 2021) — https://www.vanguard.co.uk/content/dam/intl/europe/documents/en/whitepapers/sustainable-spending-rates-in-turbulent-markets-uk-en-pro.pdf
- FinalytiQ — "Withdrawal Rates in Retirement Portfolios: Is the 4% Rule 'Safe' for UK Clients?" — https://finalytiq.co.uk/withdrawal-rates-in-retirement-portfolios-is-the-4-rule-safe-for-uk-clients/
- FinalytiQ — Guyton-Klinger sustainable withdrawal rules — https://finalytiq.co.uk/guyton-klinger-sustainable-withdrawal-rules/
- Monevator — "What is the UK safe withdrawal rate?" — https://monevator.com/safe-withdrawal-rate-uk/
- ONS — Period and cohort life expectancy explained — https://www.ons.gov.uk/peoplepopulationandcommunity/birthsdeathsandmarriages/lifeexpectancies/methodologies/periodandcohortlifeexpectancyexplained
- GOV.UK — New State Pension: what you'll get — https://www.gov.uk/new-state-pension/what-youll-get
- MoneySavingExpert — Tax rates 2026/27 — https://www.moneysavingexpert.com/banking/tax-rates/
- PlainPension — Tax-free lump sum rules 2026/27 — https://plainpension.co.uk/guides/tax-free-lump-sum-rules/
- PensionHelper — Lump Sum Allowance guide — https://pension-helper.co.uk/guides/pension-advice/lump-sum-allowance/
- Retirement Line — Annuity rates table (Aug 2026) — https://www.retirementline.co.uk/annuities/annuity-rates
- Which? — Best annuity rates UK July 2026 — https://www.which.co.uk/money/pensions-and-retirement/accessing-your-pensions/annuities/annuity-rates-aQGfH6W5n2rm
- Pension Bible — Pension Fees Explained 2026/27 — https://www.pensionbible.co.uk/guides/pension-fees
- LITRG — How tax relief is given on pension contributions — https://www.litrg.org.uk/pensions/paying-pensions/tax-relief-pension-contributions/how-tax-relief-given-pension-contributions
- PortfoliosLab — Stocks/Bonds 60/40 Portfolio historical volatility — https://portfolioslab.com/portfolio/stocks-bonds-60-40
