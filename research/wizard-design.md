# Wizard Interaction Spec — Kirsten's Step-by-Step Review

Prepared 2 August 2026. This is the build spec that replaces the scrolling page in
`app/plan/page.tsx`. It builds on `research/calculator-ux.md` (cited as UX §n) and
`research/flow-spec.md` (field names, "I don't know" table, next-steps list — all still valid;
where this document differs, **this document wins**). Field bounds and copy come from
`lib/fields.ts`; new fields listed at the end.

Design stance, stated once: **one question per screen, no exceptions**; the live number **builds
upward during the flow and only becomes a gap at results**, so the wizard never feels like a
test she is failing; **presets are anchors, never answers** — any figure is typeable everywhere;
**the path is adaptive** — her answers insert and remove steps (rule set in §1b), advice lands
on the step where it's earned (§1a), and the full results are reachable from any step and back
again (§6).

---

## 1. THE STEP SEQUENCE

A **base path of 22 steps** in 4 named chapters, plus **six conditional steps (2b, 9b, 12b,
15b, 18b, 18c)** that the branch rules in §1b insert or remove as her answers come in. Every
step is a single tap, drag, or one number. Each step below gives: the question (her words),
input, default, the "why we're asking" line (always visible, small, under the question), and
the **insight** — a card that slides in *after* she answers, computed from her actual answer,
with a "Next" button. The insight is the coaching layer; it is never generic filler, never
longer than two sentences, and where an obvious action exists it carries **one** inline action
button (§1a) so advice becomes a done thing at step 6, not a to-do at step 20.

Step screens never scroll — the exact viewport contract is §1a. `Back` (top-left, always),
`Skip for now` (quiet text link, bottom — see §6).

### Chapter 1 — About you (2 steps, +1 conditional)

**1. "How old are you now?"**
- Input: number field (known fact → number, UX §3). Field `currentAge`. Default 51.
- Why: "We use this to work out how long your money has to grow."
- Insight: *"You've got {statePensionAge − currentAge} years until your State Pension starts —
  that's more time than most people think, and the years just before stopping are usually the
  best-paid ones."* (For 51: "16 years".)

**2. "When would you like to stop working?"**
- Input: slider + editable number, 50–75 (**[FIELD CHANGE]** `retirementAge.min` drops from 57
  to 50 so an early-stop wish can be expressed and branched on, rather than silently clamped).
  Default 67.
- Why: "The single biggest lever in the whole plan — it sets how long you save and how long the
  money must last."
- Insight, computed against the mortgage (defaults until Chapter 3 refines them):
  *"Stopping at {age} gives your pensions {age − currentAge} more years to grow. Your mortgage
  should clear when you're about {mortgageClearAge} — {n} years before you stop, so your biggest
  bill disappears while the pay is still coming in."* If she drags below `mortgageClearAge`, the
  insight flips to a calm note, not a warning: *"You'd still have the mortgage for {n} years
  after stopping — we'll count that in."* If she sets an age below 57 the insight also announces
  the inserted step (rule R3): *"One thing: pensions stay locked until 57, so I've added one
  quick question about those in-between years — it's next."*

**2b (only if rule R3: stopping age below 57). "Before 57 your pensions are locked — what would
those years live on?"**
- Input: 4 cards — "Savings and ISAs" / "Money from the business" / "Something else" / "Not
  sure yet" (default). Field `bridgeSource: 'isa' | 'business' | 'other' | 'unsure'` [NEW].
- Why: "Private pensions can't be touched before 57 — the gap has to come from a pot with no
  age lock."
- Insight per answer — ISA: *"Good — we'll check the size of that pot in a few questions and
  make sure it stretches from {retirementAge} to 57."* Business: *"That works — we'll time the
  business money to arrive when you stop, not at 57."* Other/unsure: *"That's fine — we'll flag
  the {57 − retirementAge}-year gap on your results so it never gets forgotten."* Choosing ISA
  or unsure forces rule R5's pre-57 step later if her savings turn out to be zero.

(`planningAge` stays at its default of 95 and is adjustable on the results screen fine-tune
panel — it is a safety margin, not a question worth a step.)

### Chapter 2 — The life you want (5 steps)

**3. "What would feel like enough, each month?"** — THE target step, full design in §3.
- Field `targetIncome` (stored annual; shown monthly). Anchors, dial, free typing.
- Insight: see §3.

**4. "Stop in one go, or ease down first?"**
- Input: 3 choice cards — "Stop in one go" / "Ease down gradually first" / "Not sure yet".
  Default "Not sure yet". If "ease down": inline reveal slider "starting how many years before
  you fully stop?" 1–10, default 3. Fields `taperingStyle`, `taperingYearsBeforeRetirement` [NEW].
- Why: "Lots of people with their own company cut back before stopping — it changes the last few
  years of paying in."
- Insight per answer — one go: *"Clean and simple — we'll plan for full earnings right up to
  {retirementAge}."* Ease down: *"Sensible — we'll taper your paying-in over those {n} years
  instead of assuming a cliff edge."* Unsure: *"Completely fine. We'll assume you stop in one go
  for now — it's easy to change later."*

