# UK Contractor Tax & Pension Planning — Research Notes (2026/27 tax year)

**Compiled:** 2 August 2026. All figures below are for the tax year **6 April 2026 – 5 April 2027** unless stated otherwise. Sourced from gov.uk/HMRC where possible, cross-checked against ICAEW, ContractorUK, IT Contracting, Qdos, and specialist contractor accountancy firms. Anywhere I could not get a primary (gov.uk/HMRC) source, or the figure comes only from secondary commentary, it is flagged **[UNCONFIRMED / secondary source only]**.

**Person this is being built for:** 51-year-old woman, contracting for Jack & Jones (part of Bestseller A/S) via her own limited company; ~£30k across an old Aviva pension and a People's Pension; house ~£400k with ~£120k mortgage; expects business cash at retirement; non-financial, uses an accountant.

---

## 1. IR35 / Off-Payroll Working — THE CRUX QUESTION

### 1.1 Who determines status, and does it apply to her?

Since **6 April 2021**, for engagements with **medium or large private-sector clients**, the **client** — not the contractor — determines IR35 (off-payroll working, "Chapter 10") status, and must issue the contractor a **Status Determination Statement (SDS)** giving the conclusion and the reasons. [gov.uk – Off-payroll working rules](https://www.gov.uk/guidance/check-employment-status-for-tax); [gov.uk ESM10011](https://www.gov.uk/hmrc-internal-manuals/employment-status-manual/esm10011)

**Bestseller A/S (Jack & Jones's parent) is unambiguously a large private-sector group** — it will be well above even the *raised* small-company thresholds due to take effect from April 2026 (turnover threshold rising from £10.2m to £15m, balance sheet from £5.1m to £7.5m; only 2 of 3 tests, including the unchanged 50-employee test, need to be met to count as "small"). [ContractorUK](https://www.contractoruk.com/news/0016731ir35_taxman_just_made_small_company_changes_timeline_clearer.html); [CXC Global](https://www.cxcglobal.com/blog/risk-compliance-and-law/ir35-2026-small-company-thresholds/); [Kingsbridge](https://www.kingsbridge.co.uk/blog/contractors/ir35/ir35-small-company-threshold-changes-2026/)

**Conclusion: she does not self-determine her IR35 status.** Bestseller (or the agency she contracts through, if there is one) must have issued her an SDS. **She should ask her agency/accountant to confirm the current SDS says "inside" or "outside" — this single document changes which sections of a pension/tax calculator apply to her, so the tool must ask this as a gating question rather than assume.** [FLAG: we do not know her actual determination — this must be captured as an input, not assumed.]

If she disagrees with the determination, she has a statutory right to challenge it with the client, who must respond within 45 days. [gov.uk ESM10006](https://www.gov.uk/hmrc-internal-manuals/employment-status-manual/esm10006)

### 1.2 What "inside" vs "outside" means for take-home pay

- **Outside IR35**: she is genuinely self-employed for tax purposes. Her limited company invoices the client, pays Corporation Tax on profit, and she extracts income via salary + dividends (or leaves it in the company, incl. pension contributions) — see Sections 3–4. This is the tax-efficient scenario.
- **Inside IR35**: HMRC treats the engagement as disguised employment. Since 2021, for a large client like Bestseller, the **fee-payer** (usually the recruitment agency, or the client directly if there's no agency) must operate **PAYE income tax and employee NI**, and account for **employer NI and the Apprenticeship Levy**, on a "**deemed direct payment**" calculated from the contract value — broadly the full contract value minus VAT, minus direct material costs, minus a narrow set of employment-type expenses. [gov.uk ESM9070](https://www.gov.uk/hmrc-internal-manuals/employment-status-manual/esm9070); [ContractorCalculator](https://www.contractorcalculator.co.uk/how_calculate_process_deemed_direct_payments.aspx)
- The **net** amount (after tax, employee NI, and after employer NI/Levy have already reduced the pot) is what reaches her limited company. Take-home is materially lower than outside-IR35 for the same contract rate — commonly cited as a 20–30% drop after employer NI, employee NI and income tax, compared with the salary+dividend route. [Tax Handbook](https://taxhandbook.co.uk/ir35-explained); [ContractorUK calculators](https://www.contractoruk.com/calculators)

### 1.3 THE PENSION QUESTION — precise and flagged

This is the single most important fact for deciding whether "employer pension contributions from the company" is valid advice for her, so treat the following as load-bearing and get it accountant-confirmed before shipping any copy that assumes it.

**If outside IR35:** No complication. Her limited company has ordinary pre-tax trading profit, and employer pension contributions work exactly as described in Section 4 — this is the strongest lever available to her.

**If inside IR35, via her own limited company (not an umbrella):**
- The fee-payer deducts income tax and NI **before** the money ever reaches her company. By the time her company receives the net deemed payment, it has already been taxed as if it were her personal salary — there is no pre-tax "company profit" left from that contract to make a fresh employer pension contribution into.
- The only way an *employer* pension contribution could be made gross (i.e. before tax/NI) is if the **fee-payer itself** agrees to divert part of the contract value directly into a registered pension scheme as part of calculating the deemed payment — functionally like a salary-sacrifice arrangement operated by the agency. This is **legally possible but not standard practice for agency-run deemed payments**, and is **entirely at the fee-payer's discretion** — there is no obligation on the client or agency to offer it. [PensionBee](https://www.pensionbee.com/uk/pensions-explained/pension-rules/how-much-tax-do-you-pay-inside-ir35); [Pension Bible](https://www.pensionbible.co.uk/guides/pension-ir35)
- **[FLAG — genuinely unclear without her paperwork]**: Some contractor accountants describe employer pension contributions as still possible "from the PSC" inside IR35 by treating them as an allowable business expense that reduces the deemed payment calculation (Step 3 deductions) — but the step-by-step gov.uk guidance on deemed direct payments (ESM9070) restricts Step 3 to expenses that would have been deductible under ITEPA ss.336–339 (travel/subsistence-type employment expenses), **not** general employer pension contributions. I could not find a primary HMRC source confirming a PSC can unilaterally divert part of a fee-payer-taxed deemed payment into a gross pension contribution after the fact. Treat any "yes, your PSC can still make employer pension contributions inside IR35" claim as **needing confirmation from her accountant against her specific contract/fee-payer arrangement**, not as a default assumption in the tool.
- What **is** safely still available inside IR35: **personal pension contributions** from her own (already taxed) income, via relief-at-source into a SIPP or personal pension. Relief is based on relevant UK earnings, which include the deemed employment income, up to 100% of relevant earnings or £60,000 (the Annual Allowance), whichever is lower. [ITContracting](https://www.limitedcompanyhelp.com/paying-into-a-pension-from-your-limited-company/)

**If inside IR35, via an umbrella company (not her own limited company):**
- The umbrella is her actual employer. Umbrella companies routinely offer **salary sacrifice into a pension**, because they are a genuine employer with normal PAYE/pension infrastructure and (after 12 weeks) auto-enrolment duties. Sacrificing salary into a pension via the umbrella removes that slice from **both** income tax and **employee + employer NI**, which is a genuine and reliable saving — e.g. sacrificing £10,000 of a £40,000 umbrella salary was cited as saving roughly £2,000 income tax + £800 employee NI **[UNCONFIRMED precise figures — illustrative example from a secondary source, not gov.uk]**. Not all umbrellas offer this, some charge a processing fee, and pay cannot fall below National Minimum Wage after sacrifice. [ContractorUK](https://www.contractoruk.com/umbrella_company/salary_sacrifice_pensions_and_umbrella_companies.html); [IT Contracting](https://www.itcontracting.com/salary-sacrifice-umbrella-contractors/); [FCSA](https://www.fcsa.org.uk/understanding-salary-sacrifice-pensions-for-umbrella-employees/)

**Bottom line for the app's headline advice:**
| Her situation | Does "employer pension contributions are the best lever" apply? |
|---|---|
| Outside IR35, own Ltd co | **Yes, cleanly** — Section 4 applies in full |
| Inside IR35, own Ltd co, fee-payer won't do pension deduction (most common) | **No** — only personal/relief-at-source contributions from taxed income are reliably available |
| Inside IR35, moved to an umbrella | **Yes, via salary sacrifice** — different mechanism, same broad tax saving, but she'd need to close/dormant her Ltd co for that engagement |

**This must be an explicit gate in the calculator: ask her IR35 status (and, if inside, whether she's paid via her own Ltd co or an umbrella) before showing the "pay it into a pension, not as a dividend" recommendation.**

---

## 2. Limited Company vs Umbrella vs Sole Trader

| | Limited company (outside IR35) | Umbrella company (inside IR35) | Sole trader |
|---|---|---|---|
| Tax mechanism | Corporation Tax on profit, then salary + dividends | Full PAYE + employee/employer NI on gross | Income Tax + Class 4 NI on profit |
| Pension route | Employer contributions from pre-tax profit (best lever) | Salary sacrifice (good, if offered) | Personal contributions only, relief-at-source |
| Admin | Companies House + HMRC filings, own accountant | Minimal — umbrella runs payroll | Self Assessment only |
| IR35 relevance | Only viable if genuinely outside IR35 | Standard route when inside IR35 | Not compatible with an inside-IR35 determination for a specific engagement — HMRC would still look through to employment status for that engagement |
| 2026/27 Class 2/4 NI (sole trader) | n/a | n/a | Class 2 voluntary £3.50/week [UNCONFIRMED figure, secondary source]; Class 4 at 6% on profits £12,570–£50,270, 2% above |

**Take-home comparison, illustrative only [UNCONFIRMED precise £ — figures vary by calculator and were not independently rebuilt here; use a proper contractor take-home calculator, e.g. ContractorUK's or IT Contracting's, for exact numbers at her actual rate]:**
- Outside IR35 via Ltd co is consistently cited as returning **more** take-home than the same contract inside IR35 via umbrella, because salary+dividends are taxed more lightly than full PAYE — though the gap has narrowed since the April 2026 dividend tax rise (Section 3).
- At £60k and £90k contract income specifically, I was not able to pull verified worked figures from a primary source in this pass — recommend running her actual numbers through [ContractorUK's calculators](https://www.contractoruk.com/calculators) or [IT Contracting's calculators](https://www.itcontracting.com/calculators/) rather than relying on generic averages, since her personal allowance taper, marginal relief band, and pension contributions will all shift the answer.

Sources: [ContractorUK take-home calculator](https://www.contractoruk.com/umbrella_company_take_home_pay_calculator); [DASA Umbrella](https://dasa-umbrella.co.uk/knowledgebase/umbrella-company-vs-sole-trader-as-a-contractor/); [IT Contracting](https://www.itcontracting.com/calculators/)

---

## 3. Salary / Dividend Split (outside IR35, own limited company)

**Recommended 2026/27 structure, per multiple contractor accountancy firms:**
- **Salary: £12,570/year** (the Primary Threshold) — commonly cited as the most tax-efficient level for 2026/27. [1st Formations](https://www.1stformations.co.uk/blog/tax-efficient-directors-salary-and-dividends/); [ContractorUK](https://www.contractoruk.com/news/what-is-a-tax-efficient-salary_2026-27-limited-company-director)
- **Why £12,570 and not lower:** it fully uses her Personal Allowance, and — critically for her — it guarantees a **State Pension qualifying year** (see Section 7).
- **Why not higher:** above £12,570, employee NI (8%) and employer NI (15% above the £5,000 secondary threshold) start eating into the saving relative to dividends.
- **Employment Allowance caveat — important for her:** the Employment Allowance (£10,500 for 2026/27) offsets employer NI, but **a company with a single director and no other employee paid above the secondary threshold cannot claim it**. [ICAEW](https://www.icaew.com/insights/tax-news/2025/jul-2025/single-director-companies-and-the-employment-allowance); [ITContracting](https://www.itcontracting.com/employment-allowance/) — if she runs her company solo (likely, as a contractor), assume **no Employment Allowance** unless she confirms otherwise with her accountant (e.g. if she employs a spouse).
- **Dividends** on top of salary: first **£500/year is tax-free** (dividend allowance, unchanged for 2026/27); above that, **10.75%** in the basic-rate band (up to £50,270 total income), **35.75%** in the higher-rate band (£50,271–£125,140), **39.35%** additional rate. **These basic/higher rates rose 2 percentage points from April 2026** (Autumn Budget 2025) — a genuine, well-corroborated policy change, not a typo: [ICAEW](https://www.icaew.com/insights/tax-news/2025/nov-2025/budget-taxes-on-property-savings-and-dividends-increased); [Deloitte TaxScape](https://taxscape.deloitte.com/insights/article/autumn-budget-2025.aspx); [Clive Owen LLP](https://www.cliveowen.com/2026/05/taxation-of-dividends-2026-27-uk/)
- **Corporation Tax**: 19% small profits rate on profits ≤£50,000; 25% main rate on profits >£250,000; marginal relief tapers the effective rate between these (commonly quoted effective marginal rate ~26.5% on the slice £50k–£250k). Rates/thresholds unchanged for 2026/27 [gov.uk-sourced summary via secondary commentary — I could not load the primary gov.uk corporation tax rates page directly in this pass (404); figures cross-checked across 3 independent accountancy sources and are consistent]. Thresholds halve if she has an "associated company."

**Worked illustration (salary £12,570, rest as dividends, single-director co, no Employment Allowance):**
- Salary £12,570 → no employee NI (below Primary Threshold... actually AT the threshold, negligible), employer NI on the £7,570 above the £5,000 secondary threshold at 15% ≈ £1,136 employer NI cost to the company.
- Salary is a deductible business expense, saving Corporation Tax on it.
- Remaining profit after salary + employer NI is taxed at 19%/25%/marginal rate, then distributed as dividends taxed at 10.75%/35.75%/39.35% after the £500 allowance.

[FLAG: I have not rebuilt a full worked £ table for her specific contract rate here — that's a calculator job, not a research-note job. The rates/thresholds above are what the calculator should encode.]

---

## 4. Employer Pension Contributions vs Dividends — the key lever (outside IR35 only — see Section 1 gate)

### 4.1 Mechanics
- The company pays into a registered pension scheme **as the employer**, directly from company funds, before the profit is subject to Corporation Tax.
- Contributions are **not limited by her salary** (unlike personal contributions, which are capped at 100% of relevant UK earnings) — a company can make a large employer contribution even against a modest £12,570 salary, provided it passes the "wholly and exclusively" test.
- Not subject to employee or employer NI at all (unlike salary).

### 4.2 The "wholly and exclusively" test (HMRC BIM46030 / BIM46035)
- A pension contribution by an employer is an allowable deduction **"unless there is a non-trade purpose for the payment."** [gov.uk BIM46030](https://www.gov.uk/hmrc-internal-manuals/business-income-manual/bim46030); [gov.uk BIM46035](https://www.gov.uk/hmrc-internal-manuals/business-income-manual/bim46035)
- For a controlling director (her situation), HMRC's test is whether the **total remuneration package** (salary + pension + any other benefits) is comparable to what an unconnected employee doing work of similar value would receive — not whether the pension contribution in isolation looks large. An excessive *total* package is the red flag, not the pension contribution specifically.
- In practice, for a genuine one-person contracting company, employer pension contributions are routinely accepted by HMRC and by contractor accountants as an allowable expense, provided the business is genuinely profitable enough to afford them and there's no other obvious "non-trade purpose" (e.g. contributions timed suspiciously around cessation of trade — see BIM46040).

### 4.3 Annual Allowance & carry forward
- **Annual Allowance: £60,000** for 2026/27 (covers employer + personal contributions combined, across all her pensions). [gov.uk](https://www.gov.uk/tax-on-your-private-pension/annual-allowance)
- **Carry forward**: unused allowance from the previous **3 tax years** (2023/24, 2024/25, 2025/26) can be added, provided she was a member of a registered pension scheme in each of those years (she has been, via Aviva/People's Pension) — **does not require having contributed**, just being enrolled. Earliest year's allowance is used first. Employer contributions are not capped by her earnings, so in principle up to £240,000 (4 years × £60k) could be contributed in one year if the company has the cash and carry-forward is fully available — subject to her actually being a scheme member throughout. [Royal London technical guidance](https://adviser.royallondon.com/technical-central/pensions/contributions-and-tax-relief/carry-forward/) — **she should ask her pension providers/accountant to confirm her exact unused allowance for each of the 3 carry-forward years before planning a large one-off contribution.**
- **Tapered Annual Allowance** only affects her if threshold income >£200k and adjusted income >£260k — almost certainly not relevant at her income level, but worth a one-line check with her accountant if a bumper year occurs. [gov.uk](https://www.gov.uk/tax-on-your-private-pension/annual-allowance)

### 4.4 Worked comparison: £10,000 surplus company profit — dividend vs pension

**Route A: Take as dividend**
1. £10,000 profit is first subject to Corporation Tax. At the small profits rate (19%, if total profit ≤£50k) → £1,900 CT, leaving £8,100 to distribute as dividend. At marginal/main rate (up to 25%) → as little as £7,500 left to distribute.
2. That dividend is then taxed in her hands: assuming she's already a higher-rate taxpayer (likely, once salary + other dividends are counted) — **35.75%** dividend tax on the £8,100 → £2,896 tax, leaving **≈£5,204 in her pocket** from the original £10,000 of profit.
3. If she's still a basic-rate payer on that slice, dividend tax is **10.75%** → £8,100 × 89.25% ≈ **£7,229 in her pocket**.

**Route B: Pay into pension**
1. The full £10,000 is paid by the company into her pension **before** Corporation Tax is calculated on it — it's a deductible expense, so it also **saves the Corporation Tax** that would otherwise have applied (up to £1,900–£2,500 depending on her marginal CT rate). Net cost to the company of getting £10,000 into her pension is effectively the £10,000 itself, but the company would otherwise have paid CT on it if extracted as dividend instead — so relative to Route A, the company keeps ~£1,900–£2,500 that would have gone to HMRC as Corporation Tax.
2. The **full £10,000** lands in her pension pot — no income tax, no NI, no dividend tax at the point of contribution.
3. She only pays tax later, on withdrawal in retirement, and even then **25% is tax-free (Pension Commencement Lump Sum)**, with the rest taxed as income at whatever her marginal rate is in retirement — very likely basic rate (20%) or even within her Personal Allowance, since contractors typically have lower income in retirement than in their peak earning years.

**Net outcome comparison:**
- Dividend route (higher-rate case): **≈£5,204** net, taxed once more (as dividend) — no further tax due later.
- Pension route: **£10,000** invested and grows tax-free until retirement; assuming eventual withdrawal at 20% income tax on the taxable 75% (the other 25% tax-free): net eventual value ≈ £10,000 × (0.25 + 0.75×0.80) = £10,000 × 0.85 = **£8,500** — nearly **£3,300 more** than the dividend route from the same £10,000 of company profit, **before any investment growth is even counted**. If she stays a basic-rate dividend taxpayer, the gap narrows but the pension route still wins because it entirely avoids the upfront Corporation Tax hit that dividends suffer.
- [Source for the general shape of this comparison, cross-checked across 3 independent contractor-accountancy sources: NetRate, The Accounting Crew, Lubbock Fine — exact percentage-point figures above are my own recalculation from the stated 2026/27 rates, not lifted verbatim from any one source, so **treat as illustrative and re-verify the arithmetic in the calculator's own engine** rather than hard-coding these numbers.] [NetRate](https://www.netrate.co.uk/guides/contractor-pension-strategy-2026-27); [Lubbock Fine](https://www.lubbockfine.co.uk/blog/pension-contributions-vs-dividends-the-battle-to-build-wealth-for-business-owners/); [TinyTax](https://tinytax.co.uk/guides/pension-contributions-corporation-tax)

**This is genuinely the single best lever available to her if she is outside IR35** — it avoids Corporation Tax, income tax, NI and dividend tax all at once on the way in, which no other extraction method (salary or dividend) can match.

---

## 5. What an Accountant Does That a Tool Cannot

Statutory obligations for her limited company, with deadlines and penalties [gov.uk-derived, cross-checked against 3 accountancy-firm summaries — I could not load the primary gov.uk company filing deadline pages directly this pass; figures are consistent across sources but flagged as **secondary-sourced**]:

| Obligation | Filed with | Deadline | Penalty for lateness |
|---|---|---|---|
| Annual (statutory) accounts | Companies House | 9 months after company year-end | £150 (≤1 month late), £375 (1–3 months), £750 (3–6 months), £1,500 (>6 months) |
| Corporation Tax return (CT600) | HMRC | 12 months after year-end (tax itself due 9 months + 1 day after year-end) | £100 immediately, rising to £1,000+ if 6+ months late; interest on unpaid tax |
| Confirmation statement | Companies House | At least once every 12 months | Company can be struck off for non-filing |
| Self Assessment (her personal return) | HMRC | 31 January following the tax year (online) | £100 automatic penalty, escalating |
| VAT returns (if VAT-registered) | HMRC, Making Tax Digital | 1 month + 7 days after each VAT quarter | Points-based penalty system + interest |
| Payroll RTI (Full Payment Submission) | HMRC | On or before each payday | Penalties for late/incorrect submissions |

**What genuinely requires a professional, beyond just filing paperwork on time:**
- **Judgement on the "wholly and exclusively" test** for pension contributions and expenses — this is a facts-and-circumstances test (Section 4.2), not a formula; an accountant who knows her full remuneration history can defend a contribution HMRC might otherwise query.
- **IR35 status risk assessment and contract review** — reading her actual contract and working practices against case law, not just a generic checklist.
- **CT600 preparation and corporation tax computations**, including marginal relief calculations and any associated-company adjustments.
- **Liability and signing off statutory accounts** — a director is personally liable for inaccurate filings; an accountant carries professional indemnity insurance and applies professional standards (ICAEW/ACCA) she cannot get from software.
- **Coordinating personal Self Assessment with company accounts** so dividends, salary, pension contributions and any other income (e.g. property, the eventual pension drawdown) are consistently reported and tax-efficient across both.
- **Real-time advice when circumstances change** — e.g. if her IR35 status is challenged, if Bestseller's engagement structure changes, or if she has an unusually profitable year and needs tapered-allowance or associated-company judgement calls.

Sources: [SG Accounting](https://sg-accounting.co.uk/blog/what-responsibilities-do-you-have-as-a-limited-company-director/); [IT Contracting deadlines](https://www.itcontracting.com/limited-company-tax-accounting-deadlines/); [BahiKhata](https://bahikhata.co.uk/guides/limited-company-deadlines-explained)

**Framing for the app**: the tool can model scenarios and show the arithmetic (Section 4.4 is a good example), but it cannot certify that a specific contribution passes the wholly-and-exclusively test for her specific facts, cannot file anything, and cannot take on the liability her accountant carries. Position it as "a calculator to bring better questions to your accountant," not a replacement for one.

---

## 6. Questions to Ask Her Accountant (printable checklist)

1. **"Is my current contract inside or outside IR35 — can I see the Status Determination Statement?"**
   *Why it matters:* everything else on this list depends on the answer. *Good answer:* your accountant can point to the actual SDS document and explain the stated reasons, not just guess from the contract type.

2. **"If I'm inside IR35, is there any way to still get pension contributions in before tax — either through the agency/fee-payer, or by moving to an umbrella?"**
   *Why it matters:* Section 1.3 shows this is genuinely not automatic inside IR35 via her own company. *Good answer:* a specific answer about her actual fee-payer's practice, not a generic "yes, pensions are always tax-efficient."

3. **"How much unused pension Annual Allowance do I have from the last three tax years, across all my pensions?"**
   *Why it matters:* determines how large a one-off employer contribution she could make. *Good answer:* a number, cross-checked against her Aviva and People's Pension statements, not an estimate.

4. **"What salary level are you running for me this year, and why — does it still give me a qualifying year for the State Pension?"**
   *Why it matters:* a too-low salary can silently cost a year of State Pension entitlement (Section 7). *Good answer:* confirmation the salary is at/above £6,708 (ideally £12,570) and a one-line reason.

5. **"If I put an extra £X of company profit into my pension instead of taking it as a dividend this year, what's the actual difference in my pocket, accounting for Corporation Tax and my dividend tax band?"**
   *Why it matters:* this is the single biggest tax-efficiency lever available (Section 4.4) — she should hear the accountant do this arithmetic on her real numbers. *Good answer:* an actual £ comparison, not a vague "pensions are generally better."

6. **"Am I close to my Annual Allowance being tapered, given this year's total income?"**
   *Why it matters:* rare at her income level but worth a yes/no each year. *Good answer:* a quick "no, you're well under" or a flag if a bumper year changes that.

7. **"When I eventually wind down the business, what's the most tax-efficient way to extract the remaining company cash — dividends, Business Asset Disposal Relief, or a final pension contribution?"**
   *Why it matters:* she expects "business cash at retirement" — this decision is made years in advance, not on the day. *Good answer:* a plan, not a "we'll deal with it nearer the time."

8. **"Does the Employment Allowance apply to my company, and if not, is there anything I could change (e.g. employing someone) that would make it apply?"**
   *Why it matters:* a single-director company with no other employee cannot claim it (Section 3) — worth knowing rather than assuming. *Good answer:* a clear "no, because..." or a genuine option if relevant.

9. **"If Jack & Jones's engagement ends and my income drops for a while, does that change what you'd recommend for salary, dividends or pension contributions this year?"**
   *Why it matters:* contractor income is lumpy; tax-efficient planning should flex with it. *Good answer:* an explanation of how they'd adjust, not a fixed rule regardless of income.

10. **"What records do you need from me, and by when, to hit the filing deadlines without last-minute stress?"**
    *Why it matters:* she's described as non-financial and finds this stressful — a clear, calendar-based answer reduces anxiety more than any tax saving. *Good answer:* a simple list with dates, not "just send everything eventually."

---

## 7. State Pension for Contractors

- **Qualifying years needed**: 35 years for the full new State Pension (if no NI record before April 2016); minimum 10 years for any new State Pension at all. [gov.uk – new State Pension](https://www.gov.uk/new-state-pension)
- **2026/27 thresholds**: Lower Earnings Limit (LEL) **£129/week (£6,708/year)**; Primary Threshold **£242/week (£12,570/year)**. [gov.uk rates and thresholds for employers 2026/27](https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027)
- **The trap**: a classic "low salary, high dividend" strategy that sets salary *below* the LEL (£6,708) means **no qualifying year at all** for that tax year, even though no NI was actually payable at a low salary anyway. Dividends do not count towards NI or State Pension qualification under any circumstances.
- **The fix**: as long as salary is set **at or above the LEL (£6,708)**, she is treated as having paid Class 1 NI for a qualifying year **even though no actual NI is due** until earnings reach the Primary Threshold (£12,570) — this is the standard "credited" mechanism, and is exactly why £6,708–£12,570 is the commonly recommended director-salary band. Setting salary at the full £12,570 (Section 3) both secures the qualifying year and uses her full Personal Allowance.
- **Action for her**: get a State Pension forecast (via gov.uk) to confirm how many qualifying years she already has and whether any past years (e.g. while contracting) are missing, before assuming her salary strategy has been keeping her record intact. [gov.uk – check your State Pension forecast](https://www.gov.uk/check-state-pension)

---

## Summary of loud flags for whoever builds the calculator

1. **IR35 status must be captured as an explicit input**, with a follow-up on Ltd-co-vs-umbrella if inside — the "pension beats dividend" headline advice is only straightforwardly true if she's outside IR35 (or inside via an umbrella with salary sacrifice).
2. Whether her own limited company can make a genuine pre-tax employer pension contribution while she is inside IR35 via her own PSC (not umbrella) is **not confirmed by a primary HMRC source** in this research pass — flag this to her accountant explicitly rather than asserting it either way.
3. The 2% dividend tax rate rise from April 2026 is real and well-corroborated (Autumn Budget 2025) — make sure the calculator uses **10.75% / 35.75% / 39.35%**, not the old 8.75%/33.75%/39.35% rates still floating around in older commentary.
4. Single-director companies (very likely her situation) **cannot claim the Employment Allowance** — don't default to including it.
5. Worked £ figures in Sections 3 and 4.4 are illustrative recalculations from confirmed rates, not lifted verbatim from a single authoritative worked example — re-derive them in the calculator's own engine against her real numbers rather than hard-coding the figures quoted here.
