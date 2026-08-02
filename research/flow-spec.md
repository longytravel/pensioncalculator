# Question Flow Spec — Guided Screens for Kirsten's Plan

Prepared 2 August 2026. Builds directly on `research/calculator-ux.md` (cited throughout as
"UX research §n") and reuses the field names in `lib/fields.ts` and the IR35 model in
`lib/engine/contractor.ts` wherever they already exist. Where a screen below needs a value that
doesn't exist yet in the data model, it's flagged **[NEW FIELD]** with a suggested name and type —
these need adding to `lib/fields.ts` (or a parallel non-slider store for text/enum answers) before
build.

This replaces the current single scrolling page (`app/plan/page.tsx`) with a wizard. The header
described in §3 is the one piece of chrome that must exist on *every* screen from Screen 2 onward —
it is what fixes the "headline number scrolls out of sight" problem.

---

## 0. Screen sequence at a glance

| # | Screen | Header state (§3) |
|---|---|---|
| 0 | Password gate | none |
| 1 | Welcome (+ her age) | hidden |
| 2a–2f | **Objectives** — 6 steps, one topic each | placeholder ("building your number…") |
| 3a–3f | **What you have** — State Pension, Aviva, People's Pension, ISA, House, Business | live, updates after each card |
| 4 | **How you pay in** — personal, company/IR35 | live |
| 5 | **Results** | live, full detail |
| 6 | **Next steps** | live, collapsed to a slim strip |

Screens 2 and 3 are each a short sub-flow (one question/card per step, Typeform-style — UX
research §4: one-question-per-screen lifts completion 15–40%), not five fields dumped on one
page. "Screen" below means a topic; each renders as its own step with Back/Continue.

---

## 1. THE OBJECTIVES SCREEN (the one that matters most)

She has never been asked what she wants. This is six short steps, in this order, each its own
screen. Total build: no more than 6 — this is the cap from the brief and also the point past which
UX research §4 shows completion drops off even in one-question format, so nothing gets added here
later without cutting something else.

Progress indicator across all six: "Your plans — step 2 of 6" (not raw field names — this is a
conversation about her life, not a form).

### 2a. Retirement age
> **When would you like to stop working?**
> *You can change this any time — try moving it and see what happens.*

- **Input:** dual slider + editable number (UX research §3 gold standard). Range 55–75.
- **Default:** her State Pension age (67) — a researched, labelled midpoint, never the low
  extreme (UX research §3 anchoring bias).
- **Field:** `retirementAge` (exists).
- **Why we ask (shown on screen):** "This is the single biggest lever in the whole plan — it
  decides how long you save for and how long your money needs to last."

### 2b. Stopping in one go, or easing down first
> **Would you like to ease down gradually, or stop in one go?**
> *Lots of people running their own business like the option to cut back before stopping
> completely.*

- **Input:** three large cards — "Stop in one go" / "Cut down gradually first" / "Not sure yet."
- **Default:** "Not sure yet" — never force a commitment on something she hasn't considered (UX
  research §7, avoid false certainty).
- If "Cut down gradually first" is chosen, reveal one follow-up on the same step (not a new
  screen): *"Roughly how many years before you fully stop would you like to start cutting back?"*
  — slider 1–10 years, default 3.
- **[NEW FIELD]** `taperingStyle: 'stop_in_one_go' | 'taper_first' | 'unsure'`,
  `taperingYearsBeforeRetirement: number` (only meaningful if `taper_first`).
- **Why we ask:** "This changes how much you're likely to be paying in — and earning — in the
  last few years, which matters more than people expect." Feeds Screen 4 (her contributions can
  step down over the tapering window rather than assuming a cliff-edge stop).

### 2c. A lump sum
> **Would you like a lump sum when you retire?**
> *Most pensions let you take part of it as tax-free cash.*

- **Input:** four cards — "Yes, for something specific" / "Yes, just to have some cash in hand" /
  "No, I'd rather have more monthly income" / "Not sure yet" (default).
- If "for something specific": reveal an optional one-line text field, *"What's it for? (just for
  us — it doesn't affect the numbers)"* — e.g. "a camper van," "helping [child] with a deposit."
  Purely for personalising later copy and the Next Steps screen; never required.
