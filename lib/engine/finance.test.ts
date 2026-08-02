import { describe, it, expect } from 'vitest'
import {
  toMonthlyRate,
  netOfCharges,
  futureValueLumpSum,
  futureValueGrowingAnnuityDue,
  toRealTerms,
  amortisedIncome,
  paymentForFutureValue,
  grossUpContribution,
} from './finance'

describe('toMonthlyRate', () => {
  it('compounds geometrically, not by dividing by 12', () => {
    const monthly = toMonthlyRate(0.05)
    expect(monthly).toBeCloseTo(0.0040741, 6)
    // Twelve of them must reproduce the annual rate exactly.
    expect(Math.pow(1 + monthly, 12) - 1).toBeCloseTo(0.05, 12)
    // And it must be strictly less than the naive answer.
    expect(monthly).toBeLessThan(0.05 / 12)
  })
})

describe('netOfCharges', () => {
  it('nets charges geometrically', () => {
    // 8% gross with a 0.5% charge is 7.4627%, not 7.5%.
    expect(netOfCharges(0.08, 0.005)).toBeCloseTo(0.0746269, 7)
  })

  it('differs from naive subtraction by a few basis points', () => {
    const geometric = netOfCharges(0.08, 0.005)
    const naive = 0.08 - 0.005
    expect(naive - geometric).toBeGreaterThan(0.0003)
    expect(naive - geometric).toBeLessThan(0.0005)
  })
})

describe('futureValueLumpSum', () => {
  it('matches the worked test case', () => {
    // £100,000 at 5% for 10 years.
    expect(futureValueLumpSum(100000, 0.05, 10)).toBeCloseTo(162889.46, 2)
  })
})

describe('futureValueGrowingAnnuityDue', () => {
  it('pays at the start of the period, not the end', () => {
    // One period: a due annuity has already earned a period of growth.
    expect(futureValueGrowingAnnuityDue(100, 0.05, 0, 1)).toBeCloseTo(105, 10)
  })

  it('handles level contributions with no escalation', () => {
    // £500/month for 20 years at 5% nominal.
    const monthly = toMonthlyRate(0.05)
    const fv = futureValueGrowingAnnuityDue(500, monthly, 0, 240)
    // Sanity band from the research spec.
    expect(fv).toBeGreaterThan(200000)
    expect(fv).toBeLessThan(210000)
  })

  it('handles the r === g singularity without dividing by zero', () => {
    const fv = futureValueGrowingAnnuityDue(1000, 0.04, 0.04, 10)
    expect(Number.isFinite(fv)).toBe(true)
    // Limiting case: C * n * (1+r)^(n-1) * (1+r)
    expect(fv).toBeCloseTo(1000 * 10 * Math.pow(1.04, 9) * 1.04, 6)
  })

  it('is continuous either side of the singularity', () => {
    const justBelow = futureValueGrowingAnnuityDue(1000, 0.04, 0.039999, 10)
    const exactly = futureValueGrowingAnnuityDue(1000, 0.04, 0.04, 10)
    const justAbove = futureValueGrowingAnnuityDue(1000, 0.04, 0.040001, 10)

    // Relative, not absolute: the general formula suffers catastrophic
    // cancellation this close to r === g, so a few pence of drift on £14,800 is
    // expected. What matters is that the branch doesn't jump.
    expect(Math.abs(justBelow - exactly) / exactly).toBeLessThan(1e-5)
    expect(Math.abs(justAbove - exactly) / exactly).toBeLessThan(1e-5)
  })

  it('returns zero for no periods or no payment', () => {
    expect(futureValueGrowingAnnuityDue(500, 0.05, 0, 0)).toBe(0)
    expect(futureValueGrowingAnnuityDue(0, 0.05, 0, 120)).toBe(0)
  })
})

describe('toRealTerms', () => {
  it('matches the worked test case', () => {
    // £50,000 growing at 5% for 20 years, deflated at 2.5% CPI.
    const nominal = futureValueLumpSum(50000, 0.05, 20)
    expect(nominal).toBeCloseTo(132664.89, 2)
    // The research spec quotes ~£80,955 here, but that was derived from a
    // rounded nominal and a rounded deflator. Computed exactly it is £80,961.52.
    expect(toRealTerms(nominal, 0.025, 20)).toBeCloseTo(80961.52, 2)
  })
})

describe('amortisedIncome', () => {
  it('exhausts the pot over the period', () => {
    const pot = 300000
    const rate = 0.02
    const years = 30
    const income = amortisedIncome(pot, rate, years)

    // Draw at the start of each year, grow the remainder, and land near zero.
    let balance = pot
    for (let i = 0; i < years; i++) {
      balance = (balance - income) * (1 + rate)
    }
    expect(Math.abs(balance)).toBeLessThan(0.01)
  })

  it('divides evenly at a zero real return', () => {
    expect(amortisedIncome(300000, 0, 30)).toBeCloseTo(10000, 6)
  })

  it('returns zero for a non-positive horizon', () => {
    expect(amortisedIncome(300000, 0.02, 0)).toBe(0)
  })
})

describe('paymentForFutureValue', () => {
  it('round-trips against the forward calculation', () => {
    // The single highest-value regression test: forward then inverse must
    // return the original contribution, with no external reference needed.
    const monthly = toMonthlyRate(0.05)
    const target = futureValueGrowingAnnuityDue(500, monthly, 0, 240)
    expect(paymentForFutureValue(target, monthly, 0, 240)).toBeCloseTo(500, 6)
  })

  it('round-trips with escalating contributions too', () => {
    const monthly = toMonthlyRate(0.06)
    const escalation = toMonthlyRate(0.03)
    const target = futureValueGrowingAnnuityDue(325, monthly, escalation, 300)
    expect(paymentForFutureValue(target, monthly, escalation, 300)).toBeCloseTo(
      325,
      6,
    )
  })

  it('returns zero when there is nothing to fund', () => {
    expect(paymentForFutureValue(0, 0.004, 0, 240)).toBe(0)
    expect(paymentForFutureValue(-100, 0.004, 0, 240)).toBe(0)
  })
})

describe('grossUpContribution', () => {
  it('turns £80 into £100', () => {
    expect(grossUpContribution(80, 0.2)).toBeCloseTo(100, 10)
  })
})
