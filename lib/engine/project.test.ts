import { describe, it, expect } from 'vitest'
import { project, validateInputs, statePensionAmount, grossMonthlyContribution } from './project'
import { DEFAULT_ASSUMPTIONS as A } from './assumptions'
import { EngineInputError, type CalculatorInputs } from './types'

/** Kirsten's actual situation, as described. */
function kirsten(overrides: Partial<CalculatorInputs> = {}): CalculatorInputs {
  return {
    currentAge: 45,
    retirementAge: 67,
    planningAge: 95,
    salary: 50000,
    taxRegime: 'englandWales',
    pensionPots: [
      { provider: 'Aviva', balance: 20000, annualChargeRate: 0.005 },
      { provider: "The People's Pension", balance: 10000, annualChargeRate: 0.005 },
    ],
    personalMonthlyContribution: 250,
    employerMonthlyContribution: 0,
    contributionType: 'relief_at_source',
    contributionEscalation: { mode: 'none' },
    fundRiskLevel: 'growth',
    otherAssets: [],
    statePension: { statePensionAge: 67, qualifyingYears: 35 },
    targetIncome: { amount: 32700, isNet: true }, // PLSA Moderate
    decumulationMethod: 'swr',
    ...overrides,
  }
}

describe('statePensionAmount', () => {
  it('pays the full amount at 35 qualifying years', () => {
    expect(statePensionAmount(kirsten(), A)).toBeCloseTo(12547.6, 2)
  })

  it('pro-rates for a partial record', () => {
    const inputs = kirsten({
      statePension: { statePensionAge: 67, qualifyingYears: 20 },
    })
    expect(statePensionAmount(inputs, A)).toBeCloseTo((12547.6 * 20) / 35, 2)
  })
})

describe('grossMonthlyContribution', () => {
  it('grosses up relief at source: £250 becomes £312.50', () => {
    const r = grossMonthlyContribution(kirsten(), A)
    expect(r.personal).toBeCloseTo(312.5, 2)
    expect(r.relief).toBeCloseTo(62.5, 2)
  })

  it('does not gross up net pay or salary sacrifice', () => {
    for (const mode of ['net_pay', 'salary_sacrifice'] as const) {
      const r = grossMonthlyContribution(
        kirsten({ contributionType: mode }),
        A,
      )
      expect(r.personal).toBeCloseTo(250, 2)
      expect(r.relief).toBe(0)
    }
  })

  it('never grosses up the employer contribution', () => {
    const r = grossMonthlyContribution(
      kirsten({ employerMonthlyContribution: 500 }),
      A,
    )
    expect(r.employer).toBe(500)
  })
})

describe('validateInputs', () => {
  it('throws when retirement is not in the future', () => {
    expect(() => validateInputs(kirsten({ retirementAge: 45 }))).toThrow(
      EngineInputError,
    )
    expect(() => validateInputs(kirsten({ retirementAge: 30 }))).toThrow(
      EngineInputError,
    )
  })

  it('throws on a negative pot balance', () => {
    const inputs = kirsten({
      pensionPots: [{ provider: 'Aviva', balance: -1, annualChargeRate: 0.005 }],
    })
    expect(() => validateInputs(inputs)).toThrow(EngineInputError)
  })

  it('throws on negative contributions', () => {
    expect(() =>
      validateInputs(kirsten({ personalMonthlyContribution: -50 })),
    ).toThrow(EngineInputError)
  })

  it('clamps a planning age below retirement, and says so', () => {
    const { cleaned, warnings } = validateInputs(kirsten({ planningAge: 60 }))
    expect(cleaned.planningAge).toBe(68)
    expect(warnings).toHaveLength(1)
  })

  it('caps qualifying years at 35, and says so', () => {
    const { cleaned, warnings } = validateInputs(
      kirsten({ statePension: { statePensionAge: 67, qualifyingYears: 44 } }),
    )
    expect(cleaned.statePension.qualifyingYears).toBe(35)
    expect(warnings.join(' ')).toContain('35')
  })

  it('warns rather than throws when an asset lands after the plan ends', () => {
    const { warnings } = validateInputs(
      kirsten({
        otherAssets: [{ label: 'House sale', netAmount: 200000, ageReceived: 99 }],
      }),
    )
    expect(warnings.join(' ')).toContain('House sale')
  })
})