- If either "yes" option: reveal *"Roughly how much would you like to take as cash?"* — a slider
  pre-filled at 25% of her currently-projected pot (the standard tax-free amount), editable.
- **[NEW FIELD]** `lumpSumIntent: 'specific' | 'general' | 'no' | 'unsure'`,
  `lumpSumPurpose: string` (optional, free text), `lumpSumTargetAmount: number`.
- **Why we ask:** "Up to 25% of a pension can normally come out tax-free from age 55 (57 from
  2028). Knowing whether you want to use that changes how we plan the rest of your income."

### 2d. Leaving something behind
> **Is there anything you'd like to leave behind for someone else?**
> *No pressure either way — plenty of people haven't thought about this yet.*

- **Input:** three cards — "Yes, I'd like to leave something" / "No, I'd rather use it all myself"
  / "Haven't thought about it" (default).
- If "yes": reveal simple presets — £10,000 / £50,000 / £100,000 / "a different amount" (opens a
  number field). No slider needed here — this is a rough marker, not a precision input.
- Inline note, collapsed by default behind a "why does this matter?" link (UX research §5):
  *"Money left in a pension usually passes to whoever you choose without inheritance tax — one
  reason people leave pension money untouched if they can afford to spend savings first."*
- **[NEW FIELD]** `legacyIntent: 'yes' | 'no' | 'unsure'`, `legacyTargetAmount: number`.
- **Why we ask:** "This affects how carefully we suggest drawing your money down — spending it all
  on a fixed plan looks different from making sure something is left over."

### 2e. Moving somewhere smaller
> **Could you see yourself moving somewhere smaller?**
> *Just a gut feeling for now — nothing is decided here.*

- **Input:** three cards — "Yes, probably" / "No, I'll stay put" / "Maybe — I'd like to see the
  numbers either way" (default, since this is a real financial lever she shouldn't be talked out
  of before she's seen it).
- **[NEW FIELD]** `downsizeIntent: 'yes' | 'no' | 'maybe'`.
- **Why we ask:** "If you'd ever consider it, downsizing can be one of the biggest single boosts to
  a plan — we'll show you the difference it makes without asking you to decide anything now."
- **Effect downstream:** controls whether the House screen (3e) opens with its downsize fields
  expanded (yes/maybe) or collapsed with `downsizeReleaseAmount` defaulted to 0 and a one-line
  note "You said you'd rather stay put — we've left this at zero. Change it any time." (no).

### 2f. "What does 'enough' look like for you?" — the target-income screen

This is the screen given full design treatment in UX research §2 — reproduce it exactly as
specified there: four lifestyle cards (PLSA Minimum/Moderate/Comfortable presets +
"about the same as I live on now"), each showing its £/month figure up front, a "let's build your
budget together" link to an optional bottom-up tool, and a visible "Ask your assistant" prompt.

- **Input:** card selection → becomes an editable slider (`targetIncome`, exists) with copy
  confirming it's a starting point, not a commitment.
- The "about the same as now" card needs her current income inline, on the card itself, only if
  she taps it — *"Roughly what do you earn now, including regular drawings from the business?"*
  (feeds `salary`, exists) — this keeps the income question out of the main flow entirely for
  the ~75% of people who'll pick one of the other three cards.
- **Why we ask:** shown as the card headline itself; no separate explainer needed, this screen's
  whole design *is* the answer to "how would I know what I need."

---

## 2. FULL SCREEN SEQUENCE

### Screen 0 — Password gate
One field, one line: *"Your figures, just for you — nobody else can see this."* No lock icons, no
security theatre (UX research §8). Straight into Screen 1 on success.

**Header:** none — this screen has no plan to show yet.

### Screen 1 — Welcome
> **Let's find out where you stand.**
> Most people find this confusing — you don't need to know all the answers yet. We'll help you
> find them, one step at a time.

