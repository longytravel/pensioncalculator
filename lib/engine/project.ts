/**
 * The projection engine.
 *
 * `project()` is the only function the UI calls. Everything below it is pure and
 * deterministic: same inputs, same output, no clock, no randomness.
 *
 * Money is computed in NOMINAL terms throughout, then deflated to today's money
 * at the end if `inRealTerms` is set. Doing it this way keeps charges, tax bands
 * and contribution escalation mutually consistent — mixing real and nominal
 * mid-calculation is the classic way to get a projection subtly wrong.
 */

import {
  toMonthlyRate,
  netOfCharges,
  toRealTerms,
  amortisedIncome,
  paymentForFutureValue,
  grossUpContribution,
} from './finance'
import { grossToNet, solveGrossForNet } from './tax'
import { DEFAULT_ASSUMPTIONS } from './assumptions'
import {
  EngineInputError,
  SCENARIOS,
  type Assumptions,
  type CalculatorInputs,
  type GapAnalysis,
  type ProjectionOutput,
  type Scenario,
  type ScenarioResult,
  type YearRow,
} from './types'

export interface ProjectOptions {
  /** Show figures in today's money. Default true. */
  inRealTerms?: boolean
  assumptions?: Assumptions
}

/** Annual State Pension she'll actually get, pro-rated for qualifying years. */
export function statePensionAmount(
  inputs: CalculatorInputs,
  assumptions: Assumptions,
): number {
  const years = Math.min(
    inputs.statePension.qualifyingYears,
    assumptions.statePensionFullQualifyingYears,
  )
  const fraction = Math.max(0, years) / assumptions.statePensionFullQualifyingYears
  return assumptions.statePensionFullAmount * fraction
}

/**
 * Validate inputs.
 *
 * Throws for states that are physically impossible; clamps and warns for ones
 * that are merely odd, so a slip on one field doesn't blank the whole screen.
 */
export function validateInputs(inputs: CalculatorInputs): {
  cleaned: CalculatorInputs
  warnings: string[]
} {
  const warnings: string[] = []

  if (inputs.retirementAge <= inputs.currentAge) {
    throw new EngineInputError(
      'Your retirement age needs to be later than your age now.',
      'retirementAge',
    )
  }

  for (const pot of inputs.pensionPots) {
    if (pot.balance < 0) {
      throw new EngineInputError(
        `${pot.provider} can't have a negative balance.`,
        'pensionPots',
      )
    }
  }

  if (
    inputs.personalMonthlyContribution < 0 ||
    inputs.employerMonthlyContribution < 0
  ) {
    throw new EngineInputError(
      "Contributions can't be negative.",
      'personalMonthlyContribution',
    )
  }

  const cleaned: CalculatorInputs = { ...inputs }

  if (cleaned.planningAge <= cleaned.retirementAge) {
    cleaned.planningAge = cleaned.retirementAge + 1
    warnings.push(
      'We moved your planning age to just after your retirement age, so there was something to work with.',
    )
  }

  if (
    cleaned.statePension.qualifyingYears >
    DEFAULT_ASSUMPTIONS.statePensionFullQualifyingYears
  ) {
    cleaned.statePension = {
      ...cleaned.statePension,
      qualifyingYears: DEFAULT_ASSUMPTIONS.statePensionFullQualifyingYears,
    }
    warnings.push(
      'Extra National Insurance years past 35 don’t increase the State Pension, so we capped it at 35.',
    )
  }

  for (const asset of cleaned.otherAssets) {
    if (asset.ageReceived > cleaned.planningAge) {
      warnings.push(
        `${asset.label} arrives after your plan ends, so it isn’t counted here.`,
      )
    }
  }

  return { cleaned, warnings }
}

