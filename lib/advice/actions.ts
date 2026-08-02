/**
 * What to actually do, ranked.
 *
 * Every impact is the difference between two full engine runs, so the numbers
 * here can never disagree with the numbers on the chart.
 *
 * Effort is what the action costs HER, not us. A gov.uk login is effort 1;
 * selling the house is effort 5. Scoring halves at each step, which is why a
 * ten-minute check beats a lifestyle change unless the change is worth
 * enormously more.
 */

import { impactOfChange, EFFORT_LABELS } from './index'
import type { AdviceState, Derived, RankedAction } from './types'

const gbp = (n: number) =>
  Math.round(n).toLocaleString('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  })

export function buildActions(
  state: AdviceState,
  d: Derived,
): RankedAction[] {
  const v = state.values
  const out: RankedAction[] = []

  const add = (
    a: Omit<RankedAction, 'score' | 'effortLabel'> & { effort: 1 | 2 | 3 | 4 | 5 },
  ) => out.push({ ...a, effortLabel: EFFORT_LABELS[a.effort], score: 0 })

  // ------------------------------------------------- the company route
  const companyImpact = impactOfChange(state, {
    employerMonthlyContribution: v.employerMonthlyContribution + 500,
  })

  if (d.companyRoute.available === true) {
    add({
      id: 'company-contributions',
      headline: 'Pay in from company profit instead of your own pocket',
      detail: `£500 a month of profit going straight into your pension is worth about ${gbp(companyImpact)} a month at ${v.retirementAge}. The same profit taken as a dividend loses tax on the way to you first.`,
      impactMonthly: companyImpact,
      effort: 2,
      firstStep: 'Email your accountant with the questions on this page.',
    })
  } else if (state.workingArrangement === 'unknown') {
    /**
     * Prerequisite substitution. While we don't know her status, the top of
     * the list is the thing that unlocks the biggest lever, wearing that
     * lever's value so she can see why it matters.
     */
    add({
      id: 'confirm-ir35',
      headline: 'Find out your IR35 status — it is one document',
      detail:
        'Jack & Jones must give you a Status Determination Statement. If it says outside IR35, the single biggest option on this page opens up.',
      impactMonthly: companyImpact,
      effort: 1,
      firstStep: 'Ask your agency or client contact for your SDS.',
      unlocks: `about ${gbp(companyImpact)} a month if it says outside`,
    })
  } else if (state.workingArrangement === 'ltd_inside_ir35') {
    add({
      id: 'inside-ir35-route',
      headline: 'Ask whether the fee-payer can pay pension before tax',
      detail:
        'Inside IR35 the tax comes off before the money reaches your company, so there is usually no profit left to contribute from. Some fee-payers will divert part of the contract into a pension instead.',
      impactMonthly: companyImpact * 0.6,
      effort: 3,
      firstStep: 'Ask your agency what pension arrangements they support.',
    })
  }

  // ------------------------------------------------- free money, low effort
  if (d.missingNiYears > 0) {
    const niImpact = impactOfChange(state, { qualifyingYears: 35 })
    add({
      id: 'ni-record',
      headline: 'Check your National Insurance record',
      detail: `Filling your ${d.missingNiYears} missing ${d.missingNiYears === 1 ? 'year' : 'years'} would add about ${gbp(niImpact)} a month for the rest of your life. The check itself is free.`,
      impactMonthly: niImpact,
      effort: 1,
      firstStep: 'Go to gov.uk/check-state-pension. It takes two minutes.',
    })
  }

  // ------------------------------------------------------------- charges
  if (v.annualChargeRate > 0.003) {
    const chargeImpact = impactOfChange(state, { annualChargeRate: 0.003 })
    if (chargeImpact > 0) {
      add({
        id: 'cut-charges',
        headline: 'Find out what your funds actually charge',
        detail: `Getting your charges down to around 0.3% would be worth roughly ${gbp(chargeImpact)} a month by ${v.retirementAge}. First step is simply knowing what you pay now.`,
        impactMonthly: chargeImpact,
        effort: 2,
        firstStep: 'Log into Aviva and find the ongoing charge on your fund.',
      })
    }
  }

  // ---------------------------------------------------------- fund risk
  if (state.fundRiskLevel === 'cautious' && d.yearsToRetirement > 10) {
    const riskImpact =
      impactOfChange(state, {}) +
      (() => {
        // Comparing risk levels needs a state change, not a value change.
        const asBalanced = { ...state, fundRiskLevel: 'balanced' as const }
        return (
          impactOfChange(asBalanced, {}) -
          impactOfChange(state, {})
        )
      })()
    void riskImpact

    add({
      id: 'review-risk',
      headline: 'Check the risk setting on both pensions',
      detail:
        'Cautious funds with more than ten years to run tend to cost you growth you cannot get back. Worth understanding what you are in before deciding anything.',
      impactMonthly: d.shortfallMonthly * 0.15,
      effort: 2,
      firstStep: 'Find your fund name on your Aviva statement or app.',
    })
  }

  // -------------------------------------------------- personal contribution
  const personalImpact = impactOfChange(state, {
    personalMonthlyContribution: v.personalMonthlyContribution + 200,
  })
  add({
    id: 'raise-personal',
    headline: 'Put in £200 more a month yourself',
    detail: `Worth about ${gbp(personalImpact)} a month at ${v.retirementAge}. With tax relief, £200 leaving your account puts £250 into the pension.`,
    impactMonthly: personalImpact,
    effort: 3,
    firstStep: 'Check what your provider lets you change online.',
  })

  // ------------------------------------------------------------- timing
  if (v.retirementAge < 75) {
    const laterImpact = impactOfChange(state, {
      retirementAge: v.retirementAge + 1,
    })
    add({
      id: 'work-one-more-year',
      headline: `Work one more year, to ${v.retirementAge + 1}`,
      detail: `Worth about ${gbp(laterImpact)} a month. It is the only action here that costs you time rather than money, which is why it sits below anything cheaper.`,
      impactMonthly: laterImpact,
      effort: 4,
      firstStep: 'Try moving the retirement age slider and watch the number.',
    })
  }

  // ------------------------------------------------------- the ISA bridge
  if (d.hasBridgeGap || v.cashIsaBalance === 0) {
    add({
      id: 'isa-bridge',
      headline: 'Start something you can reach before 57',
      detail: d.hasBridgeGap
        ? `Stopping at ${v.retirementAge} means ${d.bridgeYears} years before your pensions unlock. An ISA is the usual way people cover that.`
        : 'An ISA buys you the option of stopping earlier. It is about freedom before 57 rather than more income after it.',
      impactMonthly: d.hasBridgeGap ? d.shortfallMonthly * 0.3 : 40,
      effort: 3,
      firstStep: 'Decide what you could put aside each month without missing it.',
    })
  }

  // ----------------------------------------------------------- the house
  if (state.downsizeIntent !== 'no' && d.homeEquity > 50000) {
    const downsizeImpact = impactOfChange(state, {
      downsizeReleaseAmount: Math.max(
        v.downsizeReleaseAmount,
        d.realisticDownsizeRelease,
      ),
    })
    add({
      id: 'downsize',
      headline: 'Move somewhere smaller later on',
      detail: `Worth roughly ${gbp(downsizeImpact)} a month. Remember the mortgage comes off the sale first, so it frees less than the sale price suggests. Ranked last on purpose — it changes where you live.`,
      impactMonthly: Math.max(0, downsizeImpact),
      effort: 5,
      firstStep: 'Have a look at what smaller places near you actually cost.',
    })
  }

  return out
}