- Single field on this screen: **"Just so we can time things right — how old are you now?"**
  (`currentAge`, exists) — number input, not a slider (it's a known fact, not a what-if; UX
  research §3's rule: known value → number field).
- One button: **"Let's start."**
- One small, non-intrusive line: *"You can ask the assistant anything, any time — there's no such
  thing as a silly question here."* Plants the escape hatch before she needs it (UX research §7).

**Why we ask (age):** "We use this to work out how long your money has to grow, and to make the
sliders on the next few screens sensible for you specifically."

**Header:** hidden — nothing to show yet, and showing "£0/month" here would read as bad news for
no reason.

### Screens 2a–2f — Objectives
As specified in full in §1 above.

**Header:** a quiet placeholder strip, not the full component — *"We'll build your number here as
we go"* — present but visually calm, so she knows something is coming without a wrong or alarming
figure sitting there.

### Screens 3a–3f — Your whole picture

One card per source, most certain/simple → most speculative, to build confidence before the
harder inputs (UX research §4, "wizard → dashboard" pattern — each card recomputes the header
live the moment it's answered, so she sees her number *build up* rather than appearing all at
once at the end).

**3a. State Pension**
- Auto-estimated from `statePensionAge` + `qualifyingYears` (both exist, both default sensibly —
  67 and 35).
- One line: *"This is the government pension everyone gets, on top of anything private. We've
  assumed the full amount — check your real forecast in two minutes on gov.uk if you want to be
  sure."* Link to the free forecast tool.
- **Why we ask:** "the one figure that's guaranteed for life, so it's the steadiest foundation for
  the rest of the plan."

**3b. Your Aviva pension** — see the dedicated card design in §4.

**3c. Your People's Pension** — see §4.

**3d. Cash ISA / savings**
- Fields: `cashIsaBalance`, `cashIsaMonthly` (both exist).
- **Why we ask:** "Savings aren't a worse choice than a pension, just a different one — you can
  reach an ISA at any age, which matters if you want to stop working before your pension unlocks
  at 55 (57 from 2028)."

**3e. Business cash**
- Fields: `businessCashAmount`, `businessCashAge` (both exist).
- Copy: *"Cash left in the company, or what you might sell it for. Be conservative — a business
  is worth what someone will actually pay for it."*
- If `taperingStyle === 'taper_first'` from 2b, pre-fill `businessCashAge` to the tapering start
  age rather than full retirement age, since that's when she'd likely first draw it down.
- **Why we ask:** "money you're expecting from the business, so it can count toward the whole
  picture rather than sitting outside it."

**3f. Your house**
- Fields: `houseValue`, `mortgageBalance`, `mortgageRate`, `mortgageYearsLeft`,
  `mortgageOverpayment` (all exist), plus `downsizeReleaseAmount`, `downsizeAge` (exist).
- Downsize sub-fields open **expanded** if `downsizeIntent` was `yes`/`maybe` (2e), **collapsed**
  (defaulted to 0, one-line note) if `no`.
- Explicit caveat, carried over from 2f: *"The lifestyle figures on the goals screen assume you
  own your home outright — this is where that assumption comes from."*
- **Why we ask:** "your home is usually the single biggest thing you own, so it belongs in the
  same picture as your pensions, even though we never guess at house-price growth."

**Header:** live from 3a onward, updating after every card with a visible delta (§3).

### Screen 4 — How you pay in

Two parts, one screen (grouped because both are low-stakes-to-answer facts about her setup, not
decisions — UX research §4 permits grouping factual fields):

**4a. Paying in personally**
- Field: `personalMonthlyContribution` (exists).
- Copy as already written in `lib/fields.ts` — tax relief explainer already strong.

**4b. Paying in from the business**
> **How are you engaged with your client?**
> *This decides whether your company can pay into your pension directly — it's usually the most
> valuable box on this whole page.*

- **Input:** cards, reusing `WorkingArrangement` from `lib/engine/contractor.ts` verbatim:
  - "Through my own limited company, outside IR35" → `ltd_outside_ir35`
  - "Through my own limited company, inside IR35" → `ltd_inside_ir35`
  - "Through an umbrella company" → `umbrella`
  - "I'm not sure" → `unknown` (default — never force a guess on something this consequential)
- On selection, show `companyContributionsAvailable(arrangement).explanation` inline immediately —
  this is already written, warm, plain-English copy; just surface it here rather than burying it.
- If available (`true` or `'uncertain'`), reveal `employerMonthlyContribution` (exists) as a
  slider.
- If `unknown` or `ltd_inside_ir35`: no slider is hidden — she can still enter a figure — but a
  persistent amber (not red) note stays attached to it: *"We've assumed this is possible, but it's
  worth confirming with your accountant before relying on it."* This same flag carries through to
  Screen 5's warnings and becomes the #1 item on Screen 6.
- **Field:** **[NEW FIELD]** `workingArrangement: WorkingArrangement` (type already defined in
  `lib/engine/contractor.ts` — reuse it, don't redefine).

**Header:** live, and this is the screen most likely to produce the single biggest jump in the
headline figure — the delta chip (§3) should be allowed to show a larger, still-calm animation
here specifically, since this is often the "wait, seriously?" moment the product wants her to
notice.

### Screen 5 — Results

Exactly the priority order from UX research §5/§6 — this spec doesn't change that, it's already
right:
1. Gap bar (on track / not, in £/month)
2. Stacked income-sources chart (State Pension, Aviva, People's Pension, ISA, business cash,
   house — capped at 5 labelled layers per the research; combine Aviva + People's Pension into one
   "Pensions" layer on this chart specifically, since the two-pension detail already lives on
   Screens 3b/3c and repeating it here would blow the 5-layer cap)
3. Low/mid/high banded view, never a raw percentage
4. Collapsed "why does this matter?" arithmetic
5. Live what-if slider panel with deltas
6. Assistant panel, offered prominently

Additional element this build needs that the generic research didn't have to cover, because it's
specific to *her* actual questions:

- **"Should I combine your two pensions?" mini-panel**, sitting directly under the gap bar,
  populated whenever `annualChargeRate` (or a per-pot charge, if that becomes two separate fields
  — see §4 below) differs meaningfully between the two pots. One sentence stating the charge gap
  in £/year terms, one link through to the full transfer guide (hook point, §4).

**Header:** full detail — this is the screen the header was built for; every slider drag here
should show a live delta.

### Screen 6 — Next steps

Personalised action list — see §6 in full below.

**Header:** collapses to a slim, non-scrolling strip at the very top (figure + one word status),
since the page below it is now about *actions*, not *exploring numbers* — the header's job here is
reassurance-in-passing, not the main event.

---

## 3. THE PERSISTENT HEADER

This is the fix for the current build's worst problem — the number scrolling out of sight while
she moves sliders. It is a fixed/sticky element, not part of the scrolling document, from Screen 1
onward.

### What it shows

**Placeholder state (Screens 1–2f):**
```
┌──────────────────────────────────────────────┐
│  Building your number as we go →              │
└──────────────────────────────────────────────┘
```
Quiet, single line, muted colour — present so its later appearance doesn't feel like a jump-scare,
but carrying no figure yet (UX research §3's false-precision rule extends to "false-anything" —
never show a number before it means something).

**Live state (Screen 3a onward):**
```
┌──────────────────────────────────────────────┐
│  ON TRACK FOR                     ▲ +£85/mo   │
│  £2,340 a month                               │
│  About £300 short of your £2,650 goal         │
└──────────────────────────────────────────────┘
```
Three pieces of information, always in this order:
1. **The figure** — £/month, net, today's money, rounded to the nearest £10 (never
   "£2,341.87" — UX research §3/§5 false-precision rule).
2. **The status line** — one sentence, gap or surplus in £/month, plain language, no red "X" or
   failure grading (UX research §7's anti-shame rule — see "bad news" below).
3. **The delta chip** — appears only in the ~2 seconds after a value changes, then fades; see
   below.

### Desktop behaviour
Fixed to the top of the viewport, full width of the content column, `position: sticky; top: 0`,
above everything else including the "Questions answered" tab. Height stays constant (~88px) so it
never pushes content on appearance/disappearance — it's always there, just sometimes in the quiet
placeholder state. Roomy three-line layout as shown above.

### Mobile behaviour
Collapses to a single line by default: `£2,340/mo · About £300 short`. Tapping it expands
in-place (no navigation, no modal) to the full three-line desktop layout for a few seconds or
until she taps elsewhere. Never covers more than ~15% of viewport height even expanded. This
matters specifically for the slider screens (2a, 3b–3f, 4) — she needs to see the figure move
*while her thumb is still on the slider*, which a modal or a scroll-to-top pattern would break.

### Signalling a change — the delta chip
- Every time a value she just changed causes the headline figure to move, a small pill appears
  next to the figure for ~2 seconds then fades: `▲ +£85/mo` or `▼ −£40/mo`.
- Debounce slider drags to ~150ms (UX research §3) so the chip reflects the settled value, not
  every intermediate pixel of a drag.
- Colour: **never red for a decrease.** Use the product's neutral/muted palette for both
  directions — a filled arrow glyph carries the direction, not colour-coded alarm. This is a
  direct application of UX research §7's "avoid shame/anxiety entirely" rule to the one place in
  the product that updates most often and most visibly.
- On the "how you pay in" screen (4b) specifically, allow the chip to sit slightly longer (~3.5s)
  and at a slightly larger size — this is the screen where the jump is often largest and most
  worth letting land (see Screen 4 note above).

### Staying readable when the figure is bad news
- The card background never turns red or alarming. Follow the pattern already built in
  `app/plan/page.tsx` (`border-l-destructive` as a left accent strip on a muted background,
  everything else unchanged) — a small amount of colour, not a wash of it.
- Status-line copy is always forward-looking and neutral: *"About £300 short of your goal"*, never
  *"You are not on track"* or *"You will run out of money."* Every bad-news state pairs with a
  same-screen or one-tap-away action, per UX research §7 ("every bad-news number is paired with at
  least one small, concrete, achievable action") — on Screens 3–4 that's the next unanswered
  field; on Screen 5 that's the assistant's proposed slider move.

---

## 4. THE TWO PENSION CARDS

Kirsten's Aviva pot and her People's Pension pot are named, distinct things to her — the product
should treat them that way rather than folding them into one generic "pensions" slider, which is
the current build's specific failure here.

### Card layout (identical structure for both, provider name substituted)

```
┌─────────────────────────────────────────────────┐
│  Your Aviva pension                              │
│                                                   │
│  How much is in it?              [I don't know →]│
│  £[ 20,000 ]  ────────●──────────                │
│                                                   │
│  Still paying in?  ○ Yes   ● No                  │
│                                                   │
│  What are the charges?           [I don't know →]│
│  [ 0.50% ]  ──●──────────                        │
│                                                   │
│  How is it invested?             [I don't know →]│
│  ○ Cautious   ● Balanced   ○ Adventurous          │
│                                                   │
│  💬 Wondering whether to combine your two         │
│     pensions? → read the short guide              │
└─────────────────────────────────────────────────┘
```

- **Balance:** `avivaBalance` / `peoplesPensionBalance` (exist) — number field primary (this is a
  known-or-findable figure, not a what-if; UX research §3's number-field rule), slider secondary
  for quick adjustment.
- **Still contributing + amount:** reuses the existing monthly-contribution pattern; if she says
  "no" here, no slider is shown at all rather than shown-and-zeroed (fewer visible controls when
  they don't apply).
- **Charges:** currently one shared `annualChargeRate` field in `lib/fields.ts` — **[NEW FIELD]**
  this needs splitting into `avivaChargeRate` and `peoplesPensionChargeRate` so the two pots can
  actually be compared, which is the whole point of her "should I combine them?" question. Same
  bounds/step/default (0.5%) as the existing `annualChargeRate`.
- **Risk / fund type:** does not exist in the current model at all. **[NEW FIELD]**
  `avivaRiskLevel` / `peoplesPensionRiskLevel: 'cautious' | 'balanced' | 'adventurous'`, default
  `'balanced'`. This is what directly answers her literal question ("what's the risk setting on my
  Aviva one?") and should feed the growth-rate assumption per `projection-maths.md` §2's
  growth-fund-vs-cautious-fund split (cautious ≈ 3.5% mid / balanced ≈ 4–4.5% mid / adventurous ≈
  5% mid, nominal) rather than being cosmetic.
- **Transfer/combine guide hook:** a single text link at the bottom of *both* cards, same
  destination — the guides content answering "should I combine my two pensions?" (charges,
  loss of any guarantees, exit fees to check, simplicity vs diversification). Also surfaced
  automatically as the mini-panel on Screen 5 described above when the charge gap is material.
- **Risk guide hook:** tapping the risk selector's info icon opens a short inline explainer
  (not a full guide page — this is a simpler concept) covering what cautious/balanced/adventurous
  broadly means and that it should loosely track how many years until she needs the money.

### The "I don't know" path for each field on this card
See the full table in §5, but on this specific card each "I don't know" link does the same three
things in the same order every time (consistency matters more here than elsewhere, since she'll
hit it twice, once per pot):
1. A one-line tip on where to find it (*"Check your latest annual statement, or log into the
   Aviva app"*).
2. A single tap to accept a sensible default and move on.
3. It's added, automatically, to the Screen 6 action list.

---

## 5. THE "I DON'T KNOW" PATHS

She must never be blocked by a number she doesn't have to hand. Every field gets a small
**"I don't know"** affordance next to it. Tapping it always does the same three things, in the
same order (consistency across the whole product, not just the pension cards): show a one-line
"where to find it" tip → offer a one-tap default → silently queue it as a Screen 6 action item
(never a scary "incomplete!" banner — it just quietly shows up as a next step).

| Field | Default when unknown | Where to find it (shown in the tip) |
|---|---|---|
| `currentAge` | Can't be skipped — nobody is unsure of this | — |
| `retirementAge` | State Pension age (67) | — it's a preference, not a fact, so this is really "haven't decided yet" rather than "don't know"; same default either way |
| `salary` | £50,000 (default already in `lib/fields.ts`), and the "about the same as now" lifestyle card is simply skipped/greyed rather than shown with a wrong number | P60, payslip, or recent tax return |
| `avivaBalance` / `peoplesPensionBalance` | £0, but flagged distinctly from a *true* zero — see below | Annual statement, provider app or website, or the free government Pension Tracing Service if the pension itself has been lost track of |
| `avivaChargeRate` / `peoplesPensionChargeRate` **[NEW]** | 0.5% (typical) | Annual statement, sometimes called the OCF or ongoing charge |
| `avivaRiskLevel` / `peoplesPensionRiskLevel` **[NEW]** | "Balanced" | Annual statement fund name, or the provider's online dashboard |
| `cashIsaBalance` | £0 | — usually known; if genuinely unsure, bank/ISA provider app |
| `houseValue` | A rough Rightmove/Zoopla "estimated value" for the postcode, offered as a one-tap suggestion where feasible; otherwise skip and exclude the house from the plan with a visible note | Rightmove/Zoopla estimate, or a recent mortgage valuation |
| `mortgageBalance` | £0 (assume paid off) — flagged, since this materially changes the retirement-income assumption (see 3f caveat) | Latest mortgage statement or lender's online account |
| `mortgageRate` | 4.5% (stated default already in `lib/fields.ts`) | Mortgage offer letter or lender's app |
| `mortgageYearsLeft` | Skip — treat as "unknown," don't guess a number this consequential silently | Mortgage statement |
| `businessCashAmount` | £0 | — inherently uncertain for everyone, not just her; framed as "best guess, not a fact" regardless |
| `statePensionAge` | 67 | gov.uk State Pension age checker (2-minute link, shown regardless of whether she says she knows) |
| `qualifyingYears` | 35 (assume full) — flagged prominently, since this is the single cheapest, highest-value check in the whole tool (per `projection-maths.md`/existing field copy) | gov.uk NI record (free, 2 minutes) |
| `targetIncome` | Never blank — the lifestyle cards (2f) are the entire answer to this | — |

**True zero vs. unknown, for the two pension balances specifically:** these two fields need a
tri-state, not just a number — a checkbox or toggle next to the field, *"I genuinely don't know
(not the same as zero)"*. When checked: the maths still uses £0 for now (so the projection never
silently over-promises), but the result screen's warnings list and the Screen 6 action list both
say, explicitly, *"You told us you're not sure what's in your Aviva pension — finding out could
change this whole picture, so it's worth doing before anything else."* A true "no, it really is
empty" answer gets no such warning. Conflating the two is the single most consequential "I don't
know" case in the product, because guessing wrong here (silently assuming £0 when she actually has
£20k) would make the whole plan look far worse than it is.

---

## 6. THE NEXT STEPS SCREEN

She's emailing her accountant tomorrow about business contributions — that action should already
be sitting at the top of this list, pre-personalised, not something she has to compose from
scratch. Ordered by value to her specifically (not a generic checklist):

1. **Talk to your accountant about paying into your pension from the business.**
   *Shown whenever `workingArrangement` is `ltd_outside_ir35`, `ltd_inside_ir35`, or `unknown` —
   i.e. almost certainly, for her.* One sentence stating her actual numbers:
   *"Based on what you've told us, paying [£X]/month from company profit instead of taking it as
   dividends could be worth about [£Y] more a year in your pocket."* (from
   `dividendVersusPension()`, already implemented in `lib/engine/contractor.ts`). Button:
   **"Copy a summary to send your accountant"** — generates 3–4 plain-English sentences with her
   actual figures, ready to paste into an email, not a generic explainer. If `ltd_inside_ir35` or
   `unknown`, the summary explicitly asks the accountant to confirm IR35 status and whether the
   fee-payer would agree to pay any of the contract into her pension before tax.

2. **Check your real State Pension forecast and National Insurance record.**
   *Shown whenever `qualifyingYears` or `statePensionAge` was left at the default.* "Takes about
   two minutes on gov.uk and could change your numbers more than almost anything else here — gaps
   are often cheap to fill." Direct link.

3. **Find the actual balance, charges, and fund type for whichever pension you weren't sure
   about.** *Shown per-pot, only for whichever of Aviva/People's Pension was flagged as
   genuinely-unknown in §5.* "Log into [provider]'s app or find your latest annual statement — we
   want this to be your real number, not our guess."

4. **Decide whether to combine your two pensions.** *Shown whenever the charge gap between
   `avivaChargeRate` and `peoplesPensionChargeRate` is meaningful (e.g. >0.15 percentage points),
   or whenever she's tapped the "wondering whether to combine" link on either card.* One sentence
   with her actual charge-gap figure in £/year, then the link to the full transfer guide (check
   for exit fees and any guarantees first — the guide covers this).

5. **Look again at the risk setting on your Aviva pension.** *Shown whenever `avivaRiskLevel` was
   left at "I don't know"/default and her time-to-retirement is long enough that it's worth a
   second look, or short enough that "adventurous" would be worth flagging.* Links to the short
   risk explainer from the pension card.

6. **Think about opening or building up a cash ISA.** *Shown whenever `lumpSumIntent` or
   `taperingStyle` suggests she might want money before pension access age (55/57), and
   `cashIsaBalance` is low.* "An ISA is the one pot you could reach before your pension unlocks."

7. **Your plan is saved.** Always last, always shown, regardless of the above: *"Everything you've
   told us is saved automatically — nothing to click, nothing to lose. Come back any time and pick
   up where you left off."* No further CTA.

Each item: a checkbox she can tick as done (persisted — ticked items move to a collapsed "done"
section rather than disappearing, so she can see her own progress over time), one sentence of
*why*, one clear low-commitment action, and never more than one action per item. No multi-CTA
marketing layout, no shame language for anything left unticked.

---

## New fields needed before this can be built

Summarising the **[NEW FIELD]** markers above, for whoever wires this into `lib/fields.ts` / the
store:

- `taperingStyle: 'stop_in_one_go' | 'taper_first' | 'unsure'`
- `taperingYearsBeforeRetirement: number` (1–10, default 3)
- `lumpSumIntent: 'specific' | 'general' | 'no' | 'unsure'`
- `lumpSumPurpose: string` (optional free text, not used in maths)
- `lumpSumTargetAmount: number`
- `legacyIntent: 'yes' | 'no' | 'unsure'`
- `legacyTargetAmount: number`
- `downsizeIntent: 'yes' | 'no' | 'maybe'`
- `workingArrangement: WorkingArrangement` (type already exists in `lib/engine/contractor.ts` —
  just needs a slot in the store)
- `avivaChargeRate` / `peoplesPensionChargeRate: number` — splits the current single
  `annualChargeRate` in two
- `avivaRiskLevel` / `peoplesPensionRiskLevel: 'cautious' | 'balanced' | 'adventurous'`
- `avivaBalanceUnknown` / `peoplesPensionBalanceUnknown: boolean` — the true-zero-vs-unknown
  tri-state flag from §5

None of these are sliders in the exploratory sense (UX research §3) — they're mostly cards/choice
inputs, one-off text, or booleans, so they likely belong in a separate part of the store from the
existing numeric `FIELDS` object rather than being forced into that schema.
