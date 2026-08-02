import { describe, it, expect } from 'vitest'
import {
  corporationTax,
  dividendTax,
  dividendVersusPension,
  companyContributionsAvailable,
  earnsQualifyingYear,
  CONTRACTOR_RATES_2026_27 as R,
  type WorkingArrangement,
} from './contractor'

describe('corporationTax', () => {
  it('charges 19% up to the small profits limit', () => {
    expect(corporationTax(50000)).toBeCloseTo(9500, 2)
    expect(corporationTax(30000)).toBeCloseTo(5700, 2)
  })

  it('charges 25% above the main rate threshold', () => {
    expect(corporationTax(300000)).toBeCloseTo(75000, 2)
  })

  it('tapers smoothly through marginal relief', () => {
    const at100k = corporationTax(100000)
    // 100,000 * 25% - (250,000 - 100,000) * 3/200 = 25,000 - 2,250 = 22,750
    expect(at100k).toBeCloseTo(22750, 2)

    // The effective rate must sit between the two headline rates.
    const effective = at100k / 100000
    expect(effective).toBeGreaterThan(R.smallProfitsRate)
    expect(effective).toBeLessThan(R.mainRate)
  })

  it('is continuous at both thresholds', () => {
    expect(corporationTax(50001)).toBeCloseTo(corporationTax(50000), 0)
    expect(corporationTax(249999)).toBeCloseTo(corporationTax(250000), 0)
  })

  it('is zero for no profit or a loss', () => {
    expect(corporationTax(0)).toBe(0)
    expect(corporationTax(-5000)).toBe(0)
  })
})

describe('dividendTax', () => {
  it('charges nothing within the £500 allowance', () => {
    expect(dividendTax(500, 12570)).toBe(0)
  })

  it('charges the basic rate above the allowance', () => {
    // £10,500 dividend on top of a £12,570 salary: £500 free, £10,000 at 10.75%.
    expect(dividendTax(10500, 12570)).toBeCloseTo(1075, 2)
  })

  it('charges the higher rate once the basic band is used up', () => {
    // Salary at the basic rate limit, so all dividend beyond the allowance is
    // taxed at the higher rate.
    expect(dividendTax(10500, 50270)).toBeCloseTo(10000 * 0.3575, 2)
  })

  it('splits correctly across a band boundary', () => {
    // Salary £40,270 leaves £10,000 of basic band. £20,500 dividend:
    // £500 allowance (uses band), £9,500 at 10.75%, £10,500 at 35.75%.
    const tax = dividendTax(20500, 40270)
    expect(tax).toBeCloseTo(9500 * 0.1075 + 10500 * 0.3575, 2)
  })

  it('reflects the April 2026 rate rise', () => {
    expect(R.dividendRates.basic).toBe(0.1075)
    expect(R.dividendRates.higher).toBe(0.3575)
  })

  it('is zero for no dividend', () => {
    expect(dividendTax(0, 50000)).toBe(0)
  })
})

describe('dividendVersusPension', () => {
  it('favours the pension for surplus profit', () => {
    const r = dividendVersusPension(10000, 50270)
    expect(r.pensionValue).toBe(10000)
    expect(r.advantage).toBeGreaterThan(0)
    // Roughly: £10k profit -> £1,900 CT -> £8,100 -> £2,717 dividend tax
    // -> about £5,383 in hand, versus £10,000 into the pension.
    expect(r.dividendNet).toBeCloseTo(5383, 0)
    expect(r.ratio).toBeGreaterThan(1.8)
  })

  it('is less dramatic for a basic-rate taxpayer, but still favourable', () => {
    const r = dividendVersusPension(10000, 12570)
    expect(r.advantage).toBeGreaterThan(0)
    expect(r.ratio).toBeLessThan(dividendVersusPension(10000, 50270).ratio)
  })

  it('caps the pension route at the annual allowance', () => {
    const r = dividendVersusPension(80000, 50270)
    expect(r.pensionValue).toBe(R.annualAllowance)
  })

  it('handles zero profit', () => {
    const r = dividendVersusPension(0, 50000)
    expect(r.dividendNet).toBe(0)
    expect(r.pensionValue).toBe(0)
    expect(r.advantage).toBe(0)
  })
})

describe('companyContributionsAvailable', () => {
  it('is a clean yes outside IR35', () => {
    expect(companyContributionsAvailable('ltd_outside_ir35').available).toBe(true)
  })

  it('does NOT promise company contributions inside IR35', () => {
    // The whole point of the gate: this must never come back as a flat yes.
    const r = companyContributionsAvailable('ltd_inside_ir35')
    expect(r.available).toBe('uncertain')
    expect(r.explanation).toContain('accountant')
  })

  it('is uncertain when we do not know the arrangement', () => {
    const r = companyContributionsAvailable('unknown')
    expect(r.available).toBe('uncertain')
    // Should point her at the document that actually settles it.
    expect(r.explanation).toContain('Status Determination Statement')
  })

  it('gives every arrangement a real explanation', () => {
    const all: WorkingArrangement[] = [
      'ltd_outside_ir35',
      'ltd_inside_ir35',
      'umbrella',
      'employee',
      'sole_trader',
      'unknown',
    ]
    for (const a of all) {
      const r = companyContributionsAvailable(a)
      expect(r.explanation.length, a).toBeGreaterThan(80)
      // No jargon left unexplained in the user-facing copy.
      expect(r.explanation, a).not.toMatch(/\bPSC\b|\bdeemed payment\b/)
    }
  })
})

describe('earnsQualifyingYear', () => {
  it('counts a salary at or above the lower earnings limit', () => {
    expect(earnsQualifyingYear(R.lowerEarningsLimit)).toBe(true)
    expect(earnsQualifyingYear(R.recommendedDirectorSalary)).toBe(true)
  })

  it('catches a salary set too low to count', () => {
    expect(earnsQualifyingYear(5000)).toBe(false)
  })
})
