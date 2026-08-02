/**
 * The advisory layer.
 *
 * One pure entry point, `advise(state)`, returning everything the app says to
 * her: what each answer means, what to actually do, and what to ask her
 * accountant. Nothing is stored, nothing is hardcoded to today's assumptions
 * about her, and equal states always produce equal advice.
 *
 * Every figure comes from the projection engine — either read from a run, or
 * computed as the difference between two runs. Nothing is worked out in the
 * copy, because copy-time arithmetic is how a tool ends up saying two
 * different numbers for the same thing.
 */

import type { CalculatorValues, FieldName } from '@/lib/fields'
import type {
  CalculatorInputs,
  DecumulationMethod,
  FundRiskLevel,
  ProjectionOutput,
  TaxRegime,
} from '@/lib/engine/types'
import type { WorkingArrangement } from '@/lib/engine/contractor'

/** Everything the advisory layer is allowed to read. */
export interface AdviceState {
  values: CalculatorValues
  unknown: Partial<Record<FieldName, boolean>>
  workingArrangement: WorkingArrangement
  fundRiskLevel: FundRiskLevel
  contributionType: CalculatorInputs['contributionType']
  contributionEscalation: CalculatorInputs['contributionEscalation']['mode']
  decumulationMethod: DecumulationMethod
  taxRegime: TaxRegime
  taperingStyle: 'cliff' | 'taper' | 'unsure'
  lumpSumIntent: 'yes' | 'maybe' | 'no'
  downsizeIntent: 'yes' | 'maybe' | 'no'
  legacyIntent: 'yes' | 'maybe' | 'no'
  region: 'uk' | 'london'
  household: 'single' | 'couple'
  inRealTerms: boolean
}

/** Figures derived once and shared across every rule. */
export interface Derived {
  projection: ProjectionOutput
  /** Projected net income, per month, today's money. */
  projectedMonthly: number
  targetMonthly: number
  /** Positive when she is short. */
  shortfallMonthly: number
  onTrack: boolean
  yearsToRetirement: number
  /** Years until she can touch a pension at all. */
  yearsTo57: number
  /** True when she wants to stop before her pensions unlock. */
  hasBridgeGap: boolean
  bridgeYears: number
  totalPensionNow: number
  homeEquity: number
  mortgageMonthly: number
  mortgageClearAge: number | null
  mortgageClearsBeforeRetiring: boolean
  /** What downsizing would actually free, after clearing the mortgage. */
  realisticDownsizeRelease: number
  statePensionMonthly: number
  missingNiYears: number
  companyRoute: { available: boolean | 'uncertain'; explanation: string }
  /** Net in hand versus into the pension, on £10,000 of company profit. */
  tenKDividendNet: number
}

export type Severity = 'good' | 'watch' | 'act'

export interface Insight {
  id: string
  /** Only one insight per topic is shown at a time. */
  topic: string
  severity: Severity
  headline: string
  detail: string
  action?: InsightAction
}

export interface InsightAction {
  label: string
  kind: 'guide' | 'field' | 'accountant' | 'link'
  target: string
}

export interface RankedAction {
  id: string
  headline: string
  detail: string
  /** Impact in pounds per month of retirement income. */
  impactMonthly: number
  /** 1 = a fifteen-minute job, 5 = changes how she lives. */
  effort: 1 | 2 | 3 | 4 | 5
  effortLabel: string
  /** Ordering score. Higher is better. */
  score: number
  firstStep: string
  /** Set when the real action is blocked by something unknown. */
  unlocks?: string
}

export interface AccountantQuestion {
  id: string
  question: string
  why: string
  goodAnswer: string
  priority: number
}

export interface Advice {
  insights: Insight[]
  actions: RankedAction[]
  accountantQuestions: AccountantQuestion[]
  emailBody: string
  derived: Derived
}
