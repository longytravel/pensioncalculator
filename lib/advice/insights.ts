/**
 * What each answer means for her.
 *
 * Tone rules, held throughout: pounds not percentages; forward tense only —
 * never "if you had started"; every 'act' names a step she could do today; no
 * red, no exclamation marks, no benchmarking her against other 51-year-olds;
 * and a frightening number never appears without the lever that moves it.
 *
 * The test is reading it aloud across a kitchen table. If she would wince,
 * it is wrong.
 */

import type { AdviceState, Derived, Insight } from './types'
import { PENSION_ACCESS_AGE } from './index'

const gbp = (n: number) =>
  Math.round(n).toLocaleString('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  })

export function buildInsights(state: AdviceState, d: Derived): Insight[] {
  const v = state.values
  const out: Insight[] = []

  // ---------------------------------------------------------------- wins
  if (v.qualifyingYears >= 35 && !state.unknown.qualifyingYears) {
    out.push({
      id: 'state-pension-full',
      topic: 'state-pension',
      severity: 'good',
      headline: `${gbp(d.statePensionMonthly)} a month for life is already yours`,
      detail: `On a full National Insurance record the State Pension pays that from ${v.statePensionAge}, and it rises with inflation. It is the floor under everything else here.`,
      action: {
        label: 'Check your record free at gov.uk',
        kind: 'link',
        target: 'https://www.gov.uk/check-state-pension',
      },
    })
  }

  if (d.mortgageClearsBeforeRetiring && v.mortgageBalance > 0) {
    out.push({
      id: 'mortgage-clears-first',
      topic: 'mortgage',
      severity: 'good',
      headline: `Mortgage gone at ${d.mortgageClearAge}, before you stop`,
      detail: `That frees up ${gbp(d.mortgageMonthly)} a month while you are still working. Those years are the best paid ones you will ever have for topping up a pension.`,
    })
  }

  if (d.homeEquity > 100000) {
    out.push({
      id: 'equity-real',
      topic: 'home',
      severity: 'good',
      headline: `You have ${gbp(d.homeEquity)} of equity in the house`,
      detail:
        'That is real, and it is yours. Worth knowing it only turns into money you can spend if you move somewhere cheaper or borrow against it.',
      action: { label: 'What downsizing really frees up', kind: 'guide', target: 'downsize' },
    })
  }

  // -------------------------------------------------------------- act now
  if (state.workingArrangement === 'unknown') {
    out.push({
      id: 'ir35-unknown',
      topic: 'company',
      severity: 'act',
      headline: 'One document decides your best option',
      detail:
        'Because Jack & Jones is a large client, they decide your IR35 status and must give you a Status Determination Statement. It changes whether your company can pay into your pension at all.',
      action: {
        label: 'Add this to your accountant email',
        kind: 'accountant',
        target: 'ir35',
      },
    })
  }

  if (d.companyRoute.available === true && v.employerMonthlyContribution === 0) {
    out.push({
      id: 'company-route-open',
      topic: 'company',
      severity: 'act',
      headline: 'Company profit can reach your pension almost untaxed',
      detail: `Take £10,000 of profit as a dividend and about ${gbp(d.tenKDividendNet)} reaches you. Put the same £10,000 in as a company pension contribution and all of it lands in the pension.`,
      action: {
        label: 'Ask your accountant how much',
        kind: 'accountant',
        target: 'company-amount',
      },
    })
  }

  if (d.missingNiYears > 0) {
    out.push({
      id: 'ni-gaps',
      topic: 'state-pension',
      severity: 'act',
      headline: `Each missing year is about ${gbp((12547.6 / 35) / 12)} a month, for life`,
      detail: `You have ${v.qualifyingYears} of the 35 years needed for the full State Pension. Some gaps can be filled, and the return on doing that is usually better than anything else available.`,
      action: {
        label: 'Check your record — two minutes, free',
        kind: 'link',
        target: 'https://www.gov.uk/check-state-pension',
      },
    })
  }

  if (d.hasBridgeGap) {
    out.push({
      id: 'bridge-gap',
      topic: 'access',
      severity: 'act',
      headline: `You cannot touch a pension until ${PENSION_ACCESS_AGE}`,
      detail: `Stopping at ${v.retirementAge} leaves ${d.bridgeYears} ${d.bridgeYears === 1 ? 'year' : 'years'} to cover from something else. Savings and ISAs are the usual answer, because they have no age limit.`,
      action: { label: 'Pension or ISA?', kind: 'guide', target: 'pension-vs-isa' },
    })
  }

  if (
    d.mortgageClearAge !== null &&
    !d.mortgageClearsBeforeRetiring &&
    v.mortgageBalance > 0
  ) {
    out.push({
      id: 'mortgage-outlasts',
      topic: 'mortgage',
      severity: 'watch',
      headline: `The mortgage runs to ${d.mortgageClearAge}, past when you stop`,
      detail: `That is ${gbp(d.mortgageMonthly)} a month still going out after the income stops. Overpaying now, or working a little longer, both close that gap.`,
      action: {
        label: 'Try overpaying',
        kind: 'field',
        target: 'mortgageOverpayment',
      },
    })
  }

  if (state.fundRiskLevel === 'cautious' && d.yearsToRetirement > 10) {
    out.push({
      id: 'cautious-too-early',
      topic: 'risk',
      severity: 'watch',
      headline: `Cautious with ${d.yearsToRetirement} years still to go`,
      detail:
        'Safer funds move around less, but they also tend to grow a lot less over a stretch this long. Being too careful too early has its own cost.',
      action: { label: 'What the risk setting means', kind: 'guide', target: 'fund-risk' },
    })
  }

  if (v.annualChargeRate >= 0.0075) {
    out.push({
      id: 'charges-high',
      topic: 'charges',
      severity: 'watch',
      headline: 'Your charges look on the high side',
      detail: `Charges come out every year whether the fund does well or not, and they compound against you for the same ${d.yearsToRetirement} years your money is compounding for you.`,
      action: { label: 'Check what you are paying', kind: 'guide', target: 'fund-risk' },
    })
  }

  if (state.unknown.avivaBalance || state.unknown.peoplesPensionBalance) {
    out.push({
      id: 'unknown-balance',
      topic: 'pots',
      severity: 'watch',
      headline: 'One figure here is still a guess',
      detail:
        'We have used a sensible estimate rather than assuming it is empty. Finding the real number is a ten-minute job and it may well be better news than the estimate.',
    })
  }

  if (v.cashIsaBalance === 0 && v.cashIsaMonthly === 0) {
    out.push({
      id: 'no-isa',
      topic: 'isa',
      severity: 'watch',
      headline: 'You have nothing you could reach before 57',
      detail:
        'An ISA is the one pot with no age lock. It gets no tax relief going in, but you can use it at any age — which matters if you ever want to stop before your pensions unlock.',
      action: { label: 'Pension or ISA?', kind: 'guide', target: 'pension-vs-isa' },
    })
  }

  // ------------------------------------------------------------- the gap
  if (!d.onTrack && d.projectedMonthly > 0) {
    out.push({
      id: 'gap',
      topic: 'gap',
      severity: 'act',
      headline: `${gbp(d.shortfallMonthly)} a month between here and your goal`,
      detail: `You are on track for ${gbp(d.projectedMonthly)} against the ${gbp(d.targetMonthly)} you asked for. Every one of the actions below moves the first number.`,
    })
  }

  if (d.onTrack) {
    out.push({
      id: 'on-track',
      topic: 'gap',
      severity: 'good',
      headline: 'You are on track for what you asked for',
      detail: `On these numbers you reach ${gbp(d.projectedMonthly)} a month against a goal of ${gbp(d.targetMonthly)}. Worth checking what happens if you want to stop earlier.`,
    })
  }

  return out
}
