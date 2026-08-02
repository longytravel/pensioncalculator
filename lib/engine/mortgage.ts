/**
 * Mortgage maths.
 *
 * Separate from the pension engine because it answers a different question, but
 * it feeds into it: whether the mortgage is gone by retirement decides how much
 * income she actually needs. Every published "retirement income" figure,
 * including the lifestyle standards this app uses, assumes no mortgage.
 */

export interface MortgageInputs {
  balance: number
  /** Annual nominal rate as a decimal, e.g. 0.045. */
  annualRate: number
  yearsRemaining: number
  /** Voluntary extra payment each month, on top of the contractual one. */
  monthlyOverpayment: number
}

export interface MortgageSchedule {
  /** Contractual monthly payment, excluding any overpayment. */
  monthlyPayment: number
  /** Months until cleared, including overpayments. */
  monthsToClear: number
  /** Total interest paid over the life of the loan. */
  totalInterest: number
  rows: MortgageYear[]
}

export interface MortgageYear {
  year: number
  age?: number
  balance: number
  interestPaid: number
  principalPaid: number
}

export interface OverpaymentImpact {
  monthsSaved: number
  interestSaved: number
  clearedAfterMonths: number
  baselineMonths: number
}

/**
 * Standard repayment formula.
 *
 * At a zero rate the loan simply divides evenly across the term, which the
 * general formula cannot express (it divides by zero).
 */
export function monthlyPayment(
  balance: number,
  annualRate: number,
  yearsRemaining: number,
): number {
  const n = Math.round(yearsRemaining * 12)
  if (n <= 0 || balance <= 0) return 0

  const r = annualRate / 12
  if (Math.abs(r) < 1e-12) return balance / n

  return (balance * r) / (1 - Math.pow(1 + r, -n))
}

/**
 * Amortise the loan month by month.
 *
 * Capped at 100 years of iterations so a pathological rate/payment combination
 * cannot spin forever — if the payment never covers the interest, the balance
 * never falls and the loop must still terminate.
 */
export function amortise(inputs: MortgageInputs): MortgageSchedule {
  const { balance, annualRate, yearsRemaining, monthlyOverpayment } = inputs
  const payment = monthlyPayment(balance, annualRate, yearsRemaining)

  if (balance <= 0 || payment <= 0) {
    return { monthlyPayment: 0, monthsToClear: 0, totalInterest: 0, rows: [] }
  }

  const r = annualRate / 12
  const maxMonths = 1200

  let outstanding = balance
  let totalInterest = 0
  let months = 0

  const rows: MortgageYear[] = []
  let yearInterest = 0
  let yearPrincipal = 0

  while (outstanding > 0.005 && months < maxMonths) {
    const interest = outstanding * r
    const due = Math.min(payment + monthlyOverpayment, outstanding + interest)
    const principal = due - interest

    // A payment that doesn't cover the interest can never clear the debt.
    if (principal <= 0) break

    outstanding = Math.max(0, outstanding - principal)
    totalInterest += interest
    yearInterest += interest
    yearPrincipal += principal
    months++

    if (months % 12 === 0 || outstanding <= 0.005) {
      rows.push({
        year: Math.ceil(months / 12),
        balance: round(outstanding),
        interestPaid: round(yearInterest),
        principalPaid: round(yearPrincipal),
      })
      yearInterest = 0
      yearPrincipal = 0
    }
  }

  return {
    monthlyPayment: round(payment),
    monthsToClear: months,
    totalInterest: round(totalInterest),
    rows,
  }
}

/** What overpaying actually buys her, in months and pounds. */
export function overpaymentImpact(inputs: MortgageInputs): OverpaymentImpact {
  const baseline = amortise({ ...inputs, monthlyOverpayment: 0 })
  const withExtra = amortise(inputs)

  return {
    baselineMonths: baseline.monthsToClear,
    clearedAfterMonths: withExtra.monthsToClear,
    monthsSaved: baseline.monthsToClear - withExtra.monthsToClear,
    interestSaved: round(baseline.totalInterest - withExtra.totalInterest),
  }
}

/**
 * The age at which the mortgage is cleared.
 *
 * Worth surfacing next to the retirement age: carrying a mortgage past the day
 * the income stops changes the plan materially.
 */
export function clearedAtAge(
  inputs: MortgageInputs,
  currentAge: number,
): number | null {
  const { monthsToClear } = amortise(inputs)
  if (monthsToClear === 0) return currentAge
  if (monthsToClear >= 1200) return null
  return currentAge + Math.ceil(monthsToClear / 12)
}

/** Property value less what is still owed. */
export function equity(houseValue: number, mortgageBalance: number): number {
  return Math.max(0, houseValue - mortgageBalance)
}

/**
 * Overpaying a mortgage is a guaranteed, risk-free return equal to the interest
 * rate. Comparing it against a pension contribution is not apples to apples —
 * the pension gets tax relief and may grow faster, but it is locked away until
 * 57 and its return is uncertain. This returns the figures for that comparison
 * rather than a verdict, because the right answer depends on her circumstances.
 */
export function overpayVersusPension(
  monthlyAmount: number,
  mortgage: MortgageInputs,
  years: number,
  pensionGrossUp: number,
  pensionNetGrowthRate: number,
): {
  interestSavedByOverpaying: number
  pensionValueAfterYears: number
  guaranteedReturn: number
} {
  const impact = overpaymentImpact({
    ...mortgage,
    monthlyOverpayment: monthlyAmount,
  })

  // The same money into a pension, grossed up and compounded.
  const monthlyGross = monthlyAmount * pensionGrossUp
  const monthlyRate = Math.pow(1 + pensionNetGrowthRate, 1 / 12) - 1
  const n = Math.round(years * 12)

  const pensionValue =
    monthlyRate === 0
      ? monthlyGross * n
      : (monthlyGross * (Math.pow(1 + monthlyRate, n) - 1) * (1 + monthlyRate)) /
        monthlyRate

  return {
    interestSavedByOverpaying: impact.interestSaved,
    pensionValueAfterYears: round(pensionValue),
    guaranteedReturn: mortgage.annualRate,
  }
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}
