/**
 * Contractor tax position.
 *
 * The headline message of this app — that paying surplus company profit
 * straight into a pension beats taking it as a dividend — is only true in some
 * working arrangements. IR35 status decides which. Getting this wrong would
 * mean confidently telling someone to do something they cannot do, so the
 * status is an explicit input with an honest "I don't know" default rather
 * than an assumption.
 *
 * Figures are 2026/27. Sources in research/contractor-tax.md.
 */

export type WorkingArrangement =
  | 'ltd_outside_ir35'
  | 'ltd_inside_ir35'
  | 'umbrella'
  | 'employee'
  | 'sole_trader'
  | 'unknown'

export interface ContractorRates {
  /** Corporation Tax on profits up to the small profits limit. */
  smallProfitsRate: number
  smallProfitsLimit: number
  mainRate: number
  mainRateThreshold: number
  /** Dividend tax by band. Rose 2pp in April 2026. */
  dividendRates: { basic: number; higher: number; additional: number }
  dividendAllowance: number
  personalAllowance: number
  basicRateLimit: number
  higherRateLimit: number
  /** Salary floor at which a year still counts toward the State Pension. */
  lowerEarningsLimit: number
  /** The usual director salary: full personal allowance, qualifying year. */
  recommendedDirectorSalary: number
  annualAllowance: number
}

export const CONTRACTOR_RATES_2026_27: ContractorRates = {
  smallProfitsRate: 0.19,
  smallProfitsLimit: 50000,
  mainRate: 0.25,
  mainRateThreshold: 250000,
  dividendRates: { basic: 0.1075, higher: 0.3575, additional: 0.3935 },
  dividendAllowance: 500,
  personalAllowance: 12570,
  basicRateLimit: 50270,
  higherRateLimit: 125140,
  lowerEarningsLimit: 6708,
  recommendedDirectorSalary: 12570,
  annualAllowance: 60000,
}

/**
 * Whether company pension contributions are actually available to her.
 *
 * This gates the app's strongest piece of guidance.
 */
export function companyContributionsAvailable(
  arrangement: WorkingArrangement,
): { available: boolean | 'uncertain'; explanation: string } {
  switch (arrangement) {
    case 'ltd_outside_ir35':
      return {
        available: true,
        explanation:
          'Your company can pay into your pension directly, out of profit, before Corporation Tax. This is usually the most tax-efficient thing you can do with money you do not need to take out.',
      }

    case 'ltd_inside_ir35':
      return {
        available: 'uncertain',
        explanation:
          'This one needs checking. When a contract is inside IR35, the agency or client normally takes income tax and National Insurance off before the money reaches your company — so there is often no untaxed profit left to pay into a pension from. Some fee-payers will agree to pay part of the contract straight into your pension before tax instead, but that is a negotiation, not something you can do on your own afterwards. Personal contributions from your own money still work as normal. Ask your accountant about your specific contract.',
      }

    case 'umbrella':
      return {
        available: true,
        explanation:
          'Umbrella companies are proper employers with normal payroll, so salary sacrifice into a pension is usually straightforward and works well. Ask them what pension scheme they use and what its charges are.',
      }

    case 'employee':
      return {
        available: true,
        explanation:
          'Your employer contributes, and you may be able to increase your own contributions through salary sacrifice — which saves National Insurance as well as income tax. Worth asking your payroll team.',
      }

    case 'sole_trader':
      return {
        available: false,
        explanation:
          'As a sole trader there is no separate company to pay in on your behalf, so contributions come from you personally. You still get tax relief on them — pay in £80 and £100 lands in the pension.',
      }

    case 'unknown':
      return {
        available: 'uncertain',
        explanation:
          'We need to know how you are engaged before we can say. If you work through your own limited company for a large client, they are the ones who decide your IR35 status, and they must give you a Status Determination Statement saying so. It is worth finding — it changes what your best options are.',
      }
  }
}