/** Blended annual charge across her pots, weighted by balance. */
function blendedChargeRate(inputs: CalculatorInputs): number {
  const total = inputs.pensionPots.reduce((sum, p) => sum + p.balance, 0)
  if (total <= 0) {
    // No balances yet — fall back to a simple average so future contributions
    // still carry a sensible charge.
    if (inputs.pensionPots.length === 0) return 0
    return (
      inputs.pensionPots.reduce((s, p) => s + p.annualChargeRate, 0) /
      inputs.pensionPots.length
    )
  }
  return (
    inputs.pensionPots.reduce(
      (sum, p) => sum + p.annualChargeRate * p.balance,
      0,
    ) / total
  )
}

/** Gross monthly pension contribution, including basic-rate relief where due. */
export function grossMonthlyContribution(
  inputs: CalculatorInputs,
  assumptions: Assumptions,
): { personal: number; employer: number; relief: number } {
  const employer = inputs.employerMonthlyContribution

  // Only relief at source adds money to the pot. Net pay and salary sacrifice
  // come out of gross earnings, so the stated figure is already gross.
  const personal =
    inputs.contributionType === 'relief_at_source'
      ? grossUpContribution(
          inputs.personalMonthlyContribution,
          assumptions.basicRateReliefRate,
        )
      : inputs.personalMonthlyContribution

  return {
    personal,
    employer,
    relief: personal - inputs.personalMonthlyContribution,
  }
}

/** Annual escalation rate applied to contributions. */
function escalationRate(
  inputs: CalculatorInputs,
  assumptions: Assumptions,
): number {
  switch (inputs.contributionEscalation.mode) {
    case 'inflation':
      return assumptions.cpi
    case 'salary':
      return assumptions.salaryGrowth
    default:
      return 0
  }
}

interface AccumulationState {
  pension: number
  isa: number
  cumulativeContributions: number
  cumulativeRelief: number
}

/**
 * Run one scenario from today to the planning age.
 *
 * Accumulation runs month by month within each year so that contributions
 * compound properly; escalation is applied annually, which is how salary
 * reviews and inflation-linked increases actually happen.
 */
