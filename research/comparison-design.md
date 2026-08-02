# Comparison Layer Design — "What's the best thing to do with my money?"

**Compiled: 2 August 2026 (2026/27 tax year). All charges/rates verified this session via web search; every table below must carry a "correct as of" date in the UI and be re-verified before ship — charges change.**

Regulatory frame (per `uk-pension-rules.md` §9): everything here is a **factual comparison** — what things cost, what the arithmetic produces. The app never says "choose this one" or "best for you". Substance, not disclaimers, keeps us on the guidance side of FCA PERG 8.30B. All personalised-looking outputs are "the maths on the numbers you entered", identical for anyone entering the same numbers.

---

## 1. "WHERE COULD MY NEXT £100 GO?" — the central comparison

**Gating input (required before rendering): IR35 status.** Outside IR35 → company-profit version (below). Inside IR35 via own Ltd → no pre-tax company profit exists; drop row 1, re-rank with personal SIPP on top. Inside via umbrella → salary-sacrifice replaces row 1. See `contractor-tax.md` §1.3.

**Scenario shown: £100 of pre-Corporation-Tax company profit, outside IR35, 19% CT (profits ≤£50k), basic-rate dividend taxpayer (10.75%).** Toggle for higher-rate (35.75%) — the dividend-route figures drop from £72.29 to £52.04 and the pension gap widens dramatically.

Derivation chain (compute live, never hardcode):
- Dividend in hand = 100 × (1 − CT_RATE) × (1 − DIV_TAX_RATE) = 100 × 0.81 × 0.8925 = **£72.29** (higher rate: 100 × 0.81 × 0.6425 = **£52.04**)
- Personal pension via relief at source = dividend_in_hand × 1.25
- "Spendable at retirement" for pension routes = pot × (0.25 + 0.75 × (1 − retirement_tax_rate)); at basic rate = pot × 0.85; within personal allowance = pot × 1.00

| Route | Working for you on day 1 | Spendable later (basic-rate in retirement) | What this means in plain English |
|---|---|---|---|
| **Employer pension contribution** (company pays direct) | **£100.00** | **£85.00** (up to £100 if within personal allowance) | The whole £100 goes in — no Corporation Tax, no NI, no dividend tax on the way in. Locked until age 57. |
| **Personal pension** (dividend first, then contribute) | £90.36 (£72.29 × 1.25 relief) | £76.81 | HMRC adds 25% back, but the Corporation Tax and dividend tax already taken don't come back. Locked until 57. |
| **Mortgage overpayment** (4.5% rate) | £72.29 off the mortgage | £72.29 + guaranteed 4.5%/yr saved interest, tax-free (£72.29 → ~£146 of debt avoided by 67) | A guaranteed, tax-free return equal to your mortgage rate. Hard to get back out once paid in. Check your deal's overpayment limit (commonly 10%/yr) and any early repayment charge. |
| **Stocks & shares ISA** | £72.29 invested | £72.29 + growth, all tax-free, accessible any time | No tax relief going in, no tax coming out, no lock-up. Value can fall as well as rise. |
| **Cash ISA** (~4.66% best easy-access, 31 Jul 2026) | £72.29 | £72.29 + interest, tax-free, accessible any time | Safe and reachable, but historically grows slower than investments over 16 years. |
| **Dividend, spend/hold as cash** | £72.29 | £72.29 (eroding with inflation) | The baseline everything else is compared against. |

Plain-English footnote (exact copy): *"The pension rows put the most money to work, because company pension contributions skip several taxes the other routes pay. The catch is the lock: nothing comes out before age 57. The ISA and mortgage rows are smaller but stay reachable. This table shows the arithmetic — which trade-off suits you is your call, and only a regulated adviser can recommend one."*

