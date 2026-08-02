/**
 * Financial primitives.
 *
 * Small, pure, and individually testable. The closed-form annuity maths here is
 * both used by the simulation loop and serves as the oracle its results are
 * checked against.
 */

/**
 * Convert an annual rate to its effective monthly equivalent.
 *
 * Geometric, not `annual / 12` — dividing overstates growth, because it ignores
 * the compounding within the year.
 */
export function toMonthlyRate(annualRate: number): number {
  return Math.pow(1 + annualRate, 1 / 12) - 1
}

/**
 * Net charges off a gross growth rate geometrically.
 *
 * `gross - charge` is the common industry shorthand and is close below ~1%, but
 * this is exact and costs nothing.
 */
export function netOfCharges(grossRate: number, chargeRate: number): number {
  return (1 + grossRate) / (1 + chargeRate) - 1
}

/** Future value of a single lump sum. */
export function futureValueLumpSum(
  present: number,
  rate: number,
  periods: number,
): number {
  return present * Math.pow(1 + rate, periods)
}

/**
 * Future value of a growing annuity-DUE — payments made at the *start* of each
 * period, which is how pension contributions actually work.
 *
 * Handles the r === g singularity, where the general formula divides by zero and
 * the limit is `C * n * (1+r)^(n-1) * (1+r)`.
 */
export function futureValueGrowingAnnuityDue(
  payment: number,
  rate: number,
  growth: number,
  periods: number,
): number {
  if (periods <= 0) return 0
  if (payment === 0) return 0

  // Singular case: the general formula's denominator vanishes.
  if (Math.abs(rate - growth) < 1e-12) {
    return payment * periods * Math.pow(1 + rate, periods - 1) * (1 + rate)
  }

  const numerator = Math.pow(1 + rate, periods) - Math.pow(1 + growth, periods)
  return (payment * numerator * (1 + rate)) / (rate - growth)
}

/**
 * Deflate a nominal future amount into today's money.
 *
 * Applied at display time only. All internal computation stays nominal so that
 * charges, tax bands and contribution escalation remain mutually consistent.
 */
export function toRealTerms(
  nominalValue: number,
  cpi: number,
  years: number,
): number {
  return nominalValue / Math.pow(1 + cpi, years)
}

/**
 * Level annual income that exhausts a pot exactly at the planning age.
 *
 * Annuity-due form: income is drawn at the start of each year. `rate` should be
 * a REAL return, since this solves for a level real income.
 *
 * A planning benchmark, not a promise — running a pot to exactly zero leaves no
 * margin for living longer, so the UI never shows it alone.
 */
export function amortisedIncome(
  pot: number,
  rate: number,
  years: number,
): number {
  if (years <= 0) return 0
  // Zero real return: the pot just divides evenly.
  if (Math.abs(rate) < 1e-12) return pot / years

  const discountFactor = 1 - Math.pow(1 + rate, -years)
  return (pot * rate) / (discountFactor * (1 + rate))
}

/**
 * Inverse of `futureValueGrowingAnnuityDue`: the level payment needed to reach a
 * target future value.
 *
 * Pure algebra — no solver needed, because the growth and rate are fixed inputs.
 */
export function paymentForFutureValue(
  targetFutureValue: number,
  rate: number,
  growth: number,
  periods: number,
): number {
  if (periods <= 0) return 0
  if (targetFutureValue <= 0) return 0

  // Future value produced by a payment of exactly 1, then scale.
  const unitFactor = futureValueGrowingAnnuityDue(1, rate, growth, periods)
  if (unitFactor <= 0) return 0

  return targetFutureValue / unitFactor
}

/**
 * Gross up a net personal contribution for basic-rate relief at source.
 *
 * £80 in becomes £100 in the pot. Only applies to relief-at-source schemes —
 * net pay and salary sacrifice deduct from gross pay already, and employer
 * contributions are never grossed up.
 */
export function grossUpContribution(
  netContribution: number,
  basicRate: number,
): number {
  return netContribution / (1 - basicRate)
}
