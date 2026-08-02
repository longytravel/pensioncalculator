/**
 * The snapshot sent to the assistant each turn.
 *
 * Live testing showed why this needs to include computed results and not just
 * raw inputs: given only the inputs, the model correctly refused to state a
 * required contribution, because working it out needs the growth and tax
 * assumptions it cannot see. Sending the engine's own answer means it reports
 * a figure that is actually right instead of declining or, worse, estimating.
 *
 * The engine is the single source of numeric truth. The model narrates it.
 */

import { project } from '@/lib/engine/project'
import {
  amortise,
  overpaymentImpact,
  clearedAtAge,
  equity,
} from '@/lib/engine/mortgage'
import {
  companyContributionsAvailable,
  dividendVersusPension,
  type WorkingArrangement,
} from '@/lib/engine/contractor'
import { toEngineInputs } from '@/lib/store'
import type { CalculatorValues } from '@/lib/fields'
import type {
  CalculatorInputs,
  DecumulationMethod,
  FundRiskLevel,
  TaxRegime,
} from '@/lib/engine/types'

export interface SnapshotSource {
  values: CalculatorValues
  fundRiskLevel: FundRiskLevel
  contributionType: CalculatorInputs['contributionType']
  contributionEscalation: CalculatorInputs['contributionEscalation']['mode']
  decumulationMethod: DecumulationMethod
  taxRegime: TaxRegime
  workingArrangement: WorkingArrangement
  inRealTerms: boolean
}

export function buildSnapshot(source: SnapshotSource) {
  const inputs = toEngineInputs(source)

  let projection
  try {
    projection = project(inputs, { inRealTerms: source.inRealTerms })
  } catch {
    return { error: 'Her figures are mid-edit and do not add up yet.' }
  }

  const v = source.values
  const mortgage = {
    balance: v.mortgageBalance,
    annualRate: v.mortgageRate,
    yearsRemaining: v.mortgageYearsLeft,
    monthlyOverpayment: v.mortgageOverpayment,
  }

  const schedule = amortise(mortgage)
  const impact = overpaymentImpact(mortgage)
  const contributions = companyContributionsAvailable(source.workingArrangement)

  const round = (n: number) => Math.round(n)

  return {
    note: 'Figures computed by the calculator engine. Treat them as correct and quote them directly rather than recalculating.',
    inTodaysMoney: source.inRealTerms,

    about: {
      age: v.currentAge,
      plansToStopWorkingAt: v.retirementAge,
      planningUntilAge: v.planningAge,
      grossAnnualIncome: v.salary,
      workingArrangement: source.workingArrangement,
    },

    pensions: {
      aviva: v.avivaBalance,
      peoplesPension: v.peoplesPensionBalance,
      totalNow: v.avivaBalance + v.peoplesPensionBalance,
      annualChargePercent: Number((v.annualChargeRate * 100).toFixed(2)),
      paysInPersonallyPerMonth: v.personalMonthlyContribution,
      companyPaysInPerMonth: v.employerMonthlyContribution,
      fundRisk: source.fundRiskLevel,
      statePensionAge: v.statePensionAge,
      niQualifyingYears: v.qualifyingYears,
    },

    theAnswer: {
      projectedNetIncomePerYear: round(projection.gap.projectedNetIncome),
      projectedNetIncomePerMonth: round(projection.gap.projectedNetIncome / 12),
      targetNetIncomePerYear: round(projection.gap.targetNetIncome),
      onTrack: projection.gap.onTrack,
      shortfallPerYear: projection.gap.onTrack
        ? 0
        : round(Math.abs(projection.gap.gap)),
      shortfallPerMonth: projection.gap.onTrack
        ? 0
        : round(Math.abs(projection.gap.gap) / 12),
      // The figure the model previously had to decline to give.
      extraPerMonthNeededToCloseIt: round(
        projection.gap.requiredExtraMonthlyContribution,
      ),
    },

    potAtRetirement: {
      cautious: round(projection.scenarios.low.potAtRetirement),
      expected: round(projection.scenarios.mid.potAtRetirement),
      optimistic: round(projection.scenarios.high.potAtRetirement),
      taxFreeCashExpected: round(projection.scenarios.mid.taxFreeLumpSum),
      moneyRunsOutAtAge: {
        cautious: projection.scenarios.low.potDepletionAge ?? null,
        expected: projection.scenarios.mid.potDepletionAge ?? null,
        optimistic: projection.scenarios.high.potDepletionAge ?? null,
      },
    },

    home: {
      value: v.houseValue,
      mortgageOwed: v.mortgageBalance,
      equity: equity(v.houseValue, v.mortgageBalance),
      monthlyPayment: round(schedule.monthlyPayment),
      mortgageClearedAtAge: clearedAtAge(mortgage, v.currentAge),
      clearedBeforeRetiring:
        (clearedAtAge(mortgage, v.currentAge) ?? 999) <= v.retirementAge,
      currentOverpaymentPerMonth: v.mortgageOverpayment,
      overpayingSavesInInterest: round(impact.interestSaved),
      overpayingSavesMonths: impact.monthsSaved,
      plansToFreeUpByMoving: v.downsizeReleaseAmount,
      movingAtAge: v.downsizeAge,
    },

    otherMoney: {
      cashIsa: v.cashIsaBalance,
      savingPerMonth: v.cashIsaMonthly,
      businessCashExpected: v.businessCashAmount,
      businessCashAtAge: v.businessCashAge,
    },

    companyPensionContributions: {
      available: contributions.available,
      whyOrWhyNot: contributions.explanation,
      // Only meaningful when the arrangement actually allows it.
      worthOf10kProfit:
        contributions.available === true
          ? dividendVersusPension(10000, v.salary)
          : null,
    },

    assumptions: {
      inflation: '2.5% a year',
      growthUsed: `${(projection.assumptionsUsed.growthRates[source.fundRiskLevel].mid * 100).toFixed(1)}% expected, before charges`,
      safeWithdrawalRate: `${(projection.assumptionsUsed.swr.mid * 100).toFixed(1)}%`,
      note: 'Growth rates follow the FCA illustration convention. They are regulatory maximums, not forecasts.',
    },

    warnings: projection.warnings,
  }
}