describe('project', () => {
  it('produces all three scenarios, ordered low < mid < high', () => {
    const out = project(kirsten())
    expect(out.scenarios.low.potAtRetirement).toBeLessThan(
      out.scenarios.mid.potAtRetirement,
    )
    expect(out.scenarios.mid.potAtRetirement).toBeLessThan(
      out.scenarios.high.potAtRetirement,
    )
  })

  it('runs one row per year to the planning age', () => {
    const out = project(kirsten())
    expect(out.scenarios.mid.rows).toHaveLength(95 - 45)
    expect(out.scenarios.mid.rows[0].age).toBe(46)
    expect(out.scenarios.mid.rows.at(-1)!.age).toBe(95)
  })

  it('marks retirement in the right year', () => {
    const rows = project(kirsten()).scenarios.mid.rows
    expect(rows.find((r) => r.age === 67)!.isRetired).toBe(false)
    expect(rows.find((r) => r.age === 68)!.isRetired).toBe(true)
  })

  it('caps the tax-free lump sum at 25%', () => {
    const mid = project(kirsten()).scenarios.mid
    expect(mid.taxFreeLumpSum).toBeCloseTo(mid.potAtRetirement * 0.25, 0)
  })

  it('caps the tax-free lump sum at the Lump Sum Allowance for a large pot', () => {
    const out = project(
      kirsten({
        pensionPots: [
          { provider: 'Big', balance: 2000000, annualChargeRate: 0.005 },
        ],
      }),
      { inRealTerms: false },
    )
    expect(out.scenarios.mid.taxFreeLumpSum).toBeCloseTo(A.lumpSumAllowance, 0)
  })

  it('reports figures in today’s money by default, and they are lower than nominal', () => {
    const real = project(kirsten())
    const nominal = project(kirsten(), { inRealTerms: false })
    expect(real.inRealTerms).toBe(true)
    expect(real.scenarios.mid.potAtRetirement).toBeLessThan(
      nominal.scenarios.mid.potAtRetirement,
    )
  })

  it('starts the State Pension only at State Pension age', () => {
    const rows = project(
      kirsten({ retirementAge: 60, statePension: { statePensionAge: 67, qualifyingYears: 35 } }),
    ).scenarios.mid.rows

    expect(rows.find((r) => r.age === 63)!.statePensionIncome).toBe(0)
    expect(rows.find((r) => r.age === 70)!.statePensionIncome).toBeGreaterThan(0)
  })

  it('holds the State Pension roughly flat in today’s money', () => {
    const rows = project(kirsten()).scenarios.mid.rows
    const atStart = rows.find((r) => r.age === 70)!.statePensionIncome
    const atEnd = rows.find((r) => r.age === 90)!.statePensionIncome
    expect(atEnd).toBeCloseTo(atStart, 0)
  })

  it('adds employer contributions to the pot', () => {
    const without = project(kirsten()).scenarios.mid.potAtRetirement
    const with_ = project(
      kirsten({ employerMonthlyContribution: 500 }),
    ).scenarios.mid.potAtRetirement
    expect(with_).toBeGreaterThan(without)
  })

  it('credits a house sale to the pot in the year it lands', () => {
    const without = project(kirsten()).scenarios.mid
    const with_ = project(
      kirsten({
        otherAssets: [
          { label: 'House sale', netAmount: 150000, ageReceived: 67 },
        ],
      }),
    ).scenarios.mid

    expect(with_.potAtRetirement).toBeGreaterThan(without.potAtRetirement)
    // Entered in today's money, so it should show up at roughly face value.
    expect(with_.potAtRetirement - without.potAtRetirement).toBeCloseTo(
      150000,
      -3,
    )
  })

  it('ignores an asset arriving after the plan ends', () => {
    const a = project(kirsten()).scenarios.mid.potAtRetirement
    const b = project(
      kirsten({
        otherAssets: [{ label: 'Late', netAmount: 500000, ageReceived: 99 }],
      }),
    ).scenarios.mid.potAtRetirement
    expect(b).toBeCloseTo(a, 2)
  })

  it('charges reduce the final pot', () => {
    const cheap = project(
      kirsten({
        pensionPots: [{ provider: 'Cheap', balance: 30000, annualChargeRate: 0.0015 }],
      }),
    ).scenarios.mid.potAtRetirement
    const dear = project(
      kirsten({
        pensionPots: [{ provider: 'Dear', balance: 30000, annualChargeRate: 0.0125 }],
      }),
    ).scenarios.mid.potAtRetirement
    expect(cheap).toBeGreaterThan(dear)
  })

  it('a cautious fund projects lower than a growth fund', () => {
    const cautious = project(kirsten({ fundRiskLevel: 'cautious' })).scenarios.mid
    const growth = project(kirsten({ fundRiskLevel: 'growth' })).scenarios.mid
    expect(cautious.potAtRetirement).toBeLessThan(growth.potAtRetirement)
  })

  it('escalating contributions beat level ones', () => {
    const level = project(kirsten()).scenarios.mid.potAtRetirement
    const escalating = project(
      kirsten({ contributionEscalation: { mode: 'salary' } }),
    ).scenarios.mid.potAtRetirement
    expect(escalating).toBeGreaterThan(level)
  })
})

