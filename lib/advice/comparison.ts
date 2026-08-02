/**
 * "Where should my next £100 go?"
 *
 * Every route is computed from her actual position, so the ordering changes
 * with her IR35 status, her tax band, her mortgage rate and how far she is
 * from 57. There is no fixed winner.
 *
 * The line this stays on: comparing what routes produce is arithmetic, and we
 * are direct about it. Naming a provider as the right one for her would be a
 * personal recommendation, and we do not.
 */

import { corporationTax, dividendTax } from '@/lib/engine/contractor'
import type { AdviceState, Derived } from './types'

export interface Destination {
  id: string
  name: string
  /** Of £100 of company profit, what is working for her on day one. */
  dayOne: number
  /** What that becomes by retirement, before tax on the way out. */
  atRetirement: number
  reason: string
  /** The thing the arithmetic cannot tell her. */
  tradeOff: string
  available: boolean
  /** Why it is greyed out rather than hidden. */
  unavailableBecause?: string
  /** Overrides the ranking, for reasons the maths does not capture. */
  pinned?: string
}

const round = (n: number) => Math.round(n * 100) / 100

/**
 * Compound a sum forward.
 *
 * Charges are netted off the growth rate, which is how they actually bite.
 */
const grow = (amount: number, rate: number, years: number) =>
  amount * Math.pow(1 + rate, years)

export function compareDestinations(
  state: AdviceState,
  d: Derived,
): Destination[] {
  const v = state.values
  const years = Math.max(1, d.yearsToRetirement)

  // Real returns, so everything is comparable in today's money.
  const realGrowth = 0.024
  const realCash = 0.0
  const fees = Math.max(0, v.annualChargeRate - 0.003)

  // What £100 of company profit becomes once it has been taxed out to her.
  const ct = corporationTax(100)
  const distributable = 100 - ct
  const divTax = dividendTax(distributable, v.salary)
  const inHand = distributable - divTax

  const companyAvailable = d.companyRoute.available === true
  const out: Destination[] = []

  out.push({
    id: 'employer-pension',
    name: 'Straight into the pension from the company',
    dayOne: 100,
    atRetirement: round(grow(100, realGrowth - fees, years)),
    reason:
      'The whole £100 goes in. It skips Corporation Tax, National Insurance and dividend tax entirely.',
    tradeOff: `Locked until ${57}. You cannot change your mind.`,
    available: companyAvailable,
    unavailableBecause: companyAvailable
      ? undefined
      : state.workingArrangement === 'unknown'
        ? 'We need to know your IR35 status first'
        : 'Not available on how you are working at the moment',
  })

  out.push({
    id: 'personal-pension',
    name: 'Take it as a dividend, then pay it in yourself',
    dayOne: round(inHand * 1.25),
    atRetirement: round(grow(inHand * 1.25, realGrowth - fees, years)),
    reason:
      'HMRC adds 25% back on the way in. But the Corporation Tax and dividend tax you already paid do not come back.',
    tradeOff: `Also locked until ${57}.`,
    available: true,
  })

  out.push({
    id: 'mortgage',
    name: 'Overpay the mortgage',
    dayOne: round(inHand),
    atRetirement: round(grow(inHand, v.mortgageRate, Math.min(years, v.mortgageYearsLeft))),
    reason: `A guaranteed, tax-free return equal to your mortgage rate. No market risk at all.`,
    tradeOff:
      'Hard to reverse — the money is in the walls. Check your lender allows it without a penalty.',
    available: v.mortgageBalance > 0,
    unavailableBecause:
      v.mortgageBalance > 0 ? undefined : 'Your mortgage is already clear',
  })

  out.push({
    id: 'stocks-isa',
    name: 'Stocks and shares ISA',
    dayOne: round(inHand),
    atRetirement: round(grow(inHand, realGrowth - 0.003, years)),
    reason:
      'No tax relief going in, but nothing to pay coming out, and no age lock at all.',
    tradeOff: 'Can fall as well as rise. Needs at least five years to make sense.',
    available: true,
    pinned: d.hasBridgeGap
      ? 'The only one of these you could actually use before 57'
      : undefined,
  })

  out.push({
    id: 'cash-isa',
    name: 'Cash ISA',
    dayOne: round(inHand),
    atRetirement: round(grow(inHand, realCash, years)),
    reason: 'Safe, tax-free and reachable tomorrow if you need it.',
    tradeOff:
      'Barely keeps pace with prices over sixteen years. Right for an emergency fund, slow for anything longer.',
    available: true,
    pinned:
      v.cashIsaBalance < v.salary / 4
        ? 'Worth having three to six months of costs here before anything else'
        : undefined,
  })

  out.push({
    id: 'nothing',
    name: 'Take the dividend and leave it in the current account',
    dayOne: round(inHand),
    atRetirement: round(inHand),
    reason: 'The baseline everything else is measured against.',
    tradeOff: 'Loses value to inflation every year.',
    available: true,
  })

  /**
   * Pinned routes come first regardless of the arithmetic. An emergency fund
   * beats a better return she cannot reach in a crisis, and a pension cannot
   * fund the years before she is allowed to touch it.
   */
  return out.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (b.pinned && !a.pinned) return 1
    if (a.available !== b.available) return a.available ? -1 : 1
    return b.atRetirement - a.atRetirement
  })
}

/**
 * What charges cost her between now and retiring.
 *
 * The most persuasive number in the whole comparison, so it is computed from
 * her real pot and horizon rather than quoted from an article.
 */
export function feeDrag(
  state: AdviceState,
  d: Derived,
  cheapRate = 0.003,
): { expensive: number; cheap: number; difference: number } {
  const pot = d.totalPensionNow
  const years = Math.max(1, d.yearsToRetirement)
  const gross = 0.05

  const expensive = grow(pot, gross - state.values.annualChargeRate, years)
  const cheap = grow(pot, gross - cheapRate, years)

  return {
    expensive: Math.round(expensive),
    cheap: Math.round(cheap),
    difference: Math.round(cheap - expensive),
  }
}

/** Strategy comparisons — arithmetic about her choices, not about products. */
export interface StrategyOption {
  label: string
  monthlyIncome: number
  note: string
}