**IR35 flip (must render when status = inside, own Ltd):** the £100 has already been taxed as salary before it reaches you; the employer-contribution row disappears (fee-payer-operated pension deduction is possible but rare and at the fee-payer's discretion — flagged as an accountant question, per contractor-tax.md §1.3). Personal SIPP (relief at source) becomes the top pension route. Via umbrella: salary sacrifice ≈ restores the employer-route economics.

### 1.1 The live rule set — the table above is one render of this, never a static asset

Every destination is a function of her state. The UI sorts by `horizonValue` descending, except where a pin rule fires. Each row renders its own `reason(s)` string so the ordering is always visibly arithmetic.

```typescript
export type State = {
  ir35: "outside" | "insideOwnLtd" | "insideUmbrella";
  ctRate: number;             // 0.19 ≤£50k profits; marginal ~0.265 £50–250k; 0.25 above
  divTaxRate: number;         // 0.1075 basic | 0.3575 higher (2026/27)
  payeMarginal: number;       // inside-IR35 deemed-salary marginal rate incl. NI
  mortgageRate: number;       // her deal; default 0.045
  cashRate: number;           // best easy-access cash ISA; 0.0466 at 2026-07-31, editable chip
  growthGross: number;        // default 0.05, editable chip, labelled "assumption"
  totalFee: number;           // platform + OCF, from §2 data
  retirementTaxRate: number;  // 0 | 0.20 | 0.40 — expected marginal rate when drawing
  yearsToRetire: number;      // horizon n
  yearsTo57: number;
  emergencyMonths: number;    // months of essential spending in accessible cash
  bridgeShortfall: number;    // £ needed to live from plannedStopAge to 57, minus liquid savings
};

const r = (s: State) => s.growthGross - s.totalFee;
const divInHand = (s: State) => 100 * (1 - s.ctRate) * (1 - s.divTaxRate);      // outside IR35
const netPay    = (s: State) => 100 * (1 - s.payeMarginal);                     // inside IR35
const exitMult  = (s: State) => 0.25 + 0.75 * (1 - s.retirementTaxRate);        // 25% tax-free + taxed 75%

export const DESTINATIONS = [
  { id: "employerPension",
    available: (s: State) => s.ir35 === "outside" || s.ir35 === "insideUmbrella", // umbrella = salary sacrifice, minus any umbrella margin
    day1: (s: State) => 100,
    horizonValue: (s: State) => 100 * (1 + r(s)) ** s.yearsToRetire * exitMult(s),
    reason: (s: State) => `The whole £100 goes in — no Corporation Tax, NI or dividend tax. Locked until 57 (${s.yearsTo57} more years for you).` },
  { id: "personalPension",
    available: () => true,
    day1: (s: State) => take(s) * 1.25,   // take() = divInHand or netPay per ir35
    horizonValue: (s: State) => take(s) * 1.25 * (1 + r(s)) ** s.yearsToRetire * exitMult(s),
    reason: (s: State) => s.retirementTaxRate > 0.2
      ? "HMRC adds 25% now, but at your expected retirement tax rate most of that comes back out again."
      : "HMRC adds 25% back; the tax already paid getting the money out of the company doesn't return." },
  { id: "mortgageOverpay",
    available: (s: State) => true, // render overpayment-limit/ERC caveat always
    day1: (s: State) => take(s),
    horizonValue: (s: State) => take(s) * (1 + s.mortgageRate) ** Math.min(s.yearsToRetire, remainingTermYears),
    reason: (s: State) => `A guaranteed, tax-free ${(s.mortgageRate*100).toFixed(1)}% — ${s.mortgageRate > r(s) ? "higher than" : "lower than"} the growth assumed for investments, and it can't be undone.` },
  { id: "stocksISA",
    available: () => true,
    day1: (s: State) => take(s),
    horizonValue: (s: State) => take(s) * (1 + r(s)) ** s.yearsToRetire,
    reason: () => "No relief in, no tax out, reachable any time — the only pot that can fund years before 57." },
  { id: "cashISA",
    available: () => true,
    day1: (s: State) => take(s),
    horizonValue: (s: State) => take(s) * (1 + s.cashRate) ** s.yearsToRetire,   // caveat: today's rate won't hold for 16 years
    reason: () => "Safe, tax-free, reachable — but the rate shown is today's and will change." },
  { id: "cashBaseline", available: () => true, day1: (s: State) => take(s),
    horizonValue: (s: State) => take(s), reason: () => "The do-nothing baseline the rest are measured against." },
];