describe('the gap', () => {
  it('identifies a shortfall and quantifies the fix', () => {
    const out = project(kirsten())
    expect(out.gap.onTrack).toBe(false)
    expect(out.gap.gap).toBeLessThan(0)
    expect(out.gap.requiredExtraMonthlyContribution).toBeGreaterThan(0)
  })

  it('paying the suggested extra actually closes the gap', () => {
    // The most important test in the suite: the number we tell her to pay must
    // genuinely get her there.
    const base = kirsten()
    const first = project(base)
    expect(first.gap.onTrack).toBe(false)

    const fixed = project({
      ...base,
      personalMonthlyContribution:
        base.personalMonthlyContribution +
        first.gap.requiredExtraMonthlyContribution,
    })

    // Within £500/yr of the target — the solve is approximate because tax is
    // non-linear, but it must land close and never undershoot badly.
    expect(fixed.gap.gap).toBeGreaterThan(-500)
  })

  it('reports on track when the target is easily met', () => {
    const out = project(
      kirsten({
        pensionPots: [
          { provider: 'Big', balance: 800000, annualChargeRate: 0.005 },
        ],
        targetIncome: { amount: 20000, isNet: true },
      }),
    )
    expect(out.gap.onTrack).toBe(true)
    expect(out.gap.requiredExtraMonthlyContribution).toBe(0)
  })

  it('needs a smaller top-up when company contributions are already flowing', () => {
    const alone = project(kirsten()).gap.requiredExtraMonthlyContribution
    const withEmployer = project(
      kirsten({ employerMonthlyContribution: 400 }),
    ).gap.requiredExtraMonthlyContribution
    expect(withEmployer).toBeLessThan(alone)
  })

  it('handles a gross target as well as a net one', () => {
    const net = project(kirsten({ targetIncome: { amount: 32700, isNet: true } }))
    const gross = project(
      kirsten({ targetIncome: { amount: 32700, isNet: false } }),
    )
    // A gross target of the same figure is easier to hit than a net one.
    expect(gross.gap.targetNetIncome).toBeLessThan(net.gap.targetNetIncome)
  })
})

describe('decumulation methods', () => {
  it('all three produce a positive income', () => {
    for (const method of ['swr', 'amortise', 'annuity'] as const) {
      const out = project(kirsten({ decumulationMethod: method }))
      expect(out.scenarios.mid.sustainableNetIncome).toBeGreaterThan(0)
    }
  })

  it('reports zero drawdown income once the pot is actually gone', () => {
    // A tiny pot, no contributions, retirement at 46: the low scenario runs
    // out of money decades before the planning age. The rows after that point
    // must show no income — an earlier version kept reporting a phantom flat
    // payment forever while the pot showed £0.
    const out = project(
      kirsten({
        currentAge: 45,
        retirementAge: 46,
        planningAge: 95,
        pensionPots: [
          { provider: 'Aviva', balance: 5000, annualChargeRate: 0.005 },
        ],
        personalMonthlyContribution: 0,
        statePension: { statePensionAge: 67, qualifyingYears: 0 },
      }),
    )

    const low = out.scenarios.low
    expect(low.potDepletionAge).toBeDefined()

    const afterDepletion = low.rows.filter(
      (r) => r.age > (low.potDepletionAge ?? Infinity),
    )
    expect(afterDepletion.length).toBeGreaterThan(0)
    for (const row of afterDepletion) {
      expect(row.total).toBe(0)
      expect(row.drawdownGross).toBe(0)
      // No NI record in this fixture, so no state pension either: nothing.
      expect(row.incomeGross).toBe(0)
    }
  })

  it('keeps annuity income flowing after the capital is spent', () => {
    // An annuity is bought outright — the payments are the insurer's problem
    // once the capital has gone, so income continues to the end of the plan.
    const out = project(
      kirsten({
        decumulationMethod: 'annuity',
        currentAge: 45,
        retirementAge: 46,
        planningAge: 95,
        pensionPots: [
          { provider: 'Aviva', balance: 5000, annualChargeRate: 0.005 },
        ],
        personalMonthlyContribution: 0,
        statePension: { statePensionAge: 67, qualifyingYears: 0 },
      }),
    )

    const lastRow = out.scenarios.low.rows.at(-1)
    expect(lastRow?.drawdownGross ?? 0).toBeGreaterThan(0)
    expect(out.scenarios.low.potDepletionAge).toBeUndefined()
  })

  it('amortising to zero pays more than a safe withdrawal rate', () => {
    // Spending the pot down deliberately should beat a rate designed to
    // preserve it.
    const swr = project(kirsten({ decumulationMethod: 'swr' })).scenarios.mid
    const amortise = project(kirsten({ decumulationMethod: 'amortise' }))
      .scenarios.mid
    expect(amortise.sustainableNetIncome).toBeGreaterThan(
      swr.sustainableNetIncome,
    )
  })
})