function runScenario(
  inputs: CalculatorInputs,
  assumptions: Assumptions,
  scenario: Scenario,
  inRealTerms: boolean,
): ScenarioResult {
  const grossGrowth = assumptions.growthRates[inputs.fundRiskLevel][scenario]
  const chargeRate = blendedChargeRate(inputs)
  const netAnnualGrowth = netOfCharges(grossGrowth, chargeRate)
  const monthlyGrowth = toMonthlyRate(netAnnualGrowth)

  const { personal, employer, relief } = grossMonthlyContribution(
    inputs,
    assumptions,
  )
  const escalation = escalationRate(inputs, assumptions)

  const statePension = statePensionAmount(inputs, assumptions)
  const yearsToRetirement = inputs.retirementAge - inputs.currentAge
  const totalYears = inputs.planningAge - inputs.currentAge

  const state: AccumulationState = {
    pension: inputs.pensionPots.reduce((sum, p) => sum + p.balance, 0),
    isa: inputs.cashISA?.balance ?? 0,
    cumulativeContributions: 0,
    cumulativeRelief: 0,
  }

  const isaMonthlyGrowth = toMonthlyRate(
    inputs.cashISA?.annualGrowthRate ?? 0,
  )

  const rows: YearRow[] = []
  let potAtRetirement = 0
  let taxFreeLumpSum = 0
  let sustainableGrossDrawdown = 0
  let potDepletionAge: number | undefined

  for (let yearIndex = 0; yearIndex < totalYears; yearIndex++) {
    const age = inputs.currentAge + yearIndex + 1
    const isRetired = yearIndex >= yearsToRetirement

    const lumpSum = inputs.otherAssets
      .filter((a) => a.ageReceived === age && a.ageReceived <= inputs.planningAge)
      .reduce((sum, a) => sum + a.netAmount, 0)

    // Entered in today's money, so inflate to keep the nominal ledger
    // internally consistent. Credited at the END of the year it's received:
    // she gets the money when she gets it, and it earns nothing beforehand.
    const nominalLumpSum =
      lumpSum * Math.pow(1 + assumptions.cpi, yearIndex + 1)

    // What was actually withdrawn this year — set in the retired branch, and
    // the same figure the pot update used, so a drained pot reports £0 income
    // rather than a phantom flat payment forever.
    let drawdownThisYear = 0

    if (!isRetired) {
      const escalationFactor = Math.pow(1 + escalation, yearIndex)
      const monthlyPersonal = personal * escalationFactor
      const monthlyEmployer = employer * escalationFactor
      const monthlyRelief = relief * escalationFactor
      const monthlyIsa =
        (inputs.cashISA?.monthlyContribution ?? 0) * escalationFactor

      for (let m = 0; m < 12; m++) {
        // Annuity-due: contribute at the start of the month, then grow.
        state.pension =
          (state.pension + monthlyPersonal + monthlyEmployer) *
          (1 + monthlyGrowth)
        state.isa = (state.isa + monthlyIsa) * (1 + isaMonthlyGrowth)
      }

      state.cumulativeContributions +=
        (monthlyPersonal + monthlyEmployer) * 12
      state.cumulativeRelief += monthlyRelief * 12

      // One-off top-ups land once a year, at year end — deliberately earning
      // nothing in the year they arrive, which keeps the estimate on the
      // conservative side of her actual habit.
      const lumpNet = (inputs.personalYearlyLumpSum ?? 0) * escalationFactor
      if (lumpNet > 0) {
        const lumpGross =
          inputs.contributionType === 'relief_at_source'
            ? grossUpContribution(lumpNet, assumptions.basicRateReliefRate)
            : lumpNet
        state.pension += lumpGross
        state.cumulativeContributions += lumpGross
        state.cumulativeRelief += lumpGross - lumpNet
      }
      const isaLump = (inputs.cashISA?.yearlyLumpSum ?? 0) * escalationFactor
      if (isaLump > 0) state.isa += isaLump

      state.pension += nominalLumpSum

      if (yearIndex === yearsToRetirement - 1) {
        potAtRetirement = state.pension
        taxFreeLumpSum = Math.min(
          potAtRetirement * 0.25,
          assumptions.lumpSumAllowance,
        )

        // Sustainable gross drawdown, set once at retirement and then held
        // flat in real terms.
        const yearsInRetirement = inputs.planningAge - inputs.retirementAge
        const drawdownPot = potAtRetirement - taxFreeLumpSum + state.isa
        sustainableGrossDrawdown = sustainableDrawdown(
          drawdownPot,
          inputs,
          assumptions,
          scenario,
          netAnnualGrowth,
          yearsInRetirement,
        )
      }
    } else {
      // Withdraw at the start of the year, then grow what's left.
      const nominalDrawdown =
        sustainableGrossDrawdown * Math.pow(1 + assumptions.cpi, yearIndex)

      const available = state.pension + state.isa
      const actualDrawdown = Math.min(nominalDrawdown, Math.max(0, available))

      // An annuity is bought with the capital and pays for life — the income
      // keeps coming after the ledger shows the capital spent. Drawdown
      // methods stop paying when the pot is actually empty.
      const guaranteed = inputs.decumulationMethod === 'annuity'
      drawdownThisYear = guaranteed ? nominalDrawdown : actualDrawdown

      if (!guaranteed && available <= 0 && potDepletionAge === undefined) {
        potDepletionAge = age
      }

      // Draw from the pension first, then the ISA.
      const fromPension = Math.min(actualDrawdown, Math.max(0, state.pension))
      const fromIsa = actualDrawdown - fromPension
      state.pension = Math.max(0, state.pension - fromPension)
      state.isa = Math.max(0, state.isa - fromIsa)

      state.pension *= 1 + netAnnualGrowth
      state.isa *= 1 + (inputs.cashISA?.annualGrowthRate ?? 0)

      state.pension += nominalLumpSum
    }

    const yearsElapsed = yearIndex + 1
    const deflate = (v: number) =>
      inRealTerms ? toRealTerms(v, assumptions.cpi, yearsElapsed) : v

    const spReceived = isRetired && age >= inputs.statePension.statePensionAge
    // State Pension is flat in real terms, so in nominal terms it rises with CPI.
    const nominalStatePension = spReceived
      ? statePension * Math.pow(1 + assumptions.cpi, yearsElapsed)
      : 0
    const nominalDrawdownThisYear = drawdownThisYear

    const grossIncome = nominalStatePension + nominalDrawdownThisYear
    const netIncome = isRetired
      ? grossToNet(
          nominalDrawdownThisYear,
          nominalStatePension,
          inputs.taxRegime,
          assumptions,
        ).net
      : 0

    rows.push({
      year: yearsElapsed,
      age,
      pension: round(deflate(state.pension)),
      isa: round(deflate(state.isa)),
      lumpSum: round(lumpSum),
      total: round(deflate(state.pension + state.isa)),
      cumulativeContributions: round(deflate(state.cumulativeContributions)),
      cumulativeTaxRelief: round(deflate(state.cumulativeRelief)),
      cumulativeGrowth: round(
        deflate(
          state.pension +
            state.isa -
            state.cumulativeContributions -
            state.cumulativeRelief,
        ),
      ),
      isRetired,
      statePensionIncome: round(deflate(nominalStatePension)),
      drawdownGross: round(deflate(nominalDrawdownThisYear)),
      incomeGross: round(deflate(grossIncome)),
      incomeNet: round(deflate(netIncome)),
      targetIncome: isRetired ? round(inputs.targetIncome.amount) : 0,
    })
  }

  // Headline sustainable income, in today's money, at the point of retirement.
  const firstRetiredRow = rows.find((r) => r.isRetired)
  const sustainableNetIncome = firstRetiredRow?.incomeNet ?? 0

  return {
    scenario,
    rows,
    potAtRetirement: round(
      inRealTerms
        ? toRealTerms(potAtRetirement, assumptions.cpi, yearsToRetirement)
        : potAtRetirement,
    ),
    taxFreeLumpSum: round(
      inRealTerms
        ? toRealTerms(taxFreeLumpSum, assumptions.cpi, yearsToRetirement)
        : taxFreeLumpSum,
    ),
    sustainableNetIncome,
    potDepletionAge,
  }
}