// PIN RULES — override the sort, each with a factual justification rendered inline:
// 1. emergencyMonths < 3  → pin an "accessible cash buffer" row to #1.
//    Copy: "Guidance services (MoneyHelper) list 3–6 months of essential costs in reachable cash
//    before money is locked away or invested — nearer 6 for variable self-employed income."
// 2. bridgeShortfall > 0  → ISA rows rank above pension rows regardless of horizonValue.
//    Copy: "You've said you may stop before 57. A pension cannot fund those years; only this pot can."
```

**Which inputs flip which ordering (exhaustive):**

| Input change | What flips | Why (the inequality) |
|---|---|---|
| `ir35` → insideOwnLtd | Employer row disappears; personal SIPP becomes top pension route | No pre-tax profit exists after PAYE on the deemed payment |
| `mortgageRate > growthGross − totalFee` | Mortgage above S&S ISA | Pure rate comparison, guaranteed vs assumed |
| `mortgageRate ≳ 5.4%` (at 4.7% net growth, n=16, basic rate) | Mortgage above **personal** pension | `(1+m)^n > 1.25 × exitMult × (1+r)^n` |
| `mortgageRate ≳ 5.8%` (same defaults) | Mortgage above **employer** pension | `(1+m)^n > (100/divInHand) × exitMult × (1+r)^n` |
| `retirementTaxRate` 20% → 40% | S&S ISA above personal pension | Pension multiplier 1.25 × 0.70 = 0.875 < 1.0 |
| `divTaxRate` basic → higher | Doesn't reorder vs pension; widens every gap (dividend routes drop £72.29 → £52.04) | Same inequalities, smaller `divInHand` |
| `emergencyMonths < 3` | Cash buffer pinned first | Pin rule 1 |
| `bridgeShortfall > 0` (stopping before 57) | ISAs above pensions | Pin rule 2 |

**Three states, three orderings (per £100 pre-CT profit, horizon values at n=16, growth 5%, fees 0.3%):**

- **State A — her today** (outside IR35, basic-rate dividends, mortgage 4.5%, emergency fund in place): employer pension **£177** > personal pension **£160** > S&S ISA **£151** ≈ cash ISA £150 (today's 4.66% held constant — flagged unrealistic) ≈ mortgage £146 > cash £72. *Honest render: the middle of the table is within £5 — say so.*
- **State B — inside IR35 via own Ltd, one month's emergency cash**: 1. accessible cash buffer (pinned, with the MoneyHelper sequencing line) > 2. personal SIPP (now the only pension route, on net pay × 1.25) > 3. mortgage > 4. S&S ISA > 5. cash. Employer row absent with the reason rendered, not silently dropped.
- **State C — outside IR35, higher-rate dividends, lapsed onto a 6.9% SVR**: employer pension **£177** (unchanged — the profit never leaves the company) > **mortgage £151** > personal pension **£115** > S&S ISA **£109**. The mortgage has jumped two places purely because 6.9% guaranteed beats 4.7% assumed by enough to overcome the pension's 6.25% tax edge on the dividend-first routes.

---

## 2. PENSION PROVIDER AND FUND COMPARISON (verified 2 Aug 2026)

Platform fee and fund cost shown **separately** — they are different things and the UI must say so ("the platform is the account; the fund is what your money is invested in; you pay both").

```typescript
// charges verified 2026-08-02 — re-verify before ship; render "correct as of" date
export const PLATFORMS = [
  { name: "Vanguard (SIPP)", platformFee: { type: "percent", rate: 0.0015, capPerYear: 375, minPerYear: 48, minAppliesBelow: 32000 }, typicalFundOCF: 0.0023, fundExample: "FTSE Global All Cap 0.23%", notes: "Vanguard funds only; £4/mo min below £32,000", source: "vanguardinvestor.co.uk/what-we-offer/fees-explained" },
  { name: "AJ Bell (SIPP)", platformFee: { type: "percent", rate: 0.0025 }, typicalFundOCF: 0.0012, fundExample: "HSBC FTSE All-World 0.12%", notes: "0.25% on funds (uncapped); regular investing free from May 2026", source: "ajbell.co.uk SIPP charges" },
  { name: "Hargreaves Lansdown (SIPP)", platformFee: { type: "percent", rate: 0.0035 }, typicalFundOCF: 0.0012, notes: "cut from 0.45% on 1 Mar 2026; £1.95 fund dealing fee introduced", source: "trustnet.com / moneytothemasses.com Jan 2026" },
  { name: "interactive investor (Core plan)", platformFee: { type: "flat", perYear: 71.88 }, typicalFundOCF: 0.0012, notes: "£5.99/mo covers ISA+SIPP+trading, portfolios ≤£100k (plan structure changed 1 Feb 2026)", source: "ii.co.uk new price plans" },
  { name: "Fidelity (SIPP)", platformFee: { type: "percent", rate: 0.0035, flatBelow25k: 90 }, typicalFundOCF: 0.0013, notes: "£7.50/mo flat under £25k without regular savings plan", source: "fidelity.co.uk/services/charges-fees" },
  { name: "The People's Pension (existing pot)", platformFee: { type: "amc", rate: 0.005, rebateRange: [0.001, 0.003], flatPerYear: 6.50 }, typicalFundOCF: 0, notes: "all-in AMC; rebate band depends on pot size — app must pull her exact band; £6.50 from Apr 2026", source: "thepeoplespension.co.uk cost and charges" },
  { name: "Aviva workplace (existing pot)", platformFee: { type: "amc", rateRange: [0.0028, 0.0075] }, typicalFundOCF: 0, notes: "scheme-specific — capped at 0.75%; her actual charge must come from her statement/policy lookup", source: "drewberryinsurance.co.uk Aviva review 2026" },
] as const;
```

**What a £30,000 pot costs per year (platform + example cheap global tracker):**

| Provider | Platform £/yr | Fund £/yr | Total £/yr |
|---|---|---|---|
| interactive investor Core | £71.88 (flat) | £36 | **£108** |
| AJ Bell | £75 | £36 | **£111** |
| Vanguard | £48 flat min (pot < £32k) | £69 | **£117** |
| Hargreaves Lansdown | £105 | £36 | **£141** |
| Fidelity | £105 | £39 | **£144** |
| People's Pension | ~£96–£141 all-in (0.5% − rebate + £6.50) | included | **~£96–£141** |
| Aviva workplace | ~£84–£225 all-in (0.28%–0.75%, scheme-specific) | included | **unknown until she checks** |

**Crossover fact (render as a sentence, computed live):** a flat fee beats a percentage fee once `pot > flatFee / percentRate`. ii Core (£71.88) vs AJ Bell (0.25%) crosses at **£28,752** — her pot is almost exactly on the line, so for her the differences are tens of pounds a year, not hundreds. The comparison matters more as the pot grows.

**Before moving anything — checklist (from uk-pension-rules.md §6, render as pre-transfer interstitial):** guaranteed annuity rates on the old Aviva policy; any protected pension age or guarantees; exit fees; whether a current scheme still receives employer contributions; DB safeguarded benefits >£30k require regulated advice by law. Plus: transfers are done as cash — days/weeks out of the market.

---

## 3. THE FEE DRAG CALCULATION — the most persuasive number

Formula (compute live; expose the assumptions inline):

```typescript
// FV of existing pot P over n years at gross growth g with total annual charge f
const fv = (P: number, g: number, f: number, n: number) => P * Math.pow(1 + g - f, n);
// with annual contributions C (paid yearly in arrears):
const fvWithContribs = (P: number, C: number, g: number, f: number, n: number) => {
  const r = g - f;
  return P * Math.pow(1 + r, n) + C * (Math.pow(1 + r, n) - 1) / r;
};
export const FEE_DRAG_DEFAULTS = { pot: 30000, growthGross: 0.05, cheapTotalFee: 0.003, expensiveTotalFee: 0.010, yearsTo67: 16 };
```

Her numbers: £30,000, 16 years to 67, 5% gross growth (SMPI-style mid assumption, labelled as such):
- At **0.3% total charges**: 30,000 × 1.047^16 = **£62,556**
- At **1.0% total charges**: 30,000 × 1.04^16 = **£56,189**
- **Difference: £6,366 — about a fifth of her entire starting pot, for the identical investment.**

Headline copy: *"On a £30,000 pot, the difference between paying 0.3% and 1% a year in charges is about £6,400 by age 67 — money that goes in fees rather than to you. Same investments, same growth: the only difference is the charge."* With ongoing contributions the gap grows further — recompute with `fvWithContribs` when she enters a contribution amount. Show the two assumptions (growth %, years) as editable chips so it's visibly arithmetic, not prophecy.

---

## 4. ISA COMPARISON (16-year horizon)

| | Cash ISA | Stocks & shares ISA |
|---|---|---|
| Best rates (31 Jul 2026, moneyfactscompare/MSE) | 4.66% easy access (Sidekick); 4.70% 1-yr fix; 4.81% 5-yr fix | n/a — returns not guaranteed |
| Historic comparison | Cash has barely beaten inflation long-run | Global equities ~8–9%/yr nominal over 30 yrs (MSCI World GBP); can fall sharply in any year |
| Access | Anytime (easy access) | Anytime, but selling in a dip locks in losses |
| Tax | Interest tax-free | Growth and withdrawals tax-free |
| Allowance | shared £20,000/yr (2026/27) | shared £20,000/yr |

**The bridge-to-57 fact (unique to her situation, render prominently):** she cannot touch any pension until 57. If she wants to wind down before then, ISA/cash is the *only* pot that can fund the gap. So the comparison is not just "pension beats ISA on tax" — it's "pension wins on tax, ISA wins on when you can have it". **Lifetime ISA: not available — must be opened before age 40; she is 51.** State this as a fact, not a loss.

---

## 5. ANNUITY VERSUS DRAWDOWN (at 67)

Indicative single-life rates per £100,000, interpolated from Which? best-rate tables (correct at 27 Jul 2026: age 65 £7,946, age 70 £8,791 — label **indicative, not quotes**; rates move with gilt yields):

```typescript
export const ANNUITY_INDICATIVE = { asOf: "2026-07-27", source: "which.co.uk annuity rates",
  age67: { levelPer100k: 8280, inflationLinkedPer100kApprox: 5100 }, // RPI-linked starts ~35–40% lower
  unisex: true }; // annuity rates have been identical for women and men since Dec 2012 (EU Gender Directive)
