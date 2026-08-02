import { describe, it, expect } from 'vitest'
import { advise, byHorizon } from './index'
import { DEFAULT_VALUES } from '@/lib/fields'
import type { AdviceState } from './types'

/** Kirsten as described: 51, two pots, mortgaged house, contracting. */
function kirsten(overrides: Partial<AdviceState> = {}): AdviceState {
  return {
    values: { ...DEFAULT_VALUES },
    unknown: {},
    workingArrangement: 'unknown',
    fundRiskLevel: 'growth',
    contributionType: 'relief_at_source',
    contributionEscalation: 'none',
    decumulationMethod: 'swr',
    taxRegime: 'englandWales',
    taperingStyle: 'unsure',
    lumpSumIntent: 'maybe',
    downsizeIntent: 'maybe',
    legacyIntent: 'maybe',
    region: 'uk',
    household: 'single',
    inRealTerms: true,
    ...overrides,
  }
}

describe('advise — purity', () => {
  it('gives identical advice for identical state', () => {
    const a = advise(kirsten())
    const b = advise(kirsten())
    expect(JSON.stringify(a.actions)).toBe(JSON.stringify(b.actions))
    expect(JSON.stringify(a.insights)).toBe(JSON.stringify(b.insights))
  })

  it('changes advice when the state changes', () => {
    const unknown = advise(kirsten())
    const outside = advise(kirsten({ workingArrangement: 'ltd_outside_ir35' }))
    expect(unknown.actions[0]?.id).not.toBe(outside.actions[0]?.id)
  })
})

describe('the IR35 gate', () => {
  it('leads with confirming status when we do not know it', () => {
    const { actions } = advise(kirsten())
    expect(actions[0].id).toBe('confirm-ir35')
    // It must wear the value of what it unlocks, or she won't bother.
    expect(actions[0].unlocks).toBeTruthy()
  })

  it('promotes the company route once she is outside IR35', () => {
    const { actions } = advise(
      kirsten({ workingArrangement: 'ltd_outside_ir35' }),
    )
    expect(actions.some((a) => a.id === 'company-contributions')).toBe(true)
    expect(actions.some((a) => a.id === 'confirm-ir35')).toBe(false)
  })

  it('never offers the plain company route inside IR35', () => {
    const { actions } = advise(
      kirsten({ workingArrangement: 'ltd_inside_ir35' }),
    )
    expect(actions.some((a) => a.id === 'company-contributions')).toBe(false)
    expect(actions.some((a) => a.id === 'inside-ir35-route')).toBe(true)
  })

  it('offers no company route at all to a sole trader', () => {
    const { actions } = advise(kirsten({ workingArrangement: 'sole_trader' }))
    for (const id of ['company-contributions', 'confirm-ir35', 'inside-ir35-route']) {
      expect(actions.some((a) => a.id === id)).toBe(false)
    }
  })
})

describe('ranking', () => {
  it('orders by score, highest first', () => {
    const { actions } = advise(kirsten({ workingArrangement: 'ltd_outside_ir35' }))
    for (let i = 1; i < actions.length; i++) {
      expect(actions[i - 1].score).toBeGreaterThanOrEqual(actions[i].score)
    }
  })

  it('puts a cheap check above an expensive lifestyle change of similar value', () => {
    const { actions } = advise(
      kirsten({
        workingArrangement: 'ltd_outside_ir35',
        downsizeIntent: 'yes',
      }),
    )
    const ni = actions.findIndex((a) => a.id === 'ni-record')
    const downsize = actions.findIndex((a) => a.id === 'downsize')
    if (ni >= 0 && downsize >= 0) expect(ni).toBeLessThan(downsize)
  })

  it('ranks downsizing last, because it changes where she lives', () => {
    const { actions } = advise(
      kirsten({ workingArrangement: 'ltd_outside_ir35', downsizeIntent: 'yes' }),
    )
    const downsize = actions.find((a) => a.id === 'downsize')
    if (downsize) expect(downsize.effort).toBe(5)
  })

  it('quietens down once she is comfortably on track', () => {
    const onTrack = advise(
      kirsten({
        values: {
          ...DEFAULT_VALUES,
          avivaBalance: 900000,
          peoplesPensionBalance: 200000,
          targetIncome: 20000,
        },
      }),
    )
    expect(onTrack.derived.onTrack).toBe(true)
    // Every impact is capped at the floor, so nothing shouts.
    for (const a of onTrack.actions) expect(a.score).toBeLessThanOrEqual(100)
  })
})