**5. "Would you like a chunk of cash when you stop?"**
- Input: 4 cards — "Yes, for something specific" / "Yes, just to have it" / "No, more monthly
  income instead" / "Not sure yet" (default). "Specific" reveals optional one-line text "What's
  it for? (just for us)". Either yes reveals amount slider pre-filled at 25% of projected pot.
  Fields `lumpSumIntent`, `lumpSumPurpose`, `lumpSumTargetAmount` [NEW].
- Why: "Up to a quarter of a pension can usually come out tax-free from 57. Knowing if you want
  it changes how we plan the monthly income."
- Insight: yes: *"Noted — about £{amount} tax-free{purpose ? ` for ${purpose}` : ''}. We'll take
  it off the top before working out your monthly income."* No/unsure: *"We'll aim everything at
  monthly income — the tax-free option stays open either way."*

**6. "Is there anything you'd like to leave behind for someone?"**
- Input: 3 cards — "Yes" / "No, I'd rather use it" / "Haven't thought about it" (default).
  "Yes" reveals preset chips £10k / £50k / £100k / "different amount" (number field).
  Fields `legacyIntent`, `legacyTargetAmount` [NEW].
- Why: "It changes how carefully we suggest drawing money down."
- Insight: yes: *"We'll make sure the plan never spends below £{amount} — and money left in a
  pension usually passes on without inheritance tax."* No: *"Then the plan's only job is you —
  that actually makes the sums friendlier."* Unsure: *"Most people haven't. We'll plan without
  it and you can add it any time."*

**7. "Could you ever see yourself moving somewhere smaller?"**
- Input: 3 cards — "Yes, probably" / "No, staying put" / "Show me the numbers either way"
  (default). Field `downsizeIntent` [NEW].
- Why: "If you'd ever consider it, it can be one of the biggest single boosts to a plan —
  you're not deciding anything now."
- Insight: yes/maybe: *"With roughly £{equity} tied up in your home today, we'll show you what
  freeing some of it could do — later, when we get to the house."* No: *"Fair enough — your home
  stays a home in this plan, not a piggy bank."*

### Chapter 3 — What you've already got (11 steps, +5 conditional)

Ordered most-certain → most-speculative (UX §4). **This chapter is where the live number starts
building** (see §2) — every step *adds* money, so the number only rises here.

**8. "First, the one everyone gets: your State Pension."**
- Input: confirm card — "We've assumed the full amount: about £1,045 a month from 67. Sound
  right?" Buttons: "Sounds right" / "Let me adjust" (reveals `statePensionAge` and
  `qualifyingYears` sliders inline). Link: "Check your real forecast on gov.uk — 2 minutes."
- Why: "It's guaranteed for life, so it's the steadiest foundation of the whole plan."
- Insight (first live-number moment — let it land): *"That's £1,045 a month, every month, for
  life — {pct}% of your £{target} goal before we've counted a penny of your own."*

**9. "How much is in your Aviva pension?"**
- Input: number field + slider. Field `avivaBalance`. Default £20,000. "I don't know →" sets
  the `unknown.avivaBalance` flag (already in the store) — which triggers rule R6 and inserts
  step 9b. **Never a silent default to zero.**
- Why: "A rough figure is fine — you can log in and check later."
- Insight: *"£{balance} today could grow to around £{projected} by {retirementAge} — before
  anything new goes in."*