```

| | Annuity (level) | Annuity (inflation-linked) | Drawdown |
|---|---|---|---|
| £100k buys (67, indicative) | ~£8,280/yr for life | ~£5,100/yr rising with inflation | whatever you draw; pot stays invested |
| Certainty | Total — never runs out, never grows | Total + keeps pace with prices | None guaranteed; pot can run out |
| Flexibility / inheritance | None once bought | None once bought | Full; remainder passes on |
| Inflation over 20+ yrs | Halves the real value of a level income at ~3.5% inflation | Protected | Depends on investment growth |

For someone who has said she wants certainty: the factual statement is *"an annuity converts a pot into a guaranteed income; drawdown keeps the pot flexible but transfers the risk of it running out to you. Many people at 67 use some of the pot for each."* Signpost Pension Wise (free, 50+) at this exact point in the UI.

---

## 6. STRATEGY COMPARISONS — "what would maximise what I want?"

These compare **her possible courses of action**, not products, so the copy can be direct: "X produces £Y more than Z" is arithmetic about her numbers, not a recommendation of a regulated product. Every figure computes live from her state (the store's `workingArrangement`, `downsizeIntent`, `lumpSumIntent` inputs gate which of these render). Worked examples below use: pot £30k, age 51, employer contributions £6,000/yr, **real terms** (2.5% real growth net of fees ≈ 5% nominal − 2.5% inflation, labelled), State Pension £12,548/yr (2026/27 full rate) from 67, level drawdown to age 95 via annuity-factor maths:

```typescript
const af = (rate: number, years: number) => (1 - (1 + rate) ** -years) / rate; // annuity factor
const potAt = (age: number, s: {pot: number; annualContrib: number; realGrowth: number; ageNow: number}) => {
  const n = age - s.ageNow, g = s.realGrowth;
  return s.pot * (1 + g) ** n + s.annualContrib * ((1 + g) ** n - 1) / g;
};
const sustainableIncome = (pot: number, fromAge: number, toAge = 95, realRate = 0.025) =>
  pot / af(realRate, toAge - fromAge);
