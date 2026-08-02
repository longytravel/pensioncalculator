import { describe, it, expect } from 'vitest'
import {
  incomeTax,
  grossToNet,
  solveGrossForNet,
  personalAllowanceAfterTaper,
  netCostOfContribution,
} from './tax'
import { DEFAULT_ASSUMPTIONS as A } from './assumptions'

describe('personalAllowanceAfterTaper', () => {
  it('is untouched below the threshold', () => {
    expect(personalAllowanceAfterTaper(50000, A)).toBe(12570)
    expect(personalAllowanceAfterTaper(100000, A)).toBe(12570)
  })

  it('withdraws £1 for every £2 above £100,000', () => {
    expect(personalAllowanceAfterTaper(110000, A)).toBe(7570)
  })

  it('reaches exactly zero at £125,140 and never goes negative', () => {
    expect(personalAllowanceAfterTaper(125140, A)).toBe(0)
    expect(personalAllowanceAfterTaper(200000, A)).toBe(0)
  })
})

describe('incomeTax — England & Wales', () => {
  it('charges nothing inside the personal allowance', () => {
    expect(incomeTax(12570, 'englandWales', A).tax).toBe(0)
    expect(incomeTax(0, 'englandWales', A).tax).toBe(0)
  })

  it('matches the worked test case for a £30,000 income', () => {
    // First £12,570 free, next £17,430 at 20% = £3,486.
    const r = incomeTax(30000, 'englandWales', A)
    expect(r.tax).toBeCloseTo(3486, 2)
    expect(r.net).toBeCloseTo(26514, 2)
    expect(r.marginalRate).toBe(0.2)
  })

  it('handles the basic-rate ceiling exactly', () => {
    // (50,270 - 12,570) * 20% = £7,540.
    expect(incomeTax(50270, 'englandWales', A).tax).toBeCloseTo(7540, 2)
  })

  it('charges 40% above the higher-rate threshold', () => {
    // £7,540 basic + £10,000 at 40% = £11,540.
    const r = incomeTax(60270, 'englandWales', A)
    expect(r.tax).toBeCloseTo(11540, 2)
    expect(r.marginalRate).toBe(0.4)
  })

  it('shifts the higher-rate threshold down as the allowance tapers', () => {
    // At £125,140 the allowance is zero, so the £37,700 basic band starts at £0
    // and the 40% band runs from £37,700 all the way up.
    // 37,700*20% + (125,140-37,700)*40% = 7,540 + 34,976 = £42,516.
    const r = incomeTax(125140, 'englandWales', A)
    expect(r.tax).toBeCloseTo(42516, 2)
  })

  it('starts the 45% rate only above £125,140', () => {
    const r = incomeTax(135140, 'englandWales', A)
    // £42,516 up to the threshold, then £10,000 at 45%.
    expect(r.tax).toBeCloseTo(42516 + 4500, 2)
    expect(r.marginalRate).toBe(0.45)
  })

  it('produces a marginal rate above 45% inside the taper zone', () => {
    // The 60% trap: an extra £100 at £110k costs more than £45 in tax.
    const before = incomeTax(110000, 'englandWales', A).tax
    const after = incomeTax(110100, 'englandWales', A).tax
    expect(after - before).toBeCloseTo(60, 2)
  })

  it('never returns a net above gross', () => {
    for (const gross of [1, 12570, 30000, 100000, 150000, 500000]) {
      const r = incomeTax(gross, 'englandWales', A)
      expect(r.net).toBeLessThanOrEqual(r.gross)
      expect(r.tax).toBeGreaterThanOrEqual(0)
    }
  })

  it('is monotonic in gross income', () => {
    let previousNet = -1
    for (let gross = 0; gross <= 200000; gross += 1000) {
      const { net } = incomeTax(gross, 'englandWales', A)
      expect(net).toBeGreaterThanOrEqual(previousNet)
      previousNet = net
    }
  })
})

describe('incomeTax — Scotland', () => {
  it('uses the Scottish bands, giving a different answer', () => {
    const scotland = incomeTax(30000, 'scotland', A).tax
    const englandWales = incomeTax(30000, 'englandWales', A).tax
    expect(scotland).not.toBeCloseTo(englandWales, 2)
  })

  it('applies the 19% starter rate', () => {
    // (15,397 - 12,570) * 19% = £537.13.
    expect(incomeTax(15397, 'scotland', A).tax).toBeCloseTo(537.13, 2)
  })
})

describe('grossToNet', () => {
  it('lets the State Pension use up the personal allowance first', () => {
    // £12,547.60 State Pension plus £10,000 drawdown = £22,547.60 total.
    // Taxable slice is £9,977.60 at 20% = £1,995.52.
    const r = grossToNet(10000, 12547.6, 'englandWales', A)
    expect(r.gross).toBeCloseTo(22547.6, 2)
    expect(r.tax).toBeCloseTo(1995.52, 2)
  })

  it('charges no tax when the State Pension alone is under the allowance', () => {
    expect(grossToNet(0, 12547.6, 'englandWales', A).tax).toBe(0)
  })

  it('treats negative inputs as zero rather than crediting tax', () => {
    expect(grossToNet(-5000, 12547.6, 'englandWales', A).tax).toBe(0)
  })
})

describe('solveGrossForNet', () => {
  it('inverts incomeTax to within a penny', () => {
    for (const targetNet of [10000, 26514, 40000, 75000, 120000]) {
      const gross = solveGrossForNet(targetNet, 'englandWales', A)
      expect(incomeTax(gross, 'englandWales', A).net).toBeCloseTo(targetNet, 2)
    }
  })

  it('round-trips the worked case exactly', () => {
    expect(solveGrossForNet(26514, 'englandWales', A)).toBeCloseTo(30000, 1)
  })

  it('returns the target unchanged inside the personal allowance', () => {
    expect(solveGrossForNet(10000, 'englandWales', A)).toBeCloseTo(10000, 2)
  })

  it('works through the taper zone, where the inverse is least well behaved', () => {
    const gross = solveGrossForNet(80000, 'englandWales', A)
    expect(incomeTax(gross, 'englandWales', A).net).toBeCloseTo(80000, 2)
  })

  it('handles Scotland', () => {
    const gross = solveGrossForNet(30000, 'scotland', A)
    expect(incomeTax(gross, 'scotland', A).net).toBeCloseTo(30000, 2)
  })

  it('returns zero for a non-positive target', () => {
    expect(solveGrossForNet(0, 'englandWales', A)).toBe(0)
    expect(solveGrossForNet(-100, 'englandWales', A)).toBe(0)
  })
})

describe('netCostOfContribution', () => {
  it('costs a basic-rate taxpayer £80 per £100', () => {
    const r = netCostOfContribution(100, 0.2)
    expect(r.cost).toBeCloseTo(80, 6)
    expect(r.higherRateRefund).toBe(0)
  })

  it('costs a higher-rate taxpayer £60 per £100, £20 of it as a refund', () => {
    const r = netCostOfContribution(100, 0.4)
    expect(r.basicRateRelief).toBeCloseTo(20, 6)
    expect(r.higherRateRefund).toBeCloseTo(20, 6)
    expect(r.cost).toBeCloseTo(60, 6)
  })
})