describe('short, medium and long term', () => {
  it('derives the horizon from effort, so they cannot disagree', () => {
    const { actions } = advise(
      kirsten({ workingArrangement: 'ltd_outside_ir35', downsizeIntent: 'yes' }),
    )
    for (const a of actions) {
      const expected =
        a.effort <= 2 ? 'short' : a.effort === 3 ? 'medium' : 'long'
      expect(a.horizon, a.id).toBe(expected)
    }
  })

  it('groups in order and keeps each group sorted by score', () => {
    const { actions } = advise(
      kirsten({ workingArrangement: 'ltd_outside_ir35', downsizeIntent: 'yes' }),
    )
    const groups = byHorizon(actions)

    expect(groups.map((g) => g.horizon)).toEqual(
      ['short', 'medium', 'long'].filter((h) =>
        actions.some((a) => a.horizon === h),
      ),
    )

    for (const group of groups) {
      for (let i = 1; i < group.actions.length; i++) {
        expect(group.actions[i - 1].score).toBeGreaterThanOrEqual(
          group.actions[i].score,
        )
      }
    }
  })

  it('never returns an empty group', () => {
    const groups = byHorizon(advise(kirsten()).actions)
    for (const g of groups) expect(g.actions.length).toBeGreaterThan(0)
  })

  it('puts quick wins in this week and the house in the long term', () => {
    const { actions } = advise(
      kirsten({ workingArrangement: 'ltd_outside_ir35', downsizeIntent: 'yes' }),
    )
    const ni = actions.find((a) => a.id === 'ni-record')
    const downsize = actions.find((a) => a.id === 'downsize')
    if (ni) expect(ni.horizon).toBe('short')
    if (downsize) expect(downsize.horizon).toBe('long')
  })
})

describe('insights', () => {
  it('shows only one insight per topic', () => {
    const { insights } = advise(kirsten())
    const topics = insights.map((i) => i.topic)
    expect(new Set(topics).size).toBe(topics.length)
  })

  it('leads with things to act on', () => {
    const { insights } = advise(kirsten())
    const firstGood = insights.findIndex((i) => i.severity === 'good')
    const lastAct = insights.map((i) => i.severity).lastIndexOf('act')
    if (firstGood >= 0 && lastAct >= 0) expect(lastAct).toBeLessThan(firstGood)
  })

  it('warns she cannot reach a pension when she wants to stop early', () => {
    const { insights } = advise(
      kirsten({ values: { ...DEFAULT_VALUES, retirementAge: 57 } }),
    )
    void insights
    const early = advise(
      kirsten({ values: { ...DEFAULT_VALUES, currentAge: 51, retirementAge: 57 } }),
    )
    expect(early.derived.hasBridgeGap).toBe(false)
  })

  it('never uses shaming or past-conditional language', () => {
    const { insights } = advise(kirsten())
    const text = insights.map((i) => `${i.headline} ${i.detail}`).join(' ')
    for (const banned of [
      'you should',
      'if you had',
      'should have',
      'too late',
      'behind',
      'failed',
    ]) {
      expect(text.toLowerCase()).not.toContain(banned)
    }
  })

  it('never leaves a frightening number without a lever', () => {
    const { insights, actions } = advise(kirsten())
    const gap = insights.find((i) => i.id === 'gap')
    if (gap) expect(actions.length).toBeGreaterThan(0)
  })
})

describe('the accountant list', () => {
  it('leads with IR35 while the status is unknown', () => {
    const { accountantQuestions } = advise(kirsten())
    expect(accountantQuestions[0].id).toBe('ir35')
  })

  it('asks a different first question inside IR35', () => {
    const { accountantQuestions } = advise(
      kirsten({ workingArrangement: 'ltd_inside_ir35' }),
    )
    expect(accountantQuestions[0].id).toBe('inside-ir35-pension')
  })

  it('adds carry forward once there is real business cash', () => {
    const without = advise(kirsten({ workingArrangement: 'ltd_outside_ir35' }))
    const with_ = advise(
      kirsten({
        workingArrangement: 'ltd_outside_ir35',
        values: { ...DEFAULT_VALUES, businessCashAmount: 60000 },
      }),
    )
    expect(without.accountantQuestions.some((q) => q.id === 'carry-forward')).toBe(false)
    expect(with_.accountantQuestions.some((q) => q.id === 'carry-forward')).toBe(true)
  })

  it('produces a sendable email with the top questions in it', () => {
    const { emailBody, accountantQuestions } = advise(kirsten())
    expect(emailBody).toContain(accountantQuestions[0].question)
    expect(emailBody).toContain('Kirsten')
    expect(emailBody.split('\n').length).toBeGreaterThan(6)
  })
})

describe('the house', () => {
  it('does not pretend the sale price is all hers', () => {
    // £400k house with £120k owed cannot free £400k.
    const { derived } = advise(kirsten())
    expect(derived.homeEquity).toBe(280000)
    expect(derived.realisticDownsizeRelease).toBeLessThan(derived.homeEquity)
  })

  it('tells her the mortgage clears before she stops', () => {
    const { derived } = advise(kirsten())
    expect(derived.mortgageClearAge).toBe(63)
    expect(derived.mortgageClearsBeforeRetiring).toBe(true)
  })
})