```

**6.1 Paying in personally vs via the company.** To land £100 in her pension: via the company, £100 of pre-CT profit. Personally: she needs £80 net (relief adds £20), which needs £80 of dividend, which needs 80 ÷ (0.8925 × 0.81) = **£110.66** of profit at basic rate — or **£153.70** at higher rate (before the partial claw-back of extending her basic-rate band, which the app should note but not compute silently). **The company route funds the same pension for less company profit at every dividend band.** Check first: IR35 status (gate), and that her accountant confirms the contribution passes "wholly and exclusively" (contractor-tax.md §4.2).

**6.2 Retiring at 62 vs 67 vs 70.** Contributions continue to the stop age, drawdown level to 95:
| Stop age | Pot (real) | Income before SP | Income from 67 |
|---|---|---|---|
| 62 | £114,300 | **£5,100/yr for 5 years** | £17,700/yr |
| 67 | £160,800 | — | **£20,600/yr** |
| 70 | £191,600 | (works to 70) | £22,950/yr from 70 |

Direct copy: *"On your numbers, retiring at 67 rather than 62 gives you about £245 a month more for the rest of your life — and removes the five-year stretch where you'd be living on roughly £5,100 a year before the State Pension starts."* 70 vs 67: +£196/mo. Check first: deferring the State Pension adds ~5.8% per year deferred (gov.uk) — compute if stop age > 67.

**6.3 Stopping dead at 62 vs part-time for three years.** Part-time 62–65 (half contributions £3k/yr, drawing nothing): pot £132,300 at 65 → **£6,320/yr for life vs £5,126/yr — about 23% more, permanently** — and the unfunded gap before the State Pension shrinks from five years to two. This is consistently the highest-leverage "soft" option and the one most aligned with what she's said she wants (tapering, per store `taperingStyle`). Check first: whether the contract can actually flex; whether reduced hours change her IR35 position.

**6.4 Downsizing vs staying and drawing less.** `freedCapital = salePrice − newHome − mortgageBalance − costs(SDLT + agent + removals ≈ £11k on these numbers)`. £400k → £250k home: frees **~£19k**, not the £150k the price gap suggests — **the £120k mortgage comes off the top**. That £19k buys ~£950/yr more sustainable income from 67. Staying put and clearing the mortgage by 67 removes the monthly payment either way. Direct copy: *"Downsizing frees less than it looks like it should, because the mortgage is repaid from the sale first."* Check first: actual mortgage balance at the planned date, early-repayment charges, SDLT on the new purchase, and that she'd actually want the smaller home — the maths is the smallest part of this one.

**6.5 Taking the 25% tax-free cash at 67 vs leaving it invested.** At 67 (pot £160,800) the tax-free entitlement is **£40,200**. Left invested, in real terms that quarter-share is worth ~**£51,500** at 77 (2.5% real) and still comes out tax-free later. Taken at 67 and parked in savings, it grows slower and (outside an ISA) taxed. Direct copy: *"Taking it early only costs you if you don't have a use for it — moved into a bank account it grows more slowly; left in the pension it keeps growing tax-free."* Facts to render: taking only tax-free cash does **not** trigger the £10k MPAA; taking taxable income does.

**6.6 Consolidating the two pensions vs leaving them — charge arithmetic only.** The deciding number is her actual Aviva charge, which is currently unknown (0.28%–0.75% range):
| Scenario | Cost today (£20k Aviva + £10k PP) | Consolidated at ~£108/yr | Verdict (arithmetic) |
|---|---|---|---|
| Aviva at 0.75% | £150 + ~£47 = **£197/yr** | £108/yr | Consolidation saves ~£89/yr now, ~£1,500–2,500 by 67 as the pot grows |
| Aviva at 0.28% | £56 + ~£47 = **£103/yr** | £108/yr | Consolidation saves **nothing** |

Direct copy: *"Whether combining your pensions saves money depends entirely on one number you don't have yet: what your Aviva plan actually charges. That's on your annual statement or one phone call."* Check first (blocking, from §2): guaranteed annuity rates, protected pension age, exit fees, days out of the market during transfer. This section states the £ difference plainly but **never names which platform to consolidate into** — it links to the §2 table.

---

## 7. HOW TO PRESENT IT

**Framing line, verbatim, top of the comparison screen:**
> **"This page compares what the different options cost and what the maths says they'd produce, using the numbers you've given. It doesn't recommend any of them — that's a decision for you, and if you want a personal recommendation, that's what a regulated financial adviser is for. Free, impartial guidance: MoneyHelper, and Pension Wise if you're over 50."**

- **Headline figure (one per screen, huge):** §1 renders "£100.00 vs £72.29 — how much of £100 of company profit ends up working for you"; §3 renders "£6,366 — what a 0.7% charge difference costs you by 67". One number, then the table beneath it as the evidence.
- **Tables** are for §1, §2, §4, §5. Max 4 columns on mobile; every row gets a one-line "what this means" in plain English at 3rd-person-neutral register ("the whole £100 goes in"), never imperative ("you should put…").
- **Progressive disclosure:** derivation chains (§1 arithmetic, §3 formula, rebate bands, crossover maths) live behind a "show me the maths" expander — present so it's checkable, hidden so it's not stressful. Sources + "correct as of" dates behind an info icon per table.
- **Order rows by the arithmetic, never badge them.** No stars, ticks, "best buy" flags, or colour-coding of providers. Sorting a table by a stated, user-visible metric (cost/year; £ working on day 1) is factual; a "winner" badge is a recommendation.
- **Editable assumptions as chips** (growth %, CT rate, dividend band, mortgage rate) — reinforces "this is arithmetic on your inputs".
- **Gates:** IR35 status before §1; "have you checked your Aviva charge?" prompt before §2 renders Aviva as "unknown"; pre-transfer checklist interstitial before any "compare platforms" deep-dive.
- **Never render:** "we recommend", "you should", "best for you", "people like you" (the last strays into the FCA's new Targeted Support regime, which needs authorisation we don't have).
- **Two registers, deliberately.** Strategy comparisons (§6) speak plainly — "retiring at 67 rather than 62 gives you about £245 a month more" is a fact about her arithmetic. Product/provider comparisons (§2) never rank-with-badges or name a destination — "move to platform X" is a personal recommendation. The line: bold about *when/how much/which strategy*, neutral about *which product*. Every §6 card ends with its "check first" list so directness never becomes "act now".

**Sources:** Vanguard fees (vanguardinvestor.co.uk); AJ Bell charges PDF + May 2026 update; HL fee cut 1 Mar 2026 (Trustnet/MTTM/Kepler); ii price plans 1 Feb 2026 (ii.co.uk); Fidelity charges page; People's Pension cost pages (Apr 2026 £6.50 change); Which? annuity tables 27 Jul 2026; MoneyfactsCompare/MSE cash ISA tables 31 Jul 2026; Monevator global tracker table (HSBC All-World 0.12%); MSCI World GBP 30-yr history; Rathbones pension-vs-mortgage analysis Mar 2026. Tax rates per `contractor-tax.md` (2026/27: CT 19%/25% + marginal; dividends 10.75%/35.75%/39.35%; AA £60k).
