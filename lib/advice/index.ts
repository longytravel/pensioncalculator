/**
 * advise(state) — the whole advisory layer, as one pure function.
 *
 * Impacts are always the difference between two full engine runs rather than
 * arithmetic done in the copy. It costs a few more milliseconds and removes an
 * entire class of bug where the headline and the chart disagree.
 */

import { project } from '@/lib/engine/project'
import {
  amortise,
  clearedAtAge,
  equity,
  monthlyPayment,
} from '@/lib/engine/mortgage'
import {
  companyContributionsAvailable,
  dividendVersusPension,
} from '@/lib/engine/contractor'
import { LIMITS_2026_27 } from '@/lib/engine/assumptions'
import { toEngineInputs } from '@/lib/store'
import type { CalculatorValues } from '@/lib/fields'
import type {
  Advice,
  AdviceState,
  Derived,
  Insight,
  RankedAction,
} from './types'
import { buildInsights } from './insights'
import { buildActions } from './actions'
import { buildAccountantQuestions, buildEmail } from './accountant'

/** Access age for anyone reaching 55 after April 2028. */
export const PENSION_ACCESS_AGE = LIMITS_2026_27.normalMinimumPensionAgeFrom2028

export function advise(state: AdviceState): Advice {
  const derived = derive(state)

  const insights = dedupeByTopic(buildInsights(state, derived))
  const actions = rank(buildActions(state, derived), derived)
  const accountantQuestions = buildAccountantQuestions(state, derived)

  return {
    insights,
    actions,
    accountantQuestions,
    emailBody: buildEmail(accountantQuestions),
    derived,
  }
}

/** Run the projection once and hang everything else off it. */
function derive(state: AdviceState): Derived {
  const v = state.values
  const projection = project(toEngineInputs(state), {
    inRealTerms: state.inRealTerms,
  })

  const projectedMonthly = projection.gap.projectedNetIncome / 12
  const targetMonthly = projection.gap.targetNetIncome / 12

  const mortgage = {
    balance: v.mortgageBalance,
    annualRate: v.mortgageRate,
    yearsRemaining: v.mortgageYearsLeft,
    monthlyOverpayment: v.mortgageOverpayment,
  }
  const clearAge = clearedAtAge(mortgage, v.currentAge)
  const homeEquity = equity(v.houseValue, v.mortgageBalance)

  const yearsTo57 = Math.max(0, PENSION_ACCESS_AGE - v.currentAge)
  const bridgeYears = Math.max(0, PENSION_ACCESS_AGE - v.retirementAge)

  const statePensionAnnual =
    (12547.6 * Math.min(v.qualifyingYears, 35)) / 35

  return {
    projection,
    projectedMonthly,
    targetMonthly,
    shortfallMonthly: Math.max(0, targetMonthly - projectedMonthly),
    onTrack: projection.gap.onTrack,
    yearsToRetirement: Math.max(0, v.retirementAge - v.currentAge),
    yearsTo57,
    hasBridgeGap: bridgeYears > 0,
    bridgeYears,
    totalPensionNow: v.avivaBalance + v.peoplesPensionBalance,
    homeEquity,
    // What actually stops going out when it clears — including any
    // overpayment she is making, since the clear age assumes it too.
    mortgageMonthly:
      monthlyPayment(v.mortgageBalance, v.mortgageRate, v.mortgageYearsLeft) +
      v.mortgageOverpayment,
    mortgageClearAge: clearAge,
    mortgageClearsBeforeRetiring:
      clearAge !== null && clearAge <= v.retirementAge,
    /**
     * What downsizing actually frees, which is not what people assume. The
     * outstanding mortgage comes off the sale first, so a £400k house with
     * £120k owed, moving to a £250k place, releases about £19k after costs —
     * not £150k.
     */
    realisticDownsizeRelease: Math.max(
      0,
      v.downsizeReleaseAmount > 0
        ? v.downsizeReleaseAmount
        : homeEquity - v.houseValue * 0.6 - v.houseValue * 0.025,
    ),
    statePensionMonthly: statePensionAnnual / 12,
    missingNiYears: Math.max(0, 35 - v.qualifyingYears),
    companyRoute: companyContributionsAvailable(state.workingArrangement),
    tenKDividendNet: dividendVersusPension(10000, v.salary).dividendNet,
    ...{ _mortgageSchedule: amortise(mortgage) },
  } as Derived
}

/**
 * Impact of changing one input, measured properly.
 *
 * Two engine runs, differenced. Exported because the action rules all need it
 * and none of them should be doing their own sums.
 */
export function impactOfChange(
  state: AdviceState,
  changes: Partial<CalculatorValues>,
): number {
  const before = project(toEngineInputs(state), {
    inRealTerms: state.inRealTerms,
  })
  const after = project(
    toEngineInputs({ ...state, values: { ...state.values, ...changes } }),
    { inRealTerms: state.inRealTerms },
  )
  return (
    (after.gap.projectedNetIncome - before.gap.projectedNetIncome) / 12
  )
}

/** One insight per topic — the highest severity wins. */
function dedupeByTopic(insights: Insight[]): Insight[] {
  const order = { act: 0, watch: 1, good: 2 } as const
  const best = new Map<string, Insight>()

  for (const insight of insights) {
    const current = best.get(insight.topic)
    if (!current || order[insight.severity] < order[current.severity]) {
      best.set(insight.topic, insight)
    }
  }

  return [...best.values()].sort(
    (a, b) => order[a.severity] - order[b.severity],
  )
}

/**
 * Order actions by what moves her number most for the least effort.
 *
 * Two deliberate behaviours. Impact is capped at the size of her actual
 * shortfall, so once she is on track the list stops shouting about levers she
 * no longer needs. And effort halves the score at each step, so a
 * fifteen-minute check outranks a change that costs her a year of retired life
 * unless the year is worth vastly more.
 */
function rank(actions: RankedAction[], derived: Derived): RankedAction[] {
  const ceiling = Math.max(derived.shortfallMonthly, 100)

  return actions
    .map((action) => {
      const capped = Math.min(action.impactMonthly, ceiling)
      return {
        ...action,
        horizon: horizonFor(action.effort),
        score: capped / Math.pow(2, action.effort - 1),
      }
    })
    .filter((a) => a.impactMonthly > 0 || a.unlocks)
    .sort((a, b) => b.score - a.score)
}

/** Effort decides the horizon, so the two can never contradict each other. */
function horizonFor(effort: number): RankedAction['horizon'] {
  if (effort <= 2) return 'short'
  if (effort === 3) return 'medium'
  return 'long'
}

/** Grouped for display, each group still ordered by score. */
export function byHorizon(
  actions: RankedAction[],
): Array<{ horizon: RankedAction['horizon']; actions: RankedAction[] }> {
  const order: RankedAction['horizon'][] = ['short', 'medium', 'long']
  return order
    .map((horizon) => ({
      horizon,
      actions: actions.filter((a) => a.horizon === horizon),
    }))
    .filter((group) => group.actions.length > 0)
}

export const EFFORT_LABELS: Record<number, string> = {
  1: 'Fifteen minutes',
  2: 'An afternoon',
  3: 'Changes your monthly budget',
  4: 'Changes your plans',
  5: 'Changes how you live',
}
