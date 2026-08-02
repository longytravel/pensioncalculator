import { describe, it, expect } from 'vitest'
import {
  monthlyPayment,
  amortise,
  overpaymentImpact,
  clearedAtAge,
  equity,
} from './mortgage'

/** Kirsten's mortgage as described: ~£120k left, 12 years, 4.5%. */
const KIRSTEN = {
  balance: 120000,
  annualRate: 0.045,
  yearsRemaining: 12,
  monthlyOverpayment: 0,
}

describe('monthlyPayment', () => {
  it('matches a hand-checked repayment calculation', () => {
    // £120,000 over 144 months at 0.375%/month:
    //   120000 * 0.00375 / (1 - 1.00375^-144) = 450 / 0.41667 = £1,080.01
    expect(monthlyPayment(120000, 0.045, 12)).toBeCloseTo(1080.01, 1)
  })

  it('divides evenly at a zero rate', () => {
    expect(monthlyPayment(120000, 0, 10)).toBeCloseTo(1000, 6)
  })

  it('returns zero for nothing owed or no term', () => {
    expect(monthlyPayment(0, 0.045, 12)).toBe(0)
    expect(monthlyPayment(120000, 0.045, 0)).toBe(0)
  })
})

describe('amortise', () => {
  it('clears the loan in the contractual term', () => {
    const s = amortise(KIRSTEN)
    expect(s.monthsToClear).toBe(144)
    expect(s.rows.at(-1)!.balance).toBeCloseTo(0, 1)
  })

  it('charges plausible total interest', () => {
    const s = amortise(KIRSTEN)
    // Roughly £37k of interest over 12 years on £120k at 4.5%.
    expect(s.totalInterest).toBeGreaterThan(30000)
    expect(s.totalInterest).toBeLessThan(45000)
  })

  it('principal and interest reconcile to the total paid', () => {
    const s = amortise(KIRSTEN)
    const principal = s.rows.reduce((t, r) => t + r.principalPaid, 0)
    const interest = s.rows.reduce((t, r) => t + r.interestPaid, 0)
    expect(principal).toBeCloseTo(KIRSTEN.balance, 0)
    expect(interest).toBeCloseTo(s.totalInterest, 0)
  })

  it('never loops forever when the payment cannot cover the interest', () => {
    // An absurd rate against a tiny payment must still terminate.
    const s = amortise({
      balance: 500000,
      annualRate: 0.11,
      yearsRemaining: 40,
      monthlyOverpayment: 0,
    })
    expect(s.monthsToClear).toBeLessThanOrEqual(1200)
  })

  it('handles nothing owed', () => {
    const s = amortise({ ...KIRSTEN, balance: 0 })
    expect(s.monthsToClear).toBe(0)
    expect(s.totalInterest).toBe(0)
  })
})

describe('overpaymentImpact', () => {
  it('£200 a month saves years and thousands', () => {
    const impact = overpaymentImpact({ ...KIRSTEN, monthlyOverpayment: 200 })
    expect(impact.monthsSaved).toBeGreaterThan(12)
    expect(impact.interestSaved).toBeGreaterThan(3000)
  })

  it('saves nothing when overpaying nothing', () => {
    const impact = overpaymentImpact(KIRSTEN)
    expect(impact.monthsSaved).toBe(0)
    expect(impact.interestSaved).toBeCloseTo(0, 2)
  })

  it('more overpayment always saves more', () => {
    let previous = -1
    for (const extra of [0, 100, 250, 500, 1000]) {
      const { interestSaved } = overpaymentImpact({
        ...KIRSTEN,
        monthlyOverpayment: extra,
      })
      expect(interestSaved).toBeGreaterThanOrEqual(previous)
      previous = interestSaved
    }
  })
})

describe('clearedAtAge', () => {
  it('tells her the age the mortgage ends', () => {
    expect(clearedAtAge(KIRSTEN, 51)).toBe(63)
  })

  it('brings that forward when overpaying', () => {
    const age = clearedAtAge({ ...KIRSTEN, monthlyOverpayment: 300 }, 51)!
    expect(age).toBeLessThan(63)
  })

  it('returns the current age when nothing is owed', () => {
    expect(clearedAtAge({ ...KIRSTEN, balance: 0 }, 51)).toBe(51)
  })
})

describe('equity', () => {
  it('is value less debt', () => {
    expect(equity(400000, 120000)).toBe(280000)
  })

  it('never goes negative', () => {
    expect(equity(200000, 250000)).toBe(0)
  })
})