/** Gross annual drawdown the pot can support, by the chosen method. */
function sustainableDrawdown(
  pot: number,
  inputs: CalculatorInputs,
  assumptions: Assumptions,
  scenario: Scenario,
  netNominalGrowth: number,
  yearsInRetirement: number,
): number {
  switch (inputs.decumulationMethod) {
    case 'swr':
      return pot * assumptions.swr[scenario]

    case 'amortise': {
      // Level real income, so work in real terms here.
      const realRate = (1 + netNominalGrowth) / (1 + assumptions.cpi) - 1
      return amortisedIncome(pot, realRate, yearsInRetirement)
    }

    case 'annuity': {
      const rate = nearestAnnuityRate(inputs.retirementAge, assumptions)
      return (pot / 100000) * rate
    }
  }
}

/** Nearest tabulated annuity rate. Illustrative only — never a quote. */
function nearestAnnuityRate(age: number, assumptions: Assumptions): number {
  const ages = Object.keys(assumptions.annuityRatePer100k)
    .map(Number)
    .sort((a, b) => a - b)

  let nearest = ages[0]
  for (const a of ages) {
    if (Math.abs(a - age) < Math.abs(nearest - age)) nearest = a
  }
  return assumptions.annuityRatePer100k[nearest]
}

/**
 * The gap — the single number the whole app exists to produce.
 */