/** Corporation Tax, including marginal relief between the two thresholds. */
export function corporationTax(
  profit: number,
  rates: ContractorRates = CONTRACTOR_RATES_2026_27,
): number {
  if (profit <= 0) return 0
  if (profit <= rates.smallProfitsLimit) return profit * rates.smallProfitsRate
  if (profit >= rates.mainRateThreshold) return profit * rates.mainRate

  // Marginal relief tapers between the small profits limit and the main rate
  // threshold, so the effective rate climbs smoothly from 19% to 25%.
  const marginalReliefFraction = 3 / 200
  const relief =
    (rates.mainRateThreshold - profit) * marginalReliefFraction
  return profit * rates.mainRate - relief
}

/** Dividend tax, given her other taxable income. */
export function dividendTax(
  dividend: number,
  otherIncome: number,
  rates: ContractorRates = CONTRACTOR_RATES_2026_27,
): number {
  if (dividend <= 0) return 0

  const allowanceUsed = Math.min(dividend, rates.dividendAllowance)
  let remaining = dividend - allowanceUsed
  if (remaining <= 0) return 0

  // Dividends sit on top of other income, and the allowance still uses up band.
  let position = otherIncome + allowanceUsed
  let tax = 0

  const bands: Array<{ ceiling: number; rate: number }> = [
    { ceiling: rates.personalAllowance, rate: 0 },
    { ceiling: rates.basicRateLimit, rate: rates.dividendRates.basic },
    { ceiling: rates.higherRateLimit, rate: rates.dividendRates.higher },
    { ceiling: Infinity, rate: rates.dividendRates.additional },
  ]

  for (const band of bands) {
    if (remaining <= 0) break
    if (position >= band.ceiling) continue

    const slice = Math.min(remaining, band.ceiling - position)
    tax += slice * band.rate
    position += slice
    remaining -= slice
  }

  return tax
}

export interface DividendVsPension {
  profit: number
  /** Cash in her hand if taken as a dividend. */
  dividendNet: number
  corporationTaxPaid: number
  dividendTaxPaid: number
  /** Amount landing in the pension if paid in as an employer contribution. */
  pensionValue: number
  /** How much more ends up working for her via the pension route. */
  advantage: number
  /** Multiple of the dividend route. */
  ratio: number
}

/**
 * The comparison that matters most for a contractor with surplus company cash.
 *
 * Deliberately compares like for like at the point of the decision: cash in
 * hand today versus money invested in the pension today. It does not attempt
 * to net down the pension for the tax she will eventually pay on withdrawal —
 * that depends on her income in retirement, 25% of it is tax-free anyway, and
 * folding it in here would hide the mechanism the number is meant to show.
 * The UI says as much next to the figure.
 */
export function dividendVersusPension(
  profit: number,
  otherIncome: number,
  rates: ContractorRates = CONTRACTOR_RATES_2026_27,
): DividendVsPension {
  if (profit <= 0) {
    return {
      profit: 0,
      dividendNet: 0,
      corporationTaxPaid: 0,
      dividendTaxPaid: 0,
      pensionValue: 0,
      advantage: 0,
      ratio: 0,
    }
  }

  // Dividend route: Corporation Tax first, then dividend tax on what's left.
  const ct = corporationTax(profit, rates)
  const distributable = profit - ct
  const divTax = dividendTax(distributable, otherIncome, rates)
  const dividendNet = distributable - divTax

  // Pension route: an allowable business expense, so no Corporation Tax and
  // no National Insurance. The whole amount lands in the pension.
  const pensionValue = Math.min(profit, rates.annualAllowance)

  return {
    profit,
    dividendNet: round(dividendNet),
    corporationTaxPaid: round(ct),
    dividendTaxPaid: round(divTax),
    pensionValue: round(pensionValue),
    advantage: round(pensionValue - dividendNet),
    ratio: dividendNet > 0 ? Number((pensionValue / dividendNet).toFixed(2)) : 0,
  }
}

/**
 * Whether a salary level earns a State Pension qualifying year.
 *
 * Contractors on a low-salary, high-dividend split sometimes drop below the
 * threshold without realising, quietly costing themselves State Pension years
 * that are worth far more than the tax saved.
 */
export function earnsQualifyingYear(
  annualSalary: number,
  rates: ContractorRates = CONTRACTOR_RATES_2026_27,
): boolean {
  return annualSalary >= rates.lowerEarningsLimit
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}
