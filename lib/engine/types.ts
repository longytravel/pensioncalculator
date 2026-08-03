/**
 * Core types for the retirement projection engine.
 *
 * Everything in `lib/engine` is pure: no React, no I/O, no dates read from the
 * system clock. That keeps it exhaustively testable, which matters because these
 * numbers are the whole point of the app.
 */

export type ContributionType =
  | 'relief_at_source'
  | 'net_pay'
  | 'salary_sacrifice'

export type FundRiskLevel = 'cautious' | 'balanced' | 'growth'

export type DecumulationMethod = 'swr' | 'amortise' | 'annuity'

export type Scenario = 'low' | 'mid' | 'high'

export const SCENARIOS: readonly Scenario[] = ['low', 'mid', 'high'] as const

/** Which income tax regime applies. Scotland is a different table, not different code. */
export type TaxRegime = 'englandWales' | 'scotland'

export interface PensionPot {
  /** "Aviva", "The People's Pension" — shown back to her verbatim. */
  provider: string
  /** Current value in £. */
  balance: number
  /** Total annual charge as a decimal: fund OCF + platform fee. e.g. 0.005 = 0.5%. */
  annualChargeRate: number
}

/**
 * A one-off lump sum landing at a known age: house sale proceeds, business cash.
 * Always entered as a *net* amount in today's money — we deliberately do not
 * forecast house prices or business valuations, which would be false precision.
 */
export interface OtherAsset {
  label: string
  /** £, net of selling costs / onward purchase, in today's money. */
  netAmount: number
  /** Her age when it lands. */
  ageReceived: number
}

export interface CashISA {
  balance: number
  /** Nominal annual growth, e.g. 0.025. Tax-free on the way out. */
  annualGrowthRate: number
  /** Monthly amount she adds, £. */
  monthlyContribution: number
  /** One-off amounts, averaged per year, £. */
  yearlyLumpSum?: number
}

export interface StatePensionInput {
  /** Age at which it starts paying. Currently 66→67 between 2026 and 2028. */
  statePensionAge: number
  /** NI years accrued. 35 gets the full amount; clamped at 35. */
  qualifyingYears: number
}

export interface TargetIncome {
  /** £ per year. */
  amount: number
  /**
   * True if the figure is take-home. Kirsten thinks in take-home money, so this
   * is normally true — which is the path that needs the bisection solver.
   */
  isNet: boolean
}

export interface CalculatorInputs {
  currentAge: number
  retirementAge: number
  /** Longevity horizon. Default 95. */
  planningAge: number
  /** Gross annual salary / drawings, £. */
  salary: number
  taxRegime: TaxRegime

  /** Aviva and People's Pension as two entries; the list is open-ended. */
  pensionPots: PensionPot[]

  /** What she pays in personally each month, £. */
  personalMonthlyContribution: number
  /**
   * One-off personal top-ups, averaged per year, £. Contractor income arrives
   * in lumps; this models "a good year lets me drop some in". Grossed up for
   * relief at source exactly like the monthly amount.
   */
  personalYearlyLumpSum?: number
  /**
   * Employer / limited-company contribution each month, £. Always gross —
   * never grossed up for tax relief, because employers pay gross already.
   * This is modelled separately because it is the highest-value lever she has.
   */
  employerMonthlyContribution: number
  contributionType: ContributionType
  contributionEscalation: {
    mode: 'none' | 'inflation' | 'salary'
  }

  fundRiskLevel: FundRiskLevel

  otherAssets: OtherAsset[]
  cashISA?: CashISA
  statePension: StatePensionInput

  targetIncome: TargetIncome
  decumulationMethod: DecumulationMethod
}

/**
 * A tax band, with its ceiling measured on TAXABLE income — that is, income
 * above the personal allowance.
 *
 * This matters. Band thresholds are usually quoted as total-income figures
 * (£50,270), but those figures assume a full personal allowance. When the
 * allowance tapers away above £100,000, the bands shift down with it. Modelling
 * the ceilings as absolute would silently lose the 60% effective marginal rate
 * in the taper zone.
 */
export interface TaxBand {
  /** Ceiling on taxable income, or null to run up to the additional-rate threshold. */
  upTo: number | null
  rate: number
}

export interface TaxRegimeConfig {
  /** Ascending bands, measured on taxable income. */
  bands: TaxBand[]
  /** Absolute total income at which the top rate starts. Does not move. */
  additionalRateThreshold: number
  additionalRate: number
}

export interface Assumptions {
  /** Nominal annual growth by fund risk level and scenario. */
  growthRates: Record<FundRiskLevel, Record<Scenario, number>>
  /** CPI, e.g. 0.025. */
  cpi: number
  /** Nominal salary growth, e.g. 0.035. */
  salaryGrowth: number
  /** Safe withdrawal rate by scenario. */
  swr: Record<Scenario, number>
  /** Illustrative annual annuity income per £100k, by age. Never a quote. */
  annuityRatePer100k: Record<number, number>
  taxBands: Record<TaxRegime, TaxRegimeConfig>
  personalAllowance: number
  /** Income above which the personal allowance tapers away. */
  personalAllowanceTaperThreshold: number
  lumpSumAllowance: number
  /** Full new State Pension, £/year. */
  statePensionFullAmount: number
  /** Qualifying years needed for the full State Pension. */
  statePensionFullQualifyingYears: number
  basicRateReliefRate: number
}

/** One year of the projection, shaped to feed Recharts directly. */
export interface YearRow {
  /** 1-indexed from today. */
  year: number
  age: number
  /** Pot value in display currency (real by default). */
  pension: number
  isa: number
  /** Lump sum landing this year, if any. */
  lumpSum: number
  /** Total investable assets. */
  total: number
  cumulativeContributions: number
  cumulativeTaxRelief: number
  cumulativeGrowth: number
  isRetired: boolean
  /** Populated from retirement onwards. */
  statePensionIncome: number
  drawdownGross: number
  incomeGross: number
  incomeNet: number
  targetIncome: number
}

export interface ScenarioResult {
  scenario: Scenario
  rows: YearRow[]
  potAtRetirement: number
  /** 25% tax-free cash available, capped by the Lump Sum Allowance. */
  taxFreeLumpSum: number
  /** Sustainable net income per year, including State Pension once it starts. */
  sustainableNetIncome: number
  /** Set only if the pot runs out before the planning age. */
  potDepletionAge?: number
}

/** The single most important output in the app. */
export interface GapAnalysis {
  projectedNetIncome: number
  targetNetIncome: number
  /** Negative = shortfall, positive = surplus. */
  gap: number
  /** What she'd need to add per month to close a shortfall. 0 if on track. */
  requiredExtraMonthlyContribution: number
  onTrack: boolean
}

export interface ProjectionOutput {
  scenarios: Record<Scenario, ScenarioResult>
  gap: GapAnalysis
  assumptionsUsed: Assumptions
  /** Survivable input problems worth telling her about. */
  warnings: string[]
  /** True if figures are in today's money. */
  inRealTerms: boolean
}

/** Thrown for inputs that make no physical sense. Caught by the form layer. */
export class EngineInputError extends Error {
  constructor(
    message: string,
    /** Which input field to attach the message to. */
    public readonly field: keyof CalculatorInputs | string,
  ) {
    super(message)
    this.name = 'EngineInputError'
  }
}