export function computeGap(
  mid: ScenarioResult,
  inputs: CalculatorInputs,
  assumptions: Assumptions,
): GapAnalysis {
  const projectedNetIncome = mid.sustainableNetIncome

  // She thinks in take-home money, so the target is usually already net.
  const targetNetIncome = inputs.targetIncome.isNet
    ? inputs.targetIncome.amount
    : grossToNet(
        Math.max(
          0,
          inputs.targetIncome.amount - statePensionAmount(inputs, assumptions),
        ),
        statePensionAmount(inputs, assumptions),
        inputs.taxRegime,
        assumptions,
      ).net

  const gap = projectedNetIncome - targetNetIncome

  let requiredExtraMonthlyContribution = 0

  if (gap < 0) {
    // Gross up the shortfall, turn it into the extra pot needed, then solve
    // for the monthly contribution that builds that pot.
    const shortfallNet = -gap
    const currentGross =
      mid.rows.find((r) => r.isRetired)?.incomeGross ?? 0
    const requiredGross = solveGrossForNet(
      projectedNetIncome + shortfallNet,
      inputs.taxRegime,
      assumptions,
    )
    const extraGrossNeeded = Math.max(0, requiredGross - currentGross)

    const scenario: Scenario = 'mid'
    const grossGrowth = assumptions.growthRates[inputs.fundRiskLevel][scenario]
    const netAnnualGrowth = netOfCharges(grossGrowth, blendedChargeRate(inputs))

    const extraPotNeeded = potNeededForIncome(
      extraGrossNeeded,
      inputs,
      assumptions,
      scenario,
      netAnnualGrowth,
    )

    // Convert the required pot (today's money) into nominal terms at retirement,
    // then solve for the level monthly contribution that gets there.
    const yearsToRetirement = inputs.retirementAge - inputs.currentAge
    const nominalPotNeeded =
      extraPotNeeded * Math.pow(1 + assumptions.cpi, yearsToRetirement)

    const monthlyRate = toMonthlyRate(netAnnualGrowth)
    const monthlyEscalation = toMonthlyRate(
      escalationRate(inputs, assumptions),
    )

    const grossMonthly = paymentForFutureValue(
      nominalPotNeeded,
      monthlyRate,
      monthlyEscalation,
      yearsToRetirement * 12,
    )

    // Report what she actually pays, not the grossed-up figure.
    requiredExtraMonthlyContribution =
      inputs.contributionType === 'relief_at_source'
        ? grossMonthly * (1 - assumptions.basicRateReliefRate)
        : grossMonthly
  }

  return {
    projectedNetIncome: round(projectedNetIncome),
    targetNetIncome: round(targetNetIncome),
    gap: round(gap),
    requiredExtraMonthlyContribution: round(requiredExtraMonthlyContribution),
    onTrack: gap >= 0,
  }
}

/** Pot required to fund a given gross annual income, in today's money. */
function potNeededForIncome(
  grossIncome: number,
  inputs: CalculatorInputs,
  assumptions: Assumptions,
  scenario: Scenario,
  netNominalGrowth: number,
): number {
  if (grossIncome <= 0) return 0
  const yearsInRetirement = inputs.planningAge - inputs.retirementAge

  switch (inputs.decumulationMethod) {
    case 'swr':
      return grossIncome / assumptions.swr[scenario]

    case 'amortise': {
      const realRate = (1 + netNominalGrowth) / (1 + assumptions.cpi) - 1
      // Invert amortisedIncome: pot = income / (rate / ((1-(1+r)^-n)(1+r)))
      const perUnit = amortisedIncome(1, realRate, yearsInRetirement)
      return perUnit > 0 ? grossIncome / perUnit : 0
    }

    case 'annuity': {
      const rate = nearestAnnuityRate(inputs.retirementAge, assumptions)
      return (grossIncome / rate) * 100000
    }
  }
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Run the full projection.
 *
 * The only entry point the UI should call.
 */
export function project(
  inputs: CalculatorInputs,
  options: ProjectOptions = {},
): ProjectionOutput {
  const assumptions = options.assumptions ?? DEFAULT_ASSUMPTIONS
  const inRealTerms = options.inRealTerms ?? true

  const { cleaned, warnings } = validateInputs(inputs)

  const scenarios = Object.fromEntries(
    SCENARIOS.map((s) => [s, runScenario(cleaned, assumptions, s, inRealTerms)]),
  ) as Record<Scenario, ScenarioResult>

  const gap = computeGap(scenarios.mid, cleaned, assumptions)

  return { scenarios, gap, assumptionsUsed: assumptions, warnings, inRealTerms }
}