**9b (only if rule R6: she said she doesn't know the balance). "Let's pin down the Aviva figure
— it changes everything after it."**
- Input: two buttons — **"I'll look now"** (reveals the where-to-find list: Aviva app, latest
  annual statement, free Pension Tracing Service link, plus the number field ready for the
  figure) / **"Put it on my list — carry on"** (queues a top-priority next-step action; the
  maths carries a reasonable estimate with the `unknown` flag attached per flow-spec §5, and
  every figure downstream that leans on it gets the "assumed" tag from §6).
- Why: "Guessing zero here would make your whole plan look worse than it really is."
- Insight — found it: *"£{balance} — now the rest of this review is built on your real number,
  not a guess."* Later: *"No problem. Just know that nothing sharpens this plan more than that
  one number — it's first on your list."*

**10. "How is the Aviva money invested?"**
- Input: 3 cards — Cautious / Balanced / Adventurous + "I don't know →" (sets Balanced, queues
  "check your fund" to next steps). Field `avivaRiskLevel` [NEW], default balanced. Info icon →
  short inline explainer (years-until-needed rule of thumb).
- Why: "This is what your question about 'the risk setting' really means — it sets how fast the
  pot is likely to grow."
- Insight: *"{Level} means we'll assume around {rate}% growth a year. With {years} years to go,
  {level-specific sentence — e.g. balanced: 'that's a reasonable middle road — worth checking
  you're not accidentally in the cautious fund, which would cost you growth you have time to
  earn.'}"*

**11. "What does Aviva charge you each year?"**
- Input: preset chips 0.25% / 0.5% / 0.75% / 1%+ + editable number. Field `avivaChargeRate`
  [NEW, split from `annualChargeRate`]. Default 0.5%. "I don't know →" path.
- Why: "Charges compound against you the same way growth compounds for you."
- Insight: *"At {rate}% you'd pay roughly £{annual £} this year. We'll compare this with your
  People's Pension in a moment — it's the heart of your 'should I combine them?' question."*

**12–14. The People's Pension — same three steps, provider name swapped, including the same
conditional find-it step (12b) under rule R6.**
Fields `peoplesPensionBalance`, `peoplesPensionRiskLevel` [NEW], `peoplesPensionChargeRate`
[NEW]. Step 14's insight does the comparison she actually asked for:
*"Your People's Pension charges {rate}% and Aviva {rate}%. On your balances that's about
£{gap}/year difference — {if >£25/yr: 'worth a look at combining them; we'll put it on your
next-steps list' / else: 'close enough that combining is about convenience, not cost.'}"*

**15. "How much do you have in savings or ISAs?"**
- Input: number field. Field `cashIsaBalance`. Default £0. Inline reveal if >0: "adding anything
  monthly?" (`cashIsaMonthly`).
- Why: "Savings are the one pot you can reach at any age — pensions stay locked until 57."
- Insight if 0: *"Nothing to add here — that's genuinely fine. One thing worth 30 seconds,
  though — it's the next card."* (announces rule R5's insert). If >0: *"£{n} you can touch
  whenever you like — useful flexibility the pensions can't give."*

**15b (only if rule R5: savings are £0, or step 15 was skipped). "The one pot you could open
tomorrow."**
- A teaching step with one optional action, not a guilt trip. Card copy: *"Pensions are locked
  until 57. An ISA is the only pot here you could reach at any age — {if bridgeSource === 'isa':
  'and it's the pot you said would carry you from ' + retirementAge + ' to 57, so right now that
  bridge is empty.' else: 'which matters if you ever want to stop, or ease down, earlier than
  planned.'}"*
- Input: two buttons — **"Start one — try a monthly amount"** (reveals `cashIsaMonthly` slider,
  starting position £50) / **"Noted — not for now"** (default; no queue, no nag).
- Insight — started: *"£{n}/month is about £{total} you could touch at any age by
  {retirementAge}. Small, flexible, yours."* Not now: *"Fair enough — pensions it is. Nothing
  lost; the option doesn't expire."*

**16. "How much do you expect from the business, and when?"**
- Input: number field (primary question) + small inline "arriving around age" field. Fields
  `businessCashAmount`, `businessCashAge`. Defaults £0 / retirement age (pre-filled to taper
  start age if she chose easing down). One topic, so one screen.
- Why: "Money you're expecting from the company belongs in the same picture as everything else."
- Insight: *"£{n} at {age} noted — and kept deliberately conservative. There's often a better
  route for company money than one payment at the end; that's the last chapter."*

**17. "What's your house worth today?"**
- Input: number field + slider. Field `houseValue`. Default £400,000.
- Why: "Usually the biggest thing you own — it belongs in the picture even though we never
  guess at house prices."
- Insight: *"With the mortgage we'll check next, that's roughly £{equity} of it actually yours."*

**18. "How much is left on the mortgage?"**
- Input: number field. Field `mortgageBalance`. Default £120,000. Small inline "about how many
  years left?" (`mortgageYearsLeft`, default 12). Rate and overpayment stay at defaults,
  adjustable in results fine-tune.
- Why: "Every 'enough per month' figure out there assumes the mortgage is gone — so when yours
  goes matters a lot."
- Insight (this is one of her genuinely good facts — say it): *"That clears when you're about
  {clearAge} — {n} years before you stop working. Your biggest monthly bill disappears while
  the income is still coming in. That's the right way round."* If instead the mortgage outlives
  the stopping age (rule R4), the insight announces the insert: *"That runs until you're about
  {clearAge} — {n} years after you'd stop. Worth dealing with now; it's the next question."*

**18c (only if rule R4: mortgage clears after stopping age). "Your mortgage would still be
running when you stop — want to do something about it?"**
- Input: 3 cards — **"Show me what overpaying does"** (reveals `mortgageOverpayment` slider
  with a live readout under it: *"£{n}/month clears it at {age} — {before/after} you stop"*,
  so she watches the crossover happen) / **"I'd sooner keep the money and count the payments"**
  (default; engine already models the continuing payments) / **"I'd think about stopping a bit
  later"** (one-tap preview of `retirementAge = clearAge` via the standard suggestion
  confirm — "Use this" / "No thanks" — never applied silently).
- Why: "A mortgage that outlives the salary is the most common hole in a plan — and the
  cheapest one to fix early."
- Insight per choice — overpay: *"£{n}/month extra clears it at {age} and saves about
  £{interestSaved} in interest — a guaranteed return."* Count it: *"Fine — your target income
  now includes £{payment}/month of mortgage until {clearAge}, so the plan stays honest."*
  Later: *"Moving to {age} closes the mortgage gap on its own — see how the number just
  moved."*

**18b (only if `downsizeIntent` is yes/maybe). "If you did move somewhere smaller, roughly what
would it free up?"**
- Input: slider + number. Field `downsizeReleaseAmount`, plus `downsizeAge` inline (default 67).
  Helper text = the existing `lib/fields.ts` explainer (sale price minus next home minus ~2–3%
  costs).
- Insight: *"£{n} at {age} — we'll show it as its own layer in your results so you can see the
  plan with and without it."*

### Chapter 4 — What goes in (3 steps; step 21 removed by rule R1 if there's no company)

**19. "How much do you pay in yourself each month?"**
- Input: slider + number. Field `personalMonthlyContribution`. Default £250.
- Why: existing `lib/fields.ts` copy (tax relief top-up).
- Insight: *"£{n} from your bank becomes £{n × 1.25} in the pension — the government adds
  £{n × 0.25} before any growth."*

**20. "How do you work with Jack & Jones?"**
- Input: cards reusing `WorkingArrangement` from `lib/engine/contractor.ts` — own company
  outside IR35 / own company inside IR35 / umbrella / employed on payroll / self-employed, no
  company / not sure (default). Field `workingArrangement` (already in the store). On
  selection, show `companyContributionsAvailable().explanation` inline.
- Why: "This decides whether your company can pay into your pension directly — usually the most
  valuable answer in this whole review."
- Insight: outside IR35: *"Good news — your company can pay your pension directly: no income
  tax, no NI either side, and it cuts Corporation Tax. The next question is the big one."*
  Inside IR35/unsure: same explainer plus the amber (never red) note and an inline action:
  **"Copy the accountant email"** — *"Worth one email to your accountant to confirm — we've
  drafted it with your figures; send it now or find it again in your next steps."*
  Employed: *"Then IR35 isn't your problem — but check your workplace pension match: anything
  your employer offers to match is free money."* Sole trader: *"No company means no company
  route — but personal contributions still get the full tax top-up, and that works well."*
  Employed or sole trader triggers **rule R1**: step 21 drops off the path, the Chapter 4 dot
  count shrinks by one, and the results' company panel is replaced by the matching guidance.

**21 (only if rule R1 doesn't remove it). "Could the company pay something in each month?"**
- Input: slider + number. Field `employerMonthlyContribution`. Default £0. If arrangement is
  inside-IR35/unknown, the amber "confirm with your accountant" note stays attached.
- Why: "Money that never touches your salary — for company cash it usually beats paying
  yourself more and saving it."
- Insight (the "wait, seriously?" moment — the live number's largest jump; delta chip lingers
  3.5s here): *"£{n}/month from the company adds about £{delta}/month to your retirement income
  — and costs the company less than paying you £{n} as salary would."*

**→ Results.** The reveal moment: the header animates from "built so far" into the full gap
view, then the results screen per flow-spec (gap bar, stacked sources, cautious/expected/
optimistic band, fine-tune sliders, combine-pensions panel, assistant). Then Next Steps per
flow-spec §6. Not re-specified here.

---

## 1a. THE STEP SCREEN — ONE THING AND THE NUMBER, ALWAYS

The test this design must pass: at any moment she sees exactly one thing to do, and the
number. So the step screen is a **fixed five-zone column that never scrolls**, in both of its
two states (before answer, after answer):

| Zone | Content | Height budget (375×667 phone) |
|---|---|---|
| A | `LiveNumberBar` (fixed) | 48px |
| B | `ProgressRail` (chapter dots) | 28px |
| C | Question (max 2 lines, 22px) + why-line (max 2 lines, 14px; overflow → info icon) | ≤ 96px |
| D | **The input** — and later the insight (see below) | ≤ 340px |
| E | Action row pinned in the thumb zone: Back · Next · Skip link | 72px |

**Where the insight goes — the part that must not fail.** When she commits an answer, the
input does not stay full-size with an insight bolted underneath (that's how screens start
scrolling). Instead:

1. The input **collapses to a one-line `AnswerChip`** at the top of zone D — her answer in
   bold ("Stop working — **67**"), tappable to reopen the input.
2. The `InsightCard` **animates into the space the input just released** — it occupies pixels
   already on screen, so nothing is ever pushed below the fold.
3. "Next" (zone E, already on screen, already under her thumb) becomes the highlighted
   element.

The insight is therefore impossible to miss (it appears exactly where her eyes already are,
in the centre of the screen) and impossible to be blocked by (Next never moves and never
requires scrolling to reach). Hard limits that keep this true: insight text ≤ 220 characters;
**at most one** inline action button inside it (`link` — e.g. the gov.uk forecast; `reveal` —
e.g. the overpayment slider in 18c; `apply` — a confirm-first value change; `queue` — add to
next steps); `ChoiceCards` max 4 visible options at 56px; reveals (`RevealField`) replace the
why-line's space, never extend the column. If an explanation genuinely needs more room, the
card ends with "tell me more →", which opens the assistant panel prefilled — the card itself
never grows.

**Enforcement, not intention:** a Playwright CI test iterates every step (every branch
variant) at 375×667 and 320×568, in both pre- and post-answer states, asserting zero vertical
overflow. A step that scrolls is a failing build, not a design regret.

---

## 1b. THE BRANCHING RULE SET

The path is a **pure function**: `computePath(answers): StepId[]` in `lib/wizard-steps.ts`,
re-run on every commit. Each `StepDef` carries `condition(ctx): boolean` and `insertAfter:
StepId`. The rules:

| Rule | Condition (live, over store state) | Effect | Where it's announced |
|---|---|---|---|
| R1 | `workingArrangement ∈ {employee, sole_trader}` | Remove step 21 (company contribution); swap results' company panel for match/sole-trader guidance | Step 20's insight |
| R2 | `downsizeIntent === 'no'` | Remove 18b. Equity is still shown — step 17/18 insights state it regardless | Step 7's insight ("your home stays a home — we'll still show you what it's worth") |
| R3 | `retirementAge < 57` | Insert 2b (bridge years) after 2 | Step 2's insight |
| R4 | `mortgageClearAge(values) > retirementAge` | Insert 18c after 18 | Step 18's insight |
| R5 | `cashIsaBalance === 0` at commit/skip of 15 (or forced by 2b choosing 'isa'/'unsure') | Insert 15b after 15 | Step 15's insight |
| R6 | `unknown.avivaBalance` / `unknown.peoplesPensionBalance` set | Insert 9b / 12b immediately after the balance step | The "I don't know" affordance itself |

**Re-evaluation when she edits an earlier answer** (via chapter overview or results):

- Condition becomes true **ahead** of her furthest point → the step slots into place; she
  meets it in order. Nothing to announce beyond the insight that caused it.
- Condition becomes true **behind** her furthest point (e.g. she drops `retirementAge` to 55
  from the results screen) → the step is **not** forced on her mid-edit; it joins the results
  screen's "questions left" panel (§6) as *"One new question about {topic} — 30 seconds"*.
- Condition becomes false for an already-answered step → the step leaves the rail but its
  answer is retained in the store (flow-spec's no-reset rule); if the condition returns, the
  step comes back pre-filled.

**Progress arithmetic that never moves the finish line away.** There is no global "step 9 of
22" anywhere, so total path length is never displayed as a number that could grow. The rail
shows chapter dots computed from the *current* path. Removals just quietly shorten a chapter —
the finish line only ever jumps closer. Insertions are allowed **only** at the moment one of
her own answers creates them, and the announcing insight always names the cost in the same
breath as the reason (*"…so I've added one quick question about that — it's next"*): the dot
appears while she reads the sentence explaining it. A dot never appears without an on-screen
sentence taking responsibility for it, and never more than one at a time.

---

## 2. THE LIVE NUMBER

The fix for "I'm still scrolling so I can't see the number change" is twofold: steps never
scroll (each fits the viewport), and the number lives in a fixed bar that is part of the frame,
not the page.

**Placement.**
- Desktop (≥768px): fixed bar at the very top of the viewport, full content-column width,
  72px tall, always present from step 1, above everything. The step card sits centred below it.
- Mobile: fixed single-line strip at the top, 48px: `£1,045 of £2,725 so far`. Tapping expands
  it in place to the two-line version for 4s or until she taps elsewhere. Never a modal; never
  more than ~15% of viewport height. Input stays visible while the strip is expanded — she must
  be able to watch the figure move with her thumb still on the slider.

**Three states — never a fake number.**
1. **Quiet (steps 1–2):** muted single line: *"We'll build your number here as we go →"*. No
   figure. Present from the start so its later activation isn't a jump-scare.
2. **Goal anchor (steps 3–7):** the moment she sets a target in step 3, the bar shows **her**
   number — a real fact, not a projection: `Your goal: £2,725 a month`. Nothing to compute yet,
   nothing to fail at.
3. **Building (step 8 → results):** `£1,860 of your £2,725 — still counting`. Framed as a
   running total of what we've *found*, with "still counting" (or "{n} questions to go") making
   explicit that it's incomplete. **The gap is never named during the wizard.** Every step in
   Chapter 3–4 adds income, so the number only ever rises here — the wizard is structurally
   incapable of delivering bad news mid-flow. The reckoning happens once, at results, where it
   arrives with the levers to fix it on the same screen (UX §7: every bad-news number pairs
   with an action).

**Animation.** On any settled change (slider debounced 150ms): the figure counts up/down over
~500ms ease-out; a delta chip fades in beside it — `▲ +£240/mo` — holds 2.5s, fades. On step 21
the chip holds 3.5s at a slightly larger size. Number rounded to nearest £5/month, always
(UX §3 false precision).

**Anti-scoreboard rules (she is anxious — these are hard rules).**
- No red, ever, in the bar. Decreases use the same muted foreground with a ▼ glyph; direction
  is carried by the glyph, not colour.
- Bar copy is always additive/forward: "so far", "still counting" — never "short", "behind",
  "only". Gap language is reserved for the results screen, where it reads *"About £{n} a month
  to find — here's what closes it"* next to the fine-tune levers.
- No percentages, no scores, no progress-to-goal meter on the bar itself. A thin quiet fill
  line under the figure is allowed (target = full width) but with no % label.
- If she edits an earlier answer downward, the chip shows the ▼ and the insight card explains
  the *why* in neutral terms; the bar itself never comments.

---

## 3. THE TARGET INCOME STEP (step 3) — anchors, not options

One screen. The primary object is **her number**, not the presets.

**Layout, top to bottom:**
1. Question: **"What would feel like enough, each month?"** Sub-line: *"There's no wrong answer
   and nothing is locked in — this is a starting point you'll keep tuning."*
2. **The dial**: a very large editable figure (`£2,650 a month`, tap to type any value,
   `inputmode=numeric`) with a slider under it. Range £700–£10,000/mo (maps to `targetIncome`
   annual bounds), non-linear steps: £25 to £3,000, £50 to £5,000, £100 beyond. The number is
   live-editable to ANY value in range — typing always wins over the slider snap.
3. **Anchor chips** (not cards, not a choice): four small labelled markers *below* the slider,
   sitting at their actual positions on the track:
   `Essentials £1,100` · `Comfortable £2,650` · `Very comfortable £3,650` · `Like now ~£{x}`.
   Tapping a chip *moves the dial there* — it does not "select" anything, and the dial stays
   fully draggable/typeable afterwards, including **past the top chip** (track runs to £10,000;
   the space beyond £3,650 is visibly there, unlabelled and unjudged). Caption under the chips:
   *"Real figures from research into what retired people actually spend — grab one, then make
   it yours. Want more? Slide right past them."*
4. **"Like now" chip**: first tap reveals a single inline field — *"Roughly what do you earn a
   year, including what you take from the business?"* (`salary`) — then sets the dial to 75% of
   net monthly and relabels itself with the figure. (This is also where `salary` gets captured
   for tax-relief maths; if she never taps it, the default stands and the results fine-tune
   panel exposes it.)
5. **Assistant nudge** (per §5): *"No idea? Ask me — 'what do people like me pick?'"*
6. **Fine print**, one line: *"These research figures assume no rent or mortgage by then —
   we'll check that against your own mortgage later."*

Insight after she confirms: *"£{x} a month — that's £{x×12} a year in your pocket. About £1,045
of it will be State Pension. The rest of this review is about covering the other £{x−1045}."*

No default is pre-set on the dial before she interacts: the dial shows a neutral `£ —` with the
chips pulsing gently once. First touch (chip tap, drag, or typing) sets the value. This is the
one step that cannot be skipped past untouched — `Skip for now` here sets the Comfortable
anchor and says so.

---

## 4. SAVE AND RESUME

- **Storage:** the existing zustand-persist localStorage store keeps all field values (schema
  in `lib/fields.ts` already `.catch()`es bad values). Add a persisted `wizard` slice [NEW]:
  `{ currentStep, answered: StepId[], skipped: StepId[], lastSeenAt }` plus the new non-numeric
  answers (intents, arrangement). Every answer commits on the step's "Next", every slider value
  on debounce — there is no save button anywhere, and the welcome/resume screens both say so:
  *"Everything saves itself as you go. Close this whenever you like."*
- **Leaving:** nothing to do. Closing the tab mid-drag loses at most one debounce tick.
- **Returning (the resume screen):** if `answered.length > 0`, the entry route shows a resume
  card instead of the welcome screen:
  > **Welcome back, Kirsten.**
  > Last time you got to *your People's Pension* — {answered} of 22 questions done, and your
  > number so far is **£1,860 a month**.
  > [ **Carry on where I left off** ] — [ See my answers so far ] — [ See the full picture ]
  "See the full picture" is always available and uses §6's partial-results treatment.
- **Changing one earlier answer:** "See my answers so far" (also reachable any time from the
  progress rail, §6) opens the **chapter overview**: four chapter groups, each answered step as
  one line — question + her answer in bold (*"Stop working — **67**"*), skipped steps shown
  with a dotted marker. Tapping any line opens that single step in **edit mode**: same screen,
  same insight recomputed, but the button says *"Done — take me back"* and returns to wherever
  she was (overview or her current step). Downstream answers are never re-asked or reset; the
  live number just recomputes with a delta chip.

---

## 5. ASKING QUESTIONS MID-FLOW

- **The launcher:** a small fixed pill, bottom-right on desktop, bottom-centre-right on mobile:
  a speech-bubble icon + the word **"Ask"** (never icon-only). Visible on every step and on
  results. It never opens itself, never bounces, never badges. One-time coach mark on step 1
  only: *"Stuck on anything? Tap Ask — there are no silly questions here."*
- **The panel:** opens as a right-side panel (380px, desktop) or bottom sheet (~60% height,
  mobile). The step's question and input remain visible beside/above it — it overlays chrome,
  never the input. Dismiss by tapping outside, Esc, or the ✕. The wizard state is untouched;
  closing returns focus to the input.
- **Context:** the assistant receives all current values, the current step id, and her
  intents — it already knows her figures; she never repeats herself.
- **Step-suggested questions:** each step definition carries `suggestedQuestions: string[]`
  (1–2). They render as a single quiet line under the input: *"Not sure? Ask: 'why does the
  charge matter?'"* Tapping sends that question and opens the panel with the answer arriving.
  Examples — step 3: "what do people like me pick?"; step 10: "how do I find out which fund
  I'm in?"; step 20: "what actually is IR35?"; step 11/14: "is it worth combining my pensions?"
- **Proposals:** if the assistant suggests changing a value, it renders the existing
  preview-then-confirm pattern (store `suggestion` + "Use this"/"No thanks") — never a silent
  change (UX §7). If the suggestion targets an earlier step's field, accepting it applies the
  value directly with a delta chip; it does not navigate her backwards.

---

## 6. PROGRESS AND ESCAPE

- **Progress display:** chapter-first, so 22 never reads as 22. A slim rail under the live
  bar: four chapter labels (About you · The life you want · What you've got · What goes in)
  with a dot per step, filled as answered, dotted ring if skipped. Current position reads
  *"The life you want — 2 of 5"*. Tapping a chapter label opens the chapter overview (§4).
  No global "step 9 of 22" anywhere.
- **Skipping:** every step has `Skip for now` (bottom, quiet). Skipping applies the default
  from the flow-spec §5 table, marks the dot as skipped, and silently queues the item onto the
  Next Steps list — no banner, no "incomplete!" (flow-spec §5's three-part pattern). The two
  pension balances use the tri-state unknown flag so skip ≠ zero. Steps 1 and 3 are the only
  non-skippable ones (age: nobody is unsure; target: skip sets the Comfortable anchor
  explicitly, per §3).
- **Escape to results — available from every step, and back again.** The rail always shows
  *"See the full picture →"*. Every field has a default, so the engine can always compute;
  the honesty problem is solved by labelling, not by hiding the door:
  - **Banner** at the top of results, calm, never error-styled: *"{a} of these numbers are
    yours, {d} are best guesses — [Carry on the review]"*. The button returns her to the exact
    next unanswered step. Very early (before the target is set) the copy strengthens to *"A
    first sketch — almost everything here is a typical figure, not yours yet."*
  - **Assumed values are tagged, not broken.** Any figure driven by an unanswered or skipped
    input gets a small dotted-underline "assumed" tag wherever it appears (summary rows, chart
    tooltips). Muted styling only — never red, never a warning triangle; a guess is not a
    fault.
  - **The "best guesses" panel** sits under the gap bar: one row per unanswered input — label,
    the assumed value, and **[Answer this]**, which opens that single step in edit mode and
    returns her to results (same mechanism as the chapter overview, §4). Rows are ordered by
    how much each answer could move her number, so "your Aviva balance" outranks "charge
    rate". Steps inserted by a rule that fired behind her position (§1b) appear here too, as
    *"One new question about {topic} — 30 seconds."*
  - The two `unknown`-flagged pension balances take the top rows with flow-spec §5's copy
    ("finding out could change this whole picture").
  - Finishing the wizard later simply empties the panel and removes the banner — results
    reached early and results reached properly are the same living screen, not two modes.
  This replaces the wizard bar's building state only while she's on results; going back to
  the wizard restores the bar exactly as it was — the gap is still never named inside the
  flow.

---

## 7. COMPONENT INVENTORY

Reuse: `CalculatorSlider`, `Assistant`, `Guides`, `Alert`, engine + store. New/changed:

| Component | Props | Notes |
|---|---|---|
| `WizardShell` | `children` | Frame: `LiveNumberBar` + `ProgressRail` + step slot + `AskLauncher`. Owns step routing (`/plan/[stepId]` or internal state), Back handling, and the enter/exit slide transition (~250ms, `prefers-reduced-motion` → fade). |
| `LiveNumberBar` | `state: 'quiet' \| 'goal' \| 'building' \| 'results'`, `builtMonthly: number \| null`, `targetMonthly: number \| null`, `delta: {amount: number, holdMs?: number} \| null` | The §2 bar. Renders all three states; internal count-up animation; mobile collapse/expand. |
| `DeltaChip` | `amount: number`, `holdMs = 2500` | ▲/▼ + £/mo, fade in/out, neutral colours only. |
| `ProgressRail` | `chapters: ChapterDef[]`, `current: StepId`, `answered: StepId[]`, `skipped: StepId[]`, `onOpenOverview()`, `showResultsEscape: boolean`, `onEscape()` | Chapter labels + dots + escape link. |
| `StepScreen` | `step: StepDef`, `value: unknown`, `onCommit(value)`, `onSkip()`, `onBack()`, `editMode?: boolean`, `onDoneEditing?()` | Generic single-question chrome implementing the §1a five-zone layout: question, why-line, input slot → `AnswerChip` + `InsightCard` after commit, pinned action row, Skip link, suggested-question line. Never scrolls. |
| `AnswerChip` | `label: string`, `valueText: string`, `onReopen()` | The collapsed input after commit (§1a) — her answer in bold, tap to reopen. |
| `InsightCard` | `text: string`, `onNext()`, `tone?: 'default' \| 'landmark'`, `action?: {label: string, kind: 'link' \| 'reveal' \| 'apply' \| 'queue', payload: unknown}` | Slides into the space the input released (§1a). ≤220 chars, max one action. `landmark` = slightly larger (steps 8, 18, 21). `apply` always routes through the suggestion confirm pattern. |
| `ChoiceCards` | `options: {id, title, sub?, icon?}[]`, `value`, `onChange`, `columns?` | Steps 4–7, 10, 13, 20. 44pt+ targets, `role="radiogroup"`. |
| `RevealField` | `visible: boolean`, `children` | Inline conditional field on choice steps (taper years, lump-sum amount, salary on the like-now chip). Height-animated. |
| `MoneyDial` | `valueMonthly: number \| null`, `onChange`, `min`, `max`, `anchors: {label, valueMonthly}[]`, `untouched: boolean` | §3. Big editable figure + non-linear slider + anchor chips positioned on-track. Typing accepts any in-range value. ARIA slider pattern per UX §3. |
| `ConfirmCard` | `statement: string`, `confirmLabel`, `adjustLabel`, `onConfirm()`, `adjustChildren` | Step 8 State Pension confirm/adjust. |
| `NumberField` | `name: FieldName`, `value`, `onChange`, `secondary?: {name, label}` | Number-first input (balances, house); `secondary` renders the small inline companion field (mortgage years, business age). `inputmode=numeric`. |
| `PercentChips` | `presets: number[]`, `value`, `onChange`, `fieldName` | Charge steps 11/14. Chips + editable number. |
| `IDontKnow` | `tip: string`, `defaultValue: number`, `defaultLabel: string`, `onAccept()`, `queueAction: string`, `triState?: boolean` | Flow-spec §5 pattern; `triState` for the two balances. |
| `AskLauncher` | `stepId: StepId` | Fixed pill; opens `AssistantPanel`. |
| `AssistantPanel` | `open`, `onClose`, `prefill?: string`, `context: WizardContext` | Side panel/bottom sheet wrapper around existing `Assistant`. |
| `SuggestedQuestion` | `question: string`, `onAsk(q)` | The "Not sure? Ask: …" line. |
| `ChapterOverview` | `chapters`, `answers: AnswerSummary[]`, `skipped: StepId[]`, `onEditStep(id)`, `onClose()` | §4 answer list; entry to edit mode. |
| `ResumeCard` | `name: string`, `answeredCount`, `totalCount`, `builtMonthly: number \| null`, `lastStepLabel: string`, `onResume()`, `onOverview()`, `onResults()` | §4 welcome-back screen. Counts come from the current `computePath` result, so they respect branching. |
| `BestGuessesPanel` | `assumptions: {stepId, label, assumedValueText, isUnknownFlag: boolean, impactRank: number}[]`, `newQuestions: {stepId, topic}[]`, `onAnswer(stepId)` | §6 results panel: assumed inputs + rule-inserted questions that fired behind her position. Ordered by impact; `unknown`-flagged balances pinned to the top. |
| `AssumedTag` | `children` | Dotted-underline "assumed" marker for any figure driven by an unanswered input. Muted styling only. |
| `StepDef` (type) | `{ id, chapter, question, whyLine, input: InputSpec, fieldNames: string[], skippable: boolean, insight(ctx): InsightSpec, inlineAction?(ctx): InlineAction \| null, suggestedQuestions: string[], condition?(ctx): boolean, insertAfter?: StepId }` | Single data-driven registry `lib/wizard-steps.ts`. `condition` + `insertAfter` implement every rule in §1b. |
| `computePath` (fn) | `(state: CalculatorState) => { steps: StepId[], insertedBehindFurthest: StepId[] }` | Pure function in `lib/wizard-steps.ts`, re-run on every commit. `insertedBehindFurthest` feeds `BestGuessesPanel.newQuestions` instead of forcing navigation (§1b). |

**Store:** the current `lib/store.ts` already carries most of what this design needs —
`unknown` flags, `currentStepId`/`answered`/`skipped` + `markStep`/`goToStep`, and the intent
enums (`taperingStyle: 'cliff' | 'taper' | 'unsure'`, `lumpSumIntent`/`downsizeIntent`/
`legacyIntent: 'yes' | 'maybe' | 'no'` — this spec's step copy maps "not sure yet"/"haven't
thought about it" onto `'maybe'`, and steps 5/6's four-card layouts collapse to those three
stored states plus the separate amount/purpose fields). Still to add: `bridgeSource` [NEW],
`lumpSumPurpose`/`lumpSumTargetAmount`/`legacyTargetAmount`, the per-pot charge/risk splits
from flow-spec, and the `retirementAge.min` 57→50 bounds change in `lib/fields.ts`. The wizard
route is `/review` (already linked from the welcome page).

**CI guard:** the §1a Playwright viewport test (375×667 and 320×568, every step, every branch
variant, pre- and post-answer) ships with the wizard, not after it.
