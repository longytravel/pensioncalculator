/**
 * UK income tax on pension income.
 *
 * The single highest bug-risk function in the codebase, so it is deliberately
 * boring: a straight band-walk, parameterised by a bands table so Scotland is
 * just different data rather than a second code path.
 *
 * No National Insurance is charged on any pension income, at any age.
 */

import type { Assumptions, TaxRegime } from './types'

export interface TaxResult {
  gross: number
  tax: number
  net: number
  /** Rate applied to the next £1 — used for "what this actually costs you". */
  marginalRate: number
}

/**
 * Personal allowance after the taper.
 *
 * Reduced by £1 for every £2 of income above the threshold, reaching zero at
 * £125,140 on the standard 2026/27 figures.
 */
export function personalAllowanceAfterTaper(
  totalIncome: number,
  assumptions: Assumptions,
): number {
  const { personalAllowance, personalAllowanceTaperThreshold } = assumptions
  if (totalIncome <= personalAllowanceTaperThreshold) return personalAllowance

  const excess = totalIncome - personalAllowanceTaperThreshold
  return Math.max(0, personalAllowance - excess / 2)
}

/**
 * Income tax on a total gross income.
 *
 * Walks the bands on *taxable* income (gross minus the personal allowance), so
 * that a tapered allowance correctly drags the higher-rate threshold down with
 * it. The additional-rate threshold alone is absolute and does not move — which
 * is precisely what produces the 60% effective marginal rate between £100,000
 * and £125,140.
 */
export function incomeTax(
  grossIncome: number,
  regime: TaxRegime,
  assumptions: Assumptions,
): TaxResult {
  if (grossIncome <= 0) {
    return { gross: 0, tax: 0, net: 0, marginalRate: 0 }
  }

  const config = assumptions.taxBands[regime]
  const allowance = personalAllowanceAfterTaper(grossIncome, assumptions)
  const taxable = Math.max(0, grossIncome - allowance)

  if (taxable === 0) {
    return { gross: grossIncome, tax: 0, net: grossIncome, marginalRate: 0 }
  }

  // Where the top rate begins, expressed on taxable income.
  const additionalCeiling = Math.max(
    0,
    config.additionalRateThreshold - allowance,
  )

  let tax = 0
  let marginalRate = 0
  let floor = 0

  for (const band of config.bands) {
    const ceiling = Math.min(band.upTo ?? additionalCeiling, additionalCeiling)
    if (taxable <= floor) break

    const slice = Math.min(taxable, ceiling) - floor
    if (slice > 0) {
      tax += slice * band.rate
      marginalRate = band.rate
    }

    floor = ceiling
    if (taxable <= ceiling) break
  }

  if (taxable > additionalCeiling) {
    tax += (taxable - additionalCeiling) * config.additionalRate
    marginalRate = config.additionalRate
  }

  return {
    gross: grossIncome,
    tax,
    net: grossIncome - tax,
    marginalRate,
  }
}

/**
 * Net income from a drawdown plus the State Pension.
 *
 * The State Pension is taxable but paid gross, so in practice it uses up the
 * personal allowance first and the drawdown is taxed on top. Combining them and
 * taxing the total achieves exactly that, and avoids double-counting the
 * allowance.
 *
 * Any tax-free lump sum is handled *before* this — it is not income.
 */
export function grossToNet(
  drawdownGross: number,
  statePensionGross: number,
  regime: TaxRegime,
  assumptions: Assumptions,
): TaxResult {
  return incomeTax(
    Math.max(0, drawdownGross) + Math.max(0, statePensionGross),
    regime,
    assumptions,
  )
}

/**
 * Find the gross income that yields a given net income.
 *
 * The tax function is a piecewise-linear band walk with an allowance taper, so
 * it has no clean algebraic inverse. Bisection is simple, robust, and converges
 * to well under a penny — and this runs once per interaction, so speed is
 * irrelevant.
 *
 * This path matters because Kirsten thinks in take-home money.
 */
export function solveGrossForNet(
  targetNet: number,
  regime: TaxRegime,
  assumptions: Assumptions,
  maxIterations = 60,
): number {
  if (targetNet <= 0) return 0

  let low = targetNet
  // Net can never exceed gross, and no UK rate reaches 50%, so 2x always brackets.
  let high = targetNet * 2

  // Widen defensively in case an exotic bands table breaks that assumption.
  while (incomeTax(high, regime, assumptions).net < targetNet) {
    high *= 2
    if (high > 1e12) break
  }

  for (let i = 0; i < maxIterations; i++) {
    const mid = (low + high) / 2
    const { net } = incomeTax(mid, regime, assumptions)

    if (Math.abs(net - targetNet) < 0.005) return mid
    if (net < targetNet) low = mid
    else high = mid
  }

  return (low + high) / 2
}

/**
 * What a pension contribution actually costs her after tax relief.
 *
 * For relief at source, £100 in the pot costs £80 for a basic-rate taxpayer.
 * Higher-rate relief arrives as a reduced tax bill via Self Assessment — it is
 * NOT extra money in the pot, and conflating the two is a common and expensive
 * misunderstanding.
 */
export function netCostOfContribution(
  grossContribution: number,
  marginalRate: number,
): { cost: number; basicRateRelief: number; higherRateRefund: number } {
  const basicRateRelief = grossContribution * 0.2
  const higherRateRefund =
    marginalRate > 0.2 ? grossContribution * (marginalRate - 0.2) : 0

  return {
    cost: grossContribution - basicRateRelief - higherRateRefund,
    basicRateRelief,
    higherRateRefund,
  }
}
