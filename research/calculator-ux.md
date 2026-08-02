# UK Pension / Retirement Calculator — UX & Behavioural Science Research

**Date:** 2 August 2026
**Audience for our calculator:** a non-financial, non-technical person who feels overwhelmed by pension planning ("How the hell do I know how much I need per month 😬😵‍💫")
**Purpose:** synthesise best practice from real UK/US calculators, UX research and behavioural science, and turn it into a concrete screen-by-screen recommendation for *this specific build*: a single private user, password-gated, whole-picture tool (two pensions + State Pension + house sale + business cash + cash ISA), with low/mid/high uncertainty bands, an AI assistant that proposes slider moves for her to confirm, written "your questions answered" guide content, and a warm, reassuring tone throughout.

---

## 1. What good looks like — calculators examined

### MoneyHelper Pension Calculator (gov-backed, UK)
- **Inputs (in order):** current age → planned retirement age → current pension pot(s) → monthly contribution → assumed salary. Layers in an automatic State Pension estimate.
- **Interaction style:** plain number/text fields, not sliders. Very few screens — closer to a single form than a wizard.
- **"I don't know" handling:** minimal — no presets for target income; produces a projection *from* what you tell it rather than asking what you want and working backwards.
- **Output:** a single projected annual/monthly income figure at your chosen retirement age, plus scenario re-runs (change retirement age, contribution, lump sum).
- **Strengths:** impartial, government-backed, no cross-selling, good sanity-check reference. **Weaknesses:** single pot, single person, no couples, no drawdown sequencing, no life events, bare UI.
- Sources: [MoneyHelper pension calculator](https://www.moneyhelper.org.uk/en/pensions-and-retirement/pensions-basics/pension-calculator), [Tools and calculators](https://www.moneyhelper.org.uk/en/tools-and-calculators), [10 Best UK Pension Calculators 2026 review](https://pension-planner.uk/)

### MoneyHelper Budget Planner
- **Bottom-up, not top-down:** asks users to enter actual income and outgoings (rent/mortgage, bills, food, transport, etc.), categorised, and shows what's left over.
- Recommends checking bank statements/app first so numbers are *real*, not guessed.
- Supports mixed time periods (irregular annual costs auto-averaged to monthly) — removes a common friction point (e.g. car insurance paid yearly).
- The single best model we found for solving "I don't know what I need" from the *expenditure* side rather than a top-down percentage.
- Source: [Budget planner | MoneyHelper](https://www.moneyhelper.org.uk/en/everyday-money/budgeting/budget-planner)

### Pension Wise / Pension Wise Digital (MaPS)
- Free, government-backed guidance rather than a pure calculator; now also a **self-guided digital service** (2025/26) for 50+ with DC pensions — interactive tools + optional webchat with a human specialist.
- Lesson: some people don't want a number, they want a *conversation* — an escalation path from self-serve tool to a human (or, for us, to the AI assistant) is itself a UX feature worth building in.
- Sources: [Pension Wise | MoneyHelper](https://www.moneyhelper.org.uk/en/pensions-and-retirement/pension-wise), [What happens in a Pension Wise appointment? | PensionBee](https://www.pensionbee.com/uk/blog/pension-wise-appointment)

### Guiide.co.uk
- Positioned as the only fully holistic UK planning tool usable without an adviser. Free.
- Reviewers (incl. a 30-year pensions professional) specifically praise it as "user friendly and not overwhelming with pensions jargon" — independently validated for exactly our target user.
- Handles State Pension, DB ("final salary") pensions, ISAs and part-time work together; models tax-aware drawdown order. This whole-picture, multi-source-of-income scope is the closest existing analogue to what we're building.
- Gap: no couples planning (not relevant to us — single private user).
- Sources: [Guiide reviews | Trustpilot](https://uk.trustpilot.com/review/guiide.co.uk), [10 Best UK Pension Calculators 2026 review](https://pension-planner.uk/)

### Vanguard UK / Nutmeg / PensionBee / Aviva / Standard Life / L&G (provider tools)
- Common pattern: single-page, single-pot, contribution-and-growth calculators — lead-generation assets, not full planners.
- **Nutmeg** stands out for *flow order*: opens with **"What's your desired income in retirement?"** and works backwards — starts from the goal, not the inputs. (Weakness: ignores State Pension.)
- **PensionBee**: visually polished, one-page, immediate chart output.
- **Aviva** offers a *family* of small tools rather than one mega-calculator — lets the user pick the specific question they have.
- **Standard Life / L&G**: "answer a few quick questions" framing, minimal inputs (deliberately trading completeness for approachability).
- Sources: [PensionBee retirement planning tools](https://www.pensionbee.com/uk/retirement/retirement-planning-tools), [Vanguard retirement income calculator](https://investor.vanguard.com/tools-calculators/retirement-income-calculator), [Aviva pension calculator](https://www.aviva.co.uk/retirement/tools/my-retirement-planner/), [Standard Life retirement calculator](https://www.standardlife.co.uk/retirement/tools/retirement-calculator), [L&G retirement income calculator](https://www.legalandgeneral.com/retirement/retirement-income-calculator/)

### US comparators

**NewRetirement / Boldin** — wizard greets first-time users, collects essentials in a few minutes, then immediately shows a **summary graphic** before asking for more detail. Lesson: depth is fine *if hidden behind a fast, rewarding first pass*.
Sources: [Boldin review — White Coat Investor](https://www.whitecoatinvestor.com/newretirement-review-online-retirement-calculator/), [Boldin review — wellkeptwallet](https://wellkeptwallet.com/newretirement-review/)

**Fidelity Retirement Score** — just **6 questions** → a single score, framed as "conservative/moderate/growth" scenarios rather than raw output. Score-as-single-number is very approachable — easy to grasp, easy to improve.
Source: [Fidelity Retirement Score](https://www.fidelity.com/calculators-tools/fidelity-retirement-score-tool)

**cFIREsim** — the cautionary tale: powerful but explicitly "best for advanced users… may not be the most suitable tool for lay users." Full parametric control with no guardrails is exactly what overwhelms our user — the tool to *not* imitate.
Source: [6 Best Free Monte Carlo Retirement Simulation Calculators](https://www.thewaystowealth.com/free-monte-carlo-simulation-calculator/)

**Takeaway:** the market spans "one page, one pot, one number" to "everything, all the levers," with nothing doing *both* "start simple" *and* "help an anxious user actually understand the maths" well. That gap — plus our whole-picture scope and AI assistant — is our opportunity.

---

## 2. The "I don't know what I need per month" problem — the emotional and functional centre of this build

This is the question that triggered the whole project ("How the hell do I know how much I need per month 😬😵‍💫"), so it gets the most detail and the most evidence here, and it should get the most design care in the product.

### Why this question is so hard for a lay person
It asks someone to (a) imagine a future self and lifestyle they've never had to price up before, (b) do so in absolute £ terms with no reference point, and (c) get it "right" with no way to check their answer. Every calculator that just presents an empty "target income" field is asking the user to fail at (a)–(c) before they can even start. **The single most important design decision in this whole product is to never show that empty field.**

### The evidence, combined into one recommendation

1. **PLSA Retirement Living Standards as the default anchor.** Published annually by the PLSA with Loughborough University, these are the UK's most recognisable, official, jargon-free income benchmarks:
   - **Minimum:** £13,400/yr single (£1,117/mo) — covers all needs, no car, one UK-based week's holiday a year.
   - **Moderate:** £31,700/yr single (£2,642/mo) — a car, one 2-week European holiday a year.
   - **Comfortable:** £43,900/yr single (£3,658/mo) — three-week holiday, kitchen/bathroom replaced every 10–15 years, £1,500/yr clothing budget.
   - Critical caveat we must surface honestly, not bury: these figures assume the retiree **owns their home outright** (no rent/mortgage) and **exclude care costs**. Since our user's plan includes a house sale, this is directly relevant — we should ask "will you own your home outright by then?" right alongside the preset picker, and adjust or flag accordingly.
   - Sources: [PLSA Retirement Living Standards — Pension Bible](https://www.pensionbible.co.uk/guides/plsa-retirement-living-standards), [PLSA £44k comfortable income](https://adv.portfolio-adviser.com/plsa-says-44k-retirement-income-now-needed-to-be-comfortable/), [Loughborough University 2025 update](https://www.lboro.ac.uk/news-events/news/2025/june/cost-of-retiring-falls-calculated-loughborough/)

2. **Replacement-rate default as a second, personalised anchor.** 70–80% of current net income is the standard rule of thumb (some advisers go to 85%), on the logic that commuting costs, pension contributions, and (for her) a mortgage fall away. We can compute this instantly from information we already need to collect elsewhere (current income), so it costs nothing extra to offer as a fourth option.
   Source: [How to determine retirement income needed — T. Rowe Price](https://www.troweprice.com/personal-investing/resources/insights/how-to-determine-amount-of-income-you-will-need-at-retirement.html)

3. **Bottom-up budget builder as the "proper" option for anyone willing to invest 5 more minutes.** MoneyHelper's Budget Planner pattern — real income minus real outgoings, categorised, irregular costs annualised — is the most accurate method precisely because it doesn't ask her to imagine anything; it asks her to look things up. Offered as an optional path, not the default, because it is real work.

4. **Nutmeg's "ask the goal first, not last" ordering** — this problem should be tackled at the *start* of the journey, immediately after the absolute basics (age, retirement age), not after a long slog through every asset she owns. Get to "what do you want your life to look like" before "here's every account you have" — motivation and clarity come first, bookkeeping comes second.

### The actual screen design (this is the most important screen in the product)

**Screen: "What does 'enough' look like for you?"**

Layout: four large, tappable cards in a vertical stack (mobile-first), each showing a lifestyle name, one evocative sentence, and — crucially — the **£-per-month number already converted and displayed up front**, so this is a recognition task ("that one feels like me") not a recall task ("what number should I type").

```
┌─────────────────────────────────────────────┐
│  🏡  A simple, comfortable life               │
│  Bills covered, food, one UK holiday a year.  │
│  About £1,100/month                           │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  🚗  A comfortable life with some treats      │
│  A car, one overseas holiday a year.          │
│  About £2,650/month                           │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  ✈️  A very comfortable life                  │
│  Longer holidays, new kitchen when you need   │
│  it, no real money worries.                   │
│  About £3,650/month                           │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  🧮  About the same as I live on now          │
│  We'll work this out from your current        │
│  income — most people need roughly            │
│  three-quarters of what they earn now.        │
│  About £[X]/month, based on what you told us  │
└─────────────────────────────────────────────┘

  Not sure, or want to be precise?
  → "Let's build your budget together" (opens the
     bottom-up budget tool — 5 minutes, uses your
     real spending)

  💬 Ask your assistant: "I don't know — what's
     realistic for me?" — the AI assistant looks at
     her age, income, and assets already entered and
     replies conversationally, e.g. "Based on what
     you've told me, most people in a similar
     position choose 'comfortable with some treats'
     — want me to set that as your starting point?"
     with a single tap to accept (see §7/AI assistant
     design below) — this never auto-applies without
     her tapping to confirm.
```

Whichever card she picks becomes a slider she can immediately fine-tune (dual slider + number pattern, §3) rather than a locked-in answer — so the "decision" is really "pick a reasonable starting point," and the product should say so explicitly: *"This is just a starting point — you can change it any time."* This directly defuses the anxiety of "getting it wrong," which is the actual emotional blocker, not the arithmetic.

**Why this design and not a blank field or a single slider from £0:** a bare slider from £0–£5,000/month has no anchor and reintroduces exactly the "how would I know" problem non-verbally. Named, described lifestyle presets with the numbers pre-computed remove the guesswork while still leaving her in control.

**Recommended synthesis:** four parallel doors into one target-income number — three PLSA presets, one replacement-rate default — plus an optional bottom-up budget builder, plus a conversational escape hatch to the AI assistant, all converging on a single editable £/month figure. Never leave her facing an empty box.

---

## 3. Slider & input UX best practice

- **Sliders are for exploration, not precision.** Good for "what if I retired 2 years later"; bad for entering an exact known figure (e.g. today's actual pension pot value from a statement). Rule: **known/precise value → number field; "what if"/assumption → slider.**
  Source: [Designing The Perfect Slider UX — Smashing Magazine](https://www.smashingmagazine.com/2017/07/designing-perfect-slider/)
- **Dual input pattern (slider + editable number box) is the gold standard** — Airbnb's price filter, Figma's drag+type fields. Always pair a slider with a directly-editable, keyboard-accessible number field showing the live value.
  Source: [Slider UI design — Setproduct](https://www.setproduct.com/blog/slider-ui-design)
- **Accessibility must-haves:** W3C ARIA APG slider pattern (`role="slider"`, `aria-valuemin/max/now/text`, full keyboard support); minimum **44×44pt** touch target for the thumb; `inputmode="numeric"` + pattern filtering on the paired number field rather than relying on bare `type="number"`; `aria-label`/`aria-describedby` for labels and hints; test with a screen reader on a touch device.
  Sources: [MDN: ARIA slider role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/slider_role), [Atomic Accessibility: number input](https://www.atomica11y.com/accessible-design/input-number/), [W3C ARIA APG patterns](https://www.w3.org/WAI/ARIA/apg/patterns/)
- **Sensible ranges:**
  - **Age sliders:** 1-year steps; retirement age roughly current-age→75; "plan to age" roughly current-age→100.
  - **Money sliders:** non-linear step scale (e.g. £10 steps to £500, £25 to £2,000, £100 beyond) so a drag feels equally useful across the whole range; snap to round numbers.
  - Never show decimal precision to a lay reader; round pot/income projections to the nearest £100–£1,000.
- **Live-update, not a recalculate button.** The entire value of a slider is instant feedback; debounce (~100-150ms) if needed, but never require a click to see the effect.
- **Anchoring bias:** default slider positions measurably anchor the final answer. Don't default to the low extreme (biases toward under-saving) — default to a research-backed midpoint (e.g. default retirement age = State Pension age) and label it as a "typical starting point, adjust as needed."
- **False precision danger:** a slider outputting "£1,847.32/month" reads as spuriously exact for a 20+ year projection. Always round and pair with a visible "this is an estimate" caveat.
  General source: [Calculator Design: UX Best Practices for Fintech](https://webuild.io/calculator-ux-design-for-fintech/)

---

## 4. Progressive disclosure & guided walkthroughs

- **One-question-per-screen wins on completion, decisively.** Typeform's 2024 data (2.6M forms, 568M submissions): **47.3%** completion for one-question-at-a-time vs **21.5%** industry average. One-question flows lift completion **15–40%** generally.
  Source: [The Science Behind Conversational Form Completion Rates](https://gnosari.com/blog/conversational-completion-rates)
- **But** surveys over ~6 questions still drop below 50% completion even in conversational format — **group related low-stakes factual fields** (age, retirement age together); reserve true one-at-a-time pacing for the decisions that matter most (the target-income choice above all).
  Source: [Typeform: average completion rate](https://help.typeform.com/hc/en-us/articles/360029615911-What-s-the-average-completion-rate-of-a-typeform)
- **Wizard → dashboard, not wizard → dead end.** Boldin's pattern (a few minutes of essentials → immediate summary graphic → optional deep-dive) is the right shape for our whole-picture scope: get to "here's your picture" fast with sensible defaults on the less-critical assets, then let her refine each one (the two pensions, house sale timing, business cash, cash ISA) at her own pace.
- **Contextual disclosure beats fixed linear onboarding:** ~53% completion for linear vs ~75% for reveal-when-relevant. Since our user genuinely has five distinct asset types, ask "do you have income from X?" before showing X's detail fields, even though in her case the answer to all five is yes — the pattern still keeps each screen light.
  Source: [Progressive disclosure in UX — LogRocket](https://blog.logrocket.com/ux-design/progressive-disclosure-ux-types-use-cases/)
- **Save progress automatically, always.** 68% of financial-application abandonment happens without this. Since this is a single private user's own long-lived tool (not a one-off lead-gen form), autosave on every field and resume exactly where she left off is non-negotiable — there is no "submit" moment, only a living document.
  Source: [Fintech Onboarding UX — The Skins Factory](https://www.theskinsfactory.com/uiux-design-blog/fintech-onboarding-ux-design)
- **Product tours / coach marks:** use only for genuinely non-obvious interactions (e.g. "tap the assistant bubble for help," "drag here to see next year"). Driver.js (lightest) or Shepherd.js (better on small screens) — always skippable in one tap, never auto-replay.
  Sources: [10 Best JS Onboarding Libraries — Chameleon](https://www.chameleon.io/blog/javascript-product-tours), [Driver.js vs Intro.js vs Shepherd.js vs Reactour](https://inlinemanual.com/blog/driverjs-vs-introjs-vs-shepherdjs-vs-reactour/)

---

## 5. Explaining the maths to a non-expert

- **£-per-month beats percentages, decisively, for this audience.** UK average adult reading age is 9–11 (FCA's own benchmark); low-numeracy individuals are disproportionately swayed by *framing* over the number itself. "Aim for 75% income replacement" should always be shown as **"aim for about £X a month in your pocket."**
  Sources: [FCA Consumer Duty — consumer understanding](https://www.fca.org.uk/publications/good-and-poor-practice/consumer-understanding-good-practice-areas-improvement), [Low numeracy and financial well-being — PLOS One](https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0260378)
- **Frequency framing conveys risk more viscerally than percentages** ("1 in 5" feels riskier than "20%") — useful sparingly, when we genuinely want a risk to feel real rather than clinical (e.g. describing the "low" scenario), but should not replace £/month as our primary language.
  Source: [Numeracy and risk communication — eprints Soton](https://eprints.soton.ac.uk/452868/)
- **Inline "why does this matter?" expanders + worked examples**, collapsed by default. Show the actual arithmetic on demand in plain English: *"We take your target income (£X/month), subtract your State Pension and other guaranteed income (£Y/month), and work out how big a pot you'd need to cover the rest."*
- **"What changed?" deltas on every slider move.** *"Retiring at 67 instead of 65 adds about £180/month."* This is where the AI assistant's proposed changes should also speak — not just "here's a new number" but "here's what moved and why."
- **Low/mid/high bands, not Monte Carlo percentages — this is the settled approach for this build.** Raw Monte Carlo output ("87% probability of success") is a documented comprehension trap — even advisers report clients struggling with why a 10% "failure" chance is fine. We should compute the underlying model with proper variability (it's fine, even good, to use stochastic/scenario modelling under the hood — historical return sequences, inflation variation, house-sale timing uncertainty), but the UI must only ever show **three labelled outcomes: cautious / expected / optimistic**, each a concrete £-per-month figure, never a bare percentage or "success score."
  Sources: [Assessing Monte Carlo predictiveness — Kitces](https://www.kitces.com/blog/monte-carlo-models-simulation-forecast-error-brier-score-retirement-planning/), [Why Monte Carlo simulations get retirement risk wrong](https://edrempel.com/why-monte-carlo-simulations-get-retirement-risk-wrong/)
- **Never show false precision.** A 25-year-out projection shown as "£214,837" is a design bug; it should read "£215,000" or "around £210,000–£220,000."
  General: [Fan Chart (Wikipedia)](https://en.wikipedia.org/wiki/Fan_chart_(time_series))

---

## 6. Charts

**Priority order for this build:**

1. **The "gap" bar** — a simple two-bar comparison ("what you're on track for" vs "what you said you need"), in £/month, with the shortfall or surplus highlighted. The single most decision-relevant chart: answers "am I OK?" in one glance, zero interpretation required. This should be the very first thing she sees on the results screen.
2. **Stacked area chart of total pot/income sources over time** — given the whole-picture scope, this should stack the *sources*: Pension 1, Pension 2, State Pension, house-sale proceeds (as a step/injection at the sale year), business cash, cash ISA. This single chart tells the whole-picture story that no single-pot competitor tool can show. Keep to a maximum of 5 labelled layers with direct on-chart labels, not a legend, and cap the house-sale "injection" so it doesn't visually dwarf the steadier lines.
   Source: [What Is a Stacked Area Chart?](https://www.domo.com/learn/charts/stacked-area-chart)
3. **Low/mid/high banded projection** for the years-of-income-coverage view (§5) — three lines or a shaded band labelled "cautious / expected / optimistic," never raw percentiles.
4. **Waterfall (contributions vs growth vs tax relief) as an optional drill-down**, not a default view — more cognitively demanding than the above three.

**Avoid:** pie charts, 3D effects, more than ~3 simultaneous lines, unlabelled axes, Monte Carlo "spaghetti" charts (alarming and uninterpretable to a lay audience).

**Library recommendation: Nivo** for the primary charts, specifically because it meets **WCAG 2.1 AA out of the box** (ARIA + keyboard nav built in) — the right trade for a small number of charts on a small number of screens, given the whole point of this product is accessibility to a non-technical, potentially anxious single user. Recharts (~150KB, React-native API, far larger ecosystem) is the fallback if Nivo's bundle size (500KB+) becomes a real problem.
Sources: [Recharts vs Chart.js vs Nivo vs visx 2026](https://www.pkgpulse.com/guides/recharts-vs-chartjs-vs-nivo-vs-visx-react-charting-2026), [Best React chart libraries 2026 — LogRocket](https://blog.logrocket.com/best-react-chart-libraries-2026/)

---

## 7. Motivation & behaviour change (including the AI assistant design)

- **Loss aversion outperforms gain framing on average, but the effect is smaller than textbook behavioural economics suggests, and constant loss-framing risks tipping an already-anxious user into disengagement** — directly counter to this brief. Use it sparingly (e.g. once, in the cost-of-delay moment below), not as the product's overall voice.
  Sources: [Loss Aversion — InsideBE](https://insidebe.com/articles/loss-aversion/), [Framing Effects and Loss Aversion — ResearchGate](https://www.researchgate.net/publication/395555624_The_Impact_of_Framing_Effects_and_Loss_Aversion_on_Decision-making_Across_Health_Finance_and_Retirement_Domains)
- **Cost-of-delay, made concrete, is our single best "why act now" tool.** Not "compounding is powerful" but *"waiting 5 years to increase your saving means finding an extra £Y/month later to end up in the same place."* Always in £/month terms.
  Source: [The Long-Term Impact of Waiting to Save for Retirement](https://exencialwealth.com/resources/the-long-term-impact-of-waiting-to-save-for-retirement)
- **Future-self continuity (Hershfield et al., 2011) is the strongest lever in the literature: ~33% more allocated to retirement saving** after viewing an age-progressed image of oneself, ~double in a VR variant. We won't build a photo feature, but we should borrow the mechanism cheaply: name the plan after her ("Kirsten's retirement plan"), use warm human illustration rather than cold charts alone, and phrase results as "you at 68" rather than "the plan at year 15."
  Source: [Hershfield — NYU Stern](https://www.stern.nyu.edu/experience-stern/faculty-research/hershfield-retirement-savings)
- **Avoid shame/anxiety entirely.** No red "X," no failure grades, no judgmental copy ("you're not saving enough"). Neutral, forward-looking language only: "here's the gap, here's what closes it." Every bad-news number is paired with at least one small, concrete, achievable action.
- **Small-win nudges + escalation:** offer automatic small annual increases ("start small, increase automatically each year, change or cancel anytime") rather than asking for a single large commitment.

### The AI assistant — how it should behave (settled feature)

The assistant's job is to reduce the "what should I do?" cognitive load without ever taking control away from her. Concrete design rules, derived directly from the evidence above:

- **It reads her live figures** (current sliders, all five asset sources, her chosen target lifestyle) and can be asked, or can proactively suggest, in plain English: *"Based on what you've told me, increasing your monthly saving by £150 would close most of the gap by 68. Want me to set that?"*
- **It never silently changes a value.** Every suggestion renders as a preview (the affected slider visibly moves/highlights with a "proposed" state and the resulting new headline numbers shown) with two buttons: **"Use this"** and **"No thanks."** This satisfies the "tap to confirm" requirement and is essential for trust — an anxious user must never feel a number changed itself.
- **It speaks in the same register as the rest of the product** — £/month, no jargon, one suggestion at a time (not a list of five options, which reintroduces the overwhelm this whole project exists to solve).
- **It is the natural home for the "I don't know" escape hatch** from §2, and for "why does this matter?" explanations from §5 — rather than building two separate systems (static tooltips + a chat assistant), route both through the same conversational surface where it makes sense, with static inline tooltips reserved for simple jargon definitions.
- **It should proactively surface cost-of-delay and future-self framing** (this section) at moments of hesitation — e.g. if she's left a slider untouched for a while on the results screen, a gentle, once-only nudge rather than a recurring interruption.

### What the "next steps" area should contain
One sentence restating the gap → the single smallest lever to act on now (ideally proposed by the assistant, per above) → one clear, low-commitment action (e.g. "review your workplace pension contribution," or a link to book a free MoneyHelper/Pension Wise appointment for anything beyond the tool's scope) → confirmation that the plan is saved (it always is, automatically). No multi-CTA marketing page, no shame language.

---

## 8. Trust & tone

- **Target reading age: 9–11** (UK average adult reading age, FCA's own benchmark). Short sentences, common words, no unexplained acronyms, throughout every screen and every assistant message.
- **FCA Consumer Duty "Consumer Understanding" outcome (FG22/5, PRIN 2A.5)** is the right bar even though we're not a regulated firm: **plain and intelligible language**, **key information prominent and up front**, **avoid providing too much information at once** — i.e. progressive disclosure applied to writing, not just to screens.
  Source: [FCA — Consumer understanding: good practice](https://www.fca.org.uk/publications/good-and-poor-practice/consumer-understanding-good-practice-areas-improvement)
- **Jargon-busting glossary, inline not buried.** Tooltip definitions on first use of any term (SIPP, annuity, drawdown, tax-free lump sum, State Pension age), backed by a full glossary page — but see §7: prefer routing "explain this" requests through the assistant where a conversational answer would land better than a static tooltip.
  Source: [PensionBee pension glossary](https://www.pensionbee.com/uk/pensions-explained/pension-basics/pension-glossary)
- **"Your questions answered" written guide sections (settled feature) — placement and tone.** These should live *alongside* the calculator, not in a separate help centre she has to leave the tool to find — e.g. a persistent "Questions answered" tab/accordion visible from every screen, with a small number of warmly-written entries answering exactly the questions a first-time user has (*"What if I get this wrong?", "What counts as my State Pension?", "Do I need to include the house sale?", "What does 'comfortable' really mean?"*). Write these in first-person-plural, reassuring voice ("We know this feels like a lot — here's the short version"), matching the reading-age and plain-language standards above. Cross-link relevant guide entries from the tooltip/assistant layer so all three explanation surfaces (tooltip, assistant, guide) stay consistent rather than duplicating different explanations of the same thing.
- **Password gate, framed warmly, not like a bank login.** Since this is a single private user's personal data behind a simple password (not a multi-tenant product needing account recovery flows, 2FA, etc.), keep the gate to one plain screen — a password field and a short reassuring line ("Your figures, just for you — nobody else can see this") rather than security-vendor-style badges/lock icons that would feel clinical and slightly alarming for a personal tool.
- **Disclaimer placement — honest, not scary.** Short, plain, near the result: *"This is an estimate based on the assumptions above, not financial advice or a guarantee."* Never a wall of legal text, never at the top before she's seen anything useful.
- **Avoid false certainty everywhere**, in copy as much as charts: "could be worth around…" / "you might need…" over "will be" / "you need."

---

## Recommended screen-by-screen flow for our calculator

This is the concrete, opinionated design for *this build*, shaped around the settled decisions: single private user, password-gated; whole-picture scope (two pensions + State Pension + house sale + business cash + cash ISA); low/mid/high uncertainty; an AI assistant that proposes slider changes she confirms with a tap; written "your questions answered" guide content alongside the calculator; warm, reassuring tone throughout.

**Screen 0 — Password gate.**
One field, one reassuring line ("Your figures, just for you"), no security theatre (§8). Straight into the tool on success — no separate "login vs sign up" choice, since there is exactly one user.

**Screen 1 — Warm welcome (no inputs).**
One sentence naming the anxiety directly: *"Most people find this confusing — you don't need to know all the answers yet. We'll help you find them, one step at a time."* Single "Let's start" button. A small, non-intrusive mention that she can ask the assistant anything, anytime, sets up §7's escape hatch before she needs it.

**Screen 2 — The basics (grouped).**
Current age, target/likely retirement age (dual slider+number, default = State Pension age), current income (needed for the replacement-rate default on the next screen). Two to three low-anxiety factual fields together is fine here (§4) — save this grouping for genuinely low-stakes questions only.

**Screen 3 — "What does 'enough' look like for you?" — the target-income screen.**
This is the screen described in full in §2: four lifestyle cards (Minimum/Moderate/Comfortable PLSA presets + "about the same as now" replacement-rate default), each showing its £/month figure up front, plus a "let's build your budget together" link to the optional bottom-up tool, plus a visible "Ask your assistant" prompt for anyone who wants to talk it through instead of picking a card. Whichever she picks becomes an editable slider immediately, with explicit copy that it's a starting point, not a commitment. **This screen gets the most design and copywriting attention in the whole product** — it is the answer to the exact question that motivated this build.

**Screen 4 — Your whole picture (the five asset sources).**
One screen per source, each pre-framed with a short "why we're asking" line, in this order (most certain/simple → most speculative, to build confidence before the harder inputs):
1. State Pension — auto-estimated with an easy link/override to her actual government forecast.
2. Pension 1 and Pension 2 — current value + (if still contributing) monthly contribution, dual slider+number, non-linear step scale (§3).
3. Cash ISA — current balance, ongoing contribution if any.
4. Business cash earmarked for retirement — current balance, with a plain-English note that this is more flexible/accessible than a pension and can be drawn earlier if needed.
5. House sale — expected proceeds and expected age/year of sale (a slider on *when*, a number on *how much*, both editable), with the PLSA caveat surfaced explicitly here: *"The 'enough' figures on the last screen assume you own your home outright — this is where that assumption comes from."*
Each source is skippable/revisable later; autosave throughout (§4). Inline jargon tooltips on every term (§8).

**Screen 5 — Your results (the payoff moment).**
Ordered top-to-bottom by decision-relevance (§6):
1. The **gap bar** — on track / not on track, in £/month, the very first thing seen.
2. The **stacked income-sources chart over time** — all five sources shown as one whole-picture story, with the house-sale injection visible at its year.
3. A **low/mid/high banded view** of how long the money lasts under cautious/expected/optimistic scenarios (§5) — never a raw percentage.
4. A one-line "how we worked this out," with a collapsed "why does this matter?" expander showing the actual arithmetic (§5).
5. A **live "what if" slider panel** (retirement age, monthly saving, house-sale timing) with instant deltas ("retiring 2 years later adds about £X/month") — where cost-of-delay framing (§7) does its work.
6. The **assistant panel**, offered here prominently: *"Want me to suggest a change that helps?"* — proposes one specific slider move at a time, previewed before being applied, confirmed with a single tap (§7).

**Screen 6 — Next steps.**
One sentence restating the gap → the single smallest lever to act on (ideally the assistant's proposal from Screen 5) → one clear, low-commitment action → confirmation the plan is saved automatically. No multi-CTA marketing page, no shame language (§7).

**Throughout, on every screen:** a persistent, unobtrusive "Questions answered" tab (§8) with a handful of warmly-written FAQ entries relevant to that screen; a persistent, low-key assistant entry point; autosave on every field with no explicit save action; live recompute on every slider; every number rounded (§3/§5); every uncertain statement hedged honestly ("could be," "around") rather than stated as fact (§8).

---

## Master source list

- [MoneyHelper — Tools and calculators](https://www.moneyhelper.org.uk/en/tools-and-calculators)
- [MoneyHelper — Pension calculator](https://www.moneyhelper.org.uk/en/pensions-and-retirement/pensions-basics/pension-calculator)
- [MoneyHelper — Budget planner](https://www.moneyhelper.org.uk/en/everyday-money/budgeting/budget-planner)
- [MoneyHelper — Pension Wise](https://www.moneyhelper.org.uk/en/pensions-and-retirement/pension-wise)
- [PensionBee — What happens in a Pension Wise appointment?](https://www.pensionbee.com/uk/blog/pension-wise-appointment)
- [PensionBee — Retirement planning tools](https://www.pensionbee.com/uk/retirement/retirement-planning-tools)
- [PensionBee — Pension glossary](https://www.pensionbee.com/uk/pensions-explained/pension-basics/pension-glossary)
- [Guiide reviews — Trustpilot](https://uk.trustpilot.com/review/guiide.co.uk)
- [10 Best UK Pension Calculators & Retirement Planners (2026 Review)](https://pension-planner.uk/)
- [PLSA Retirement Living Standards — Pension Bible](https://www.pensionbible.co.uk/guides/plsa-retirement-living-standards)
- [PLSA £44k comfortable retirement — Portfolio Adviser](https://adv.portfolio-adviser.com/plsa-says-44k-retirement-income-now-needed-to-be-comfortable/)
- [Loughborough University — 2025 Retirement Living Standards update](https://www.lboro.ac.uk/news-events/news/2025/june/cost-of-retiring-falls-calculated-loughborough/)
- [T. Rowe Price — how to determine retirement income needed](https://www.troweprice.com/personal-investing/resources/insights/how-to-determine-amount-of-income-you-will-need-at-retirement.html)
- [Vanguard — Retirement income calculator](https://investor.vanguard.com/tools-calculators/retirement-income-calculator)
- [Aviva — My retirement planner](https://www.aviva.co.uk/retirement/tools/my-retirement-planner/)
- [Standard Life — Retirement calculator](https://www.standardlife.co.uk/retirement/tools/retirement-calculator)
- [Legal & General — Retirement income calculator](https://www.legalandgeneral.com/retirement/retirement-income-calculator/)
- [Boldin review — White Coat Investor](https://www.whitecoatinvestor.com/newretirement-review-online-retirement-calculator/)
- [Boldin review — Well Kept Wallet](https://wellkeptwallet.com/newretirement-review/)
- [Fidelity Retirement Score](https://www.fidelity.com/calculators-tools/fidelity-retirement-score-tool)
- [6 Best Free Monte Carlo Retirement Simulation Calculators](https://www.thewaystowealth.com/free-monte-carlo-simulation-calculator/)
- [Kitces — Assessing performance predictiveness of Monte Carlo models](https://www.kitces.com/blog/monte-carlo-models-simulation-forecast-error-brier-score-retirement-planning/)
- [Ed Rempel — Why Monte Carlo simulations get retirement risk wrong](https://edrempel.com/why-monte-carlo-simulations-get-retirement-risk-wrong/)
- [Fan chart (Wikipedia)](https://en.wikipedia.org/wiki/Fan_chart_(time_series))
- [Oreate AI — Beyond the Line: Visualizing Uncertainty With Fan Charts](https://www.oreateai.com/blog/beyond-the-line-visualizing-uncertainty-with-fan-charts/32df9b77a18b863ca551bc31d9e83c8b)
- [Smashing Magazine — Designing The Perfect Slider UX](https://www.smashingmagazine.com/2017/07/designing-perfect-slider/)
- [Setproduct — Slider UI design: Single, range, anatomy, and accessibility](https://www.setproduct.com/blog/slider-ui-design)
- [MDN — ARIA slider role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/slider_role)
- [Atomic Accessibility — Number input](https://www.atomica11y.com/accessible-design/input-number/)
- [W3C ARIA Authoring Practices Guide — Patterns](https://www.w3.org/WAI/ARIA/apg/patterns/)
- [webuild.io — Calculator Design: UX Best Practices for Fintech](https://webuild.io/calculator-ux-design-for-fintech/)
- [Gnosari — The Science Behind Conversational Form Completion Rates](https://gnosari.com/blog/conversational-completion-rates)
- [Typeform Help Centre — average completion rate](https://help.typeform.com/hc/en-us/articles/360029615911-What-s-the-average-completion-rate-of-a-typeform)
- [LogRocket — Progressive disclosure in UX design](https://blog.logrocket.com/ux-design/progressive-disclosure-ux-types-use-cases/)
- [Chameleon — 10 Best JS Onboarding Libraries for Product Tours](https://www.chameleon.io/blog/javascript-product-tours)
- [Inline Manual — Driver.js vs Intro.js vs Shepherd.js vs Reactour](https://inlinemanual.com/blog/driverjs-vs-introjs-vs-shepherdjs-vs-reactour/)
- [The Skins Factory — Fintech Onboarding UX](https://www.theskinsfactory.com/uiux-design-blog/fintech-onboarding-ux-design)
- [FCA — Consumer understanding: good practice and areas for improvement](https://www.fca.org.uk/publications/good-and-poor-practice/consumer-understanding-good-practice-areas-improvement)
- [PLOS One — Low numeracy and poor financial well-being](https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0260378)
- [eprints Soton — Numeracy and communication of financial information](https://eprints.soton.ac.uk/452868/)
- [NYU Stern — Hershfield: age-progressed renderings & retirement savings](https://www.stern.nyu.edu/experience-stern/faculty-research/hershfield-retirement-savings)
- [InsideBE — Loss Aversion](https://insidebe.com/articles/loss-aversion/)
- [ResearchGate — Framing Effects and Loss Aversion across Health, Finance, Retirement](https://www.researchgate.net/publication/395555624_The_Impact_of_Framing_Effects_and_Loss_Aversion_on_Decision-making_Across_Health_Finance_and_Retirement_Domains)
- [Exencial Wealth — The Long-Term Impact of Waiting to Save for Retirement](https://exencialwealth.com/resources/the-long-term-impact-of-waiting-to-save-for-retirement)
- [pkgpulse.com — Recharts vs Chart.js vs Nivo vs visx (2026)](https://www.pkgpulse.com/guides/recharts-vs-chartjs-vs-nivo-vs-visx-react-charting-2026)
- [LogRocket — Best React chart libraries in 2026](https://blog.logrocket.com/best-react-chart-libraries-2026/)
- [Domo — What Is a Stacked Area Chart?](https://www.domo.com/learn/charts/stacked-area-chart)
