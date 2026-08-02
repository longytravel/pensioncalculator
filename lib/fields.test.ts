import { describe, it, expect } from 'vitest'
import {
  FIELDS,
  DEFAULT_VALUES,
  calculatorValuesSchema,
  clampToField,
  formatFieldValue,
  type FieldName,
} from './fields'
import { toEngineInputs } from './store'
import { project } from './engine/project'

const names = Object.keys(FIELDS) as FieldName[]

describe('field definitions', () => {
  it('every default sits inside its own bounds', () => {
    for (const name of names) {
      const f = FIELDS[name]
      expect(f.default, name).toBeGreaterThanOrEqual(f.min)
      expect(f.default, name).toBeLessThanOrEqual(f.max)
    }
  })

  it('every field has a sane range and step', () => {
    for (const name of names) {
      const f = FIELDS[name]
      expect(f.max, name).toBeGreaterThan(f.min)
      expect(f.step, name).toBeGreaterThan(0)
      expect(f.step, name).toBeLessThanOrEqual(f.max - f.min)
    }
  })

  it('every field carries copy for a non-expert', () => {
    for (const name of names) {
      const f = FIELDS[name]
      expect(f.label.length, name).toBeGreaterThan(0)
      expect(f.helper.length, name).toBeGreaterThan(0)
      // The explainer is the "why does this matter" content; it should say
      // something, not just restate the label.
      expect(f.explainer.length, name).toBeGreaterThan(60)
    }
  })
})

describe('clampToField', () => {
  it('holds values inside the bounds', () => {
    expect(clampToField('currentAge', 5)).toBe(18)
    expect(clampToField('currentAge', 200)).toBe(80)
  })

  it('snaps to the step', () => {
    expect(clampToField('personalMonthlyContribution', 260)).toBe(250)
    expect(clampToField('personalMonthlyContribution', 264)).toBe(275)
  })

  it('leaves no floating-point dust on fractional steps', () => {
    const v = clampToField('annualChargeRate', 0.0075)
    expect(v).toBe(0.0075)
    expect(String(v)).not.toContain('000000')
  })

  it('falls back to the default for junk', () => {
    expect(clampToField('salary', NaN)).toBe(FIELDS.salary.default)
    expect(clampToField('salary', Infinity)).toBe(FIELDS.salary.default)
  })
})

describe('schema', () => {
  it('accepts the defaults', () => {
    expect(calculatorValuesSchema.safeParse(DEFAULT_VALUES).success).toBe(true)
  })

  it('recovers a single bad field rather than failing the whole object', () => {
    const parsed = calculatorValuesSchema.parse({
      ...DEFAULT_VALUES,
      salary: -999,
    })
    expect(parsed.salary).toBe(FIELDS.salary.default)
    // Everything else survives untouched.
    expect(parsed.currentAge).toBe(DEFAULT_VALUES.currentAge)
  })

  it('recovers from a value of the wrong type', () => {
    const parsed = calculatorValuesSchema.parse({
      ...DEFAULT_VALUES,
      currentAge: 'forty-five',
    })
    expect(parsed.currentAge).toBe(FIELDS.currentAge.default)
  })
})

describe('formatFieldValue', () => {
  it('formats each kind readably', () => {
    expect(formatFieldValue('gbp', 32700)).toBe('£32,700')
    expect(formatFieldValue('gbp-monthly', 250)).toBe('£250 a month')
    expect(formatFieldValue('percent', 0.005)).toBe('0.5%')
    expect(formatFieldValue('percent', 0.0075)).toBe('0.75%')
    expect(formatFieldValue('age', 67)).toBe('age 67')
    expect(formatFieldValue('years', 1)).toBe('1 year')
    expect(formatFieldValue('years', 35)).toBe('35 years')
  })
})

describe('toEngineInputs', () => {
  const base = {
    values: DEFAULT_VALUES,
    fundRiskLevel: 'growth' as const,
    contributionType: 'relief_at_source' as const,
    contributionEscalation: 'none' as const,
    decumulationMethod: 'swr' as const,
    taxRegime: 'englandWales' as const,
  }

  it('produces inputs the engine accepts', () => {
    expect(() => project(toEngineInputs(base))).not.toThrow()
  })

  it('omits assets that are set to zero', () => {
    expect(toEngineInputs(base).otherAssets).toHaveLength(0)
  })

  it('includes downsizing and business cash once they have a value', () => {
    const inputs = toEngineInputs({
      ...base,
      values: {
        ...DEFAULT_VALUES,
        downsizeReleaseAmount: 200000,
        businessCashAmount: 50000,
      },
    })
    expect(inputs.otherAssets.map((a) => a.label)).toEqual([
      'Moving somewhere smaller',
      'Business cash',
    ])
  })

  it('never lets an inconsistent age combination reach the engine', () => {
    // A mid-drag state where retirement age has fallen below current age must
    // not throw during render.
    const inputs = toEngineInputs({
      ...base,
      values: { ...DEFAULT_VALUES, currentAge: 70, retirementAge: 60 },
    })
    expect(inputs.retirementAge).toBeGreaterThan(inputs.currentAge)
    expect(inputs.planningAge).toBeGreaterThan(inputs.retirementAge)
    expect(() => project(inputs)).not.toThrow()
  })

  it('survives every field being at its minimum', () => {
    const mins = Object.fromEntries(
      names.map((n) => [n, FIELDS[n].min]),
    ) as typeof DEFAULT_VALUES
    expect(() => project(toEngineInputs({ ...base, values: mins }))).not.toThrow()
  })

  it('survives every field being at its maximum', () => {
    const maxes = Object.fromEntries(
      names.map((n) => [n, FIELDS[n].max]),
    ) as typeof DEFAULT_VALUES
    expect(() => project(toEngineInputs({ ...base, values: maxes }))).not.toThrow()
  })
})
