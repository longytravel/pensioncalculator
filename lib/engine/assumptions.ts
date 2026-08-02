/**
 * Default assumptions, 2026/27 tax year.
 *
 * Every figure here is sourced in research/uk-pension-rules.md and
 * research/projection-maths.md. They are all adjustable in the UI, and the UI
 * shows where each one comes from — a projection whose assumptions are hidden
 * is not honest.
 */

import type { Assumptions } from './types'

/**
 * FCA COBS 13 Annex 2 projection rates.
 *
 * Important: these are regulatory *maximums*, not forecasts. Real fund-specific
 * rates are often lower. The UI says so.
 */
export const DEFAULT_ASSUMPTIONS: Assumptions = {
  growthRates: {
    growth: { low: 0.02, mid: 0.05, high: 0.08 },
    balanced: { low: 0.015, mid: 0.0425, high: 0.0675 },
    cautious: { low: 0.01, mid: 0.035, high: 0.055 },
  },

  cpi: 0.025,
  salaryGrowth: 0.035,

  /**
   * Deliberately below the American 4% rule. Morningstar's 2026 UK figure is
   * 3.7–3.9% and Vanguard UK says 3–4%, because UK real returns and charges are
   * less forgiving than the US backtest the 4% rule came from.
   */
  swr: { low: 0.03, mid: 0.035, high: 0.04 },

  /**
   * Illustrative only — never presented as a quote. Annuity rates move with gilt
   * yields and providers disagree by roughly 15%. Level, single life, no guarantee.
   */
  annuityRatePer100k: {
    55: 4800,
    60: 5200,
    65: 5500,
    67: 5900,
    70: 6600,
    75: 8000,
  },

  /**
   * Ceilings are on TAXABLE income (above the personal allowance), so the bands
   * shift down correctly when the allowance tapers. Widths derived from the
   * published total-income thresholds minus the standard £12,570 allowance:
   * England & Wales basic rate is £50,270 − £12,570 = £37,700 wide.
   */
  taxBands: {
    englandWales: {
      bands: [
        { upTo: 37700, rate: 0.2 },
        { upTo: null, rate: 0.4 },
      ],
      additionalRateThreshold: 125140,
      additionalRate: 0.45,
    },
    scotland: {
      bands: [
        { upTo: 2827, rate: 0.19 }, // starter, to £15,397
        { upTo: 14921, rate: 0.2 }, // basic, to £27,491
        { upTo: 31092, rate: 0.21 }, // intermediate, to £43,662
        { upTo: 62430, rate: 0.42 }, // higher, to £75,000
        { upTo: null, rate: 0.45 }, // advanced, to £125,140
      ],
      additionalRateThreshold: 125140,
      additionalRate: 0.48, // top rate
    },
  },

  personalAllowance: 12570,
  personalAllowanceTaperThreshold: 100000,

  /** Replaced the Lifetime Allowance in April 2024. */
  lumpSumAllowance: 268275,

  /** £241.30/week, 2026/27. */
  statePensionFullAmount: 12547.6,
  statePensionFullQualifyingYears: 35,

  basicRateReliefRate: 0.2,
}

/**
 * PLSA / Pensions UK Retirement Living Standards, published 3 June 2026
 * (modelling by Loughborough University).
 *
 * This table is how the app answers "how the hell do I know how much I need
 * per month". Figures assume the person is MORTGAGE-FREE and exclude care costs
 * — a caveat the UI ties directly to the house-sale input rather than burying.
 *
 * UK-wide figures are triple-corroborated. London figures come from a single
 * primary source and want a human eyeball before launch.
 */
export const RETIREMENT_LIVING_STANDARDS = {
  uk: {
    minimum: { single: 13900, couple: 22500 },
    moderate: { single: 32700, couple: 45400 },
    comfortable: { single: 45400, couple: 62700 },
  },
  london: {
    minimum: { single: 14600, couple: 24100 },
    moderate: { single: 34000, couple: 47000 },
    comfortable: { single: 47200, couple: 64800 },
  },
} as const

export type LivingStandard = 'minimum' | 'moderate' | 'comfortable'
export type Household = 'single' | 'couple'
export type Region = 'uk' | 'london'

/** Allowances and limits she may bump into. Displayed in the guides. */
export const LIMITS_2026_27 = {
  annualAllowance: 60000,
  moneyPurchaseAnnualAllowance: 10000,
  carryForwardYears: 3,
  isaAllowance: 20000,
  /** Non-earners can still get relief on this much gross. */
  nonEarnerGrossLimit: 3600,
  autoEnrolmentLowerBand: 6240,
  autoEnrolmentUpperBand: 50270,
  /** Normal minimum pension age. Rises to 57 on 6 April 2028. */
  normalMinimumPensionAge: 55,
  normalMinimumPensionAgeFrom2028: 57,
} as const
