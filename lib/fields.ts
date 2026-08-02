/**
 * Field definitions — the single source of truth for every input.
 *
 * Bounds, step sizes, formatting and the plain-English copy all live here, and
 * the Zod schema is derived from the same object. If the slider's clamping and
 * the persistence validation came from two separate places they would silently
 * drift apart, and a saved value could end up outside what the UI can display.
 */

import { z } from 'zod'

export type FieldFormat = 'gbp' | 'gbp-monthly' | 'percent' | 'age' | 'years'

export interface FieldDef {
  /** Plain-English question, not a jargon label. */
  label: string
  /** One or two short sentences under the label. */
  helper: string
  /** Longer "why this matters" text, behind the info button. */
  explainer: string
  min: number
  max: number
  step: number
  /** Jump size for Page Up/Down and Shift+Arrow. */
  largeStep?: number
  format: FieldFormat
  default: number
}

export const FIELDS = {
  currentAge: {
    label: 'How old are you?',
    helper: 'We use this to work out how long your money has to grow.',
    explainer:
      'Time is what does the heavy lifting. There is still a real stretch between now and stopping work — and the years just before retirement are usually the highest-earning ones, which makes them the best years to pay in properly. Starting now beats waiting until it feels affordable.',
    min: 18,
    max: 80,
    step: 1,
    largeStep: 5,
    format: 'age',
    default: 51,
  },

  retirementAge: {
    label: 'When would you like to stop working?',
    helper: 'You can change this later — try moving it and see what happens.',
    explainer:
      'This is one of the most powerful sliders here. Working two years longer does three things at once: two more years of paying in, two more years of growth, and two fewer years your money has to stretch. Note the earliest you can touch a private pension is 57 from April 2028 — that rise will apply to you.',
    min: 57,
    max: 80,
    step: 1,
    format: 'age',
    default: 67,
  },

  planningAge: {
    label: 'How long should your money need to last?',
    helper: 'We suggest 95. It is better to plan for too long than too short.',
    explainer:
      'This is not a prediction about you — it is a safety margin. A woman reaching 65 today can expect to live to around 87 on average, and plenty live well beyond that. Planning to 95 means the plan still works if you are one of them. You can push it to 100 if you would rather be extra careful.',
    min: 75,
    max: 105,
    step: 1,
    format: 'age',
    default: 95,
  },

  salary: {
    label: 'What do you earn a year, before tax?',
    helper: 'Salary and any regular drawings from your business.',
    explainer:
      'We use this for two things: working out what tax relief you get on what you pay in, and offering you a sensible starting target for retirement income if you would rather not pick one yourself.',
    min: 0,
    max: 250000,
    step: 500,
    largeStep: 5000,
    format: 'gbp',
    default: 50000,
  },

  personalMonthlyContribution: {
    label: 'How much do you pay in each month?',
    helper: 'What actually leaves your bank account. We add the tax relief on top.',
    explainer:
      'If your pension takes money after tax (most personal pensions do), the government tops it up. Pay in £80 and £100 lands in your pension — that is a 25% uplift on what you actually parted with, before any investment growth. If you pay higher-rate tax you can claim more back through your tax return, though that arrives as a smaller tax bill rather than more money in the pension.',
    min: 0,
    max: 5000,
    step: 25,
    largeStep: 250,
    format: 'gbp-monthly',
    default: 250,
  },

  employerMonthlyContribution: {
    label: 'How much goes in from your employer or your company?',
    helper: 'Leave at zero if none. This is money that never touches your salary.',
    explainer:
      'If you run your own limited company, this is the most valuable box on the page. Your company can pay into your pension directly. It is not capped by what you pay yourself, it counts as a business expense so it reduces your Corporation Tax, and there is no National Insurance on it either side. For surplus company cash it is usually far more efficient than paying yourself more salary or dividends. The limit is the £60,000 annual allowance, and you may be able to carry forward unused allowance from the last three years. Worth a conversation with your accountant.',
    min: 0,
    max: 5000,
    step: 25,
    largeStep: 250,
    format: 'gbp-monthly',
    default: 0,
  },

  avivaBalance: {
    label: 'How much is in your Aviva pension?',
    helper: 'A rough figure is fine. You can log in and check later.',
    explainer:
      'If you are not sure, an annual statement or the provider’s app will tell you. If you have lost track of an old pension entirely, the government’s free Pension Tracing Service can find it.',
    min: 0,
    max: 2000000,
    step: 500,
    largeStep: 10000,
    format: 'gbp',
    default: 20000,
  },

  peoplesPensionBalance: {
    label: 'How much is in your People’s Pension?',
    helper: 'Again, roughly is fine for now.',
    explainer:
      'Keeping them separate here lets us compare their charges, which matters if you are wondering whether to combine them.',
    min: 0,
    max: 2000000,
    step: 500,
    largeStep: 10000,
    format: 'gbp',
    default: 10000,
  },

  annualChargeRate: {
    label: 'What are you paying in charges?',
    helper: 'If you do not know, leave this at 0.5% — that is fairly typical.',
    explainer:
      'Every pension takes a small annual slice for running the fund and the platform. It sounds trivial, but it compounds against you for decades in exactly the way growth compounds for you. The difference between 0.25% and 0.95% on a decent-sized pot over twenty-five years can run to tens of thousands of pounds. Your annual statement will show it, sometimes called the ongoing charge or OCF.',
    min: 0,
    max: 0.025,
    step: 0.0005,
    format: 'percent',
    default: 0.005,
  },

  cashIsaBalance: {
    label: 'How much do you have in cash ISAs and savings?',
    helper: 'Money you could use in retirement, not your day-to-day account.',
    explainer:
      'Savings are not a worse choice than a pension — they are a different one. A pension gets you tax relief going in but you cannot touch it until 55 (57 from 2028). An ISA has no tax relief but you can reach it at any age, which makes it genuinely useful if you want to stop working before your pension unlocks.',
    min: 0,
    max: 1000000,
    step: 500,
    largeStep: 10000,
    format: 'gbp',
    default: 0,
  },

  cashIsaMonthly: {
    label: 'How much do you put into savings each month?',
    helper: 'Leave at zero if you are not saving separately right now.',
    explainer:
      'The usual order of priority is: a few months of emergency cash first, then any employer pension match (that is free money), then clear expensive debt, then pension, then ISA. Where you are in that list matters more than the exact split.',
    min: 0,
    max: 5000,
    step: 25,
    largeStep: 250,
    format: 'gbp-monthly',
    default: 0,
  },

  houseValue: {
    label: 'What is your house worth?',
    helper: 'Roughly what it would sell for today.',
    explainer:
      'We keep the house value and the mortgage separate so you can see your equity clearly, and so you can watch what happens as the mortgage comes down. We deliberately do not forecast house prices — nobody can, and a projection that pretends to would be misleading.',
    min: 0,
    max: 3000000,
    step: 5000,
    largeStep: 50000,
    format: 'gbp',
    default: 400000,
  },

  mortgageBalance: {
    label: 'How much is left on the mortgage?',
    helper: 'Put zero if it is paid off.',
    explainer:
      'This matters more than people expect. Every retirement income figure you will see quoted — including the lifestyle cards in this tool — assumes you own your home outright with nothing left to pay. If you are still paying a mortgage in retirement, you need meaningfully more income than those figures suggest.',
    min: 0,
    max: 2000000,
    step: 1000,
    largeStep: 25000,
    format: 'gbp',
    default: 120000,
  },

  mortgageRate: {
    label: 'What interest rate are you paying?',
    helper: 'On your current deal. If unsure, 4.5% is a reasonable guess.',
    explainer:
      'The rate decides how much of each payment clears the debt and how much simply disappears in interest. It also sets the bar for overpaying: paying down a mortgage at 5% is a guaranteed 5% return, which is a genuinely strong, risk-free result and worth comparing against what you might expect from investing instead.',
    min: 0,
    max: 0.12,
    step: 0.0005,
    format: 'percent',
    default: 0.045,
  },

  mortgageYearsLeft: {
    label: 'How many years left to run?',
    helper: 'On the current repayment schedule.',
    explainer:
      'Worth checking against your retirement age. Carrying a mortgage past the day you stop working is common, but it changes the sums considerably — the payment continues while the salary stops.',
    min: 0,
    max: 40,
    step: 1,
    format: 'years',
    default: 12,
  },

  mortgageOverpayment: {
    label: 'Could you overpay each month?',
    helper: 'Try moving this and watch the interest saved.',
    explainer:
      'Overpaying is one of the few genuinely risk-free returns available. Every pound off the balance saves you the interest that pound would have cost for the rest of the term. The trade-off is that money in a mortgage is hard to get back out, and it gets no tax relief — unlike a pension contribution. Most lenders allow overpayments of 10% of the balance a year without penalty, but check yours.',
    min: 0,
    max: 3000,
    step: 25,
    largeStep: 250,
    format: 'gbp-monthly',
    default: 0,
  },

  downsizeReleaseAmount: {
    label: 'If you moved somewhere smaller, what would you free up?',
    helper: 'The difference between selling yours and buying the next one.',
    explainer:
      'This is the number people most often get wrong, because it is tempting to think of the sale price rather than what is actually left over. Take the likely sale price, subtract what a smaller place would cost, then subtract roughly 2–3% for estate agent and legal fees, stamp duty and moving costs. What remains is the figure for this box. If you would rent instead, put in the full equity — but remember the rent then becomes a cost for the rest of your life.',
    min: 0,
    max: 1500000,
    step: 5000,
    largeStep: 25000,
    format: 'gbp',
    default: 0,
  },

  downsizeAge: {
    label: 'At what age would you move?',
    helper: 'Most people say around the time they stop working.',
    explainer:
      'Timing matters more than you might expect. Money freed up at 67 has decades to support you; money freed up at 80 has fewer years to cover, but also far less time to grow first. It is also worth being honest about whether you actually want to move — a plan that depends on giving up a home you love is a fragile plan.',
    min: 57,
    max: 95,
    step: 1,
    format: 'age',
    default: 67,
  },

  businessCashAmount: {
    label: 'How much do you expect from your business?',
    helper: 'Cash left in the company, or what you might sell it for.',
    explainer:
      'Be conservative here — a business is worth what someone will actually pay for it, and that is genuinely hard to predict. It is often better to move surplus company cash into your pension steadily along the way than to rely on one large payment at the end. That is what the company contribution box above is for.',
    min: 0,
    max: 2000000,
    step: 5000,
    largeStep: 50000,
    format: 'gbp',
    default: 0,
  },

  businessCashAge: {
    label: 'When would that arrive?',
    helper: 'Usually when you stop working.',
    explainer:
      'If you are not sure, use your retirement age. You can always come back and move it.',
    min: 55,
    max: 95,
    step: 1,
    format: 'age',
    default: 67,
  },

  statePensionAge: {
    label: 'When do you get your State Pension?',
    helper: 'For most people right now this is 66 or 67.',
    explainer:
      'The State Pension age is currently moving from 66 to 67 between 2026 and 2028, and a rise to 68 is legislated for the 2040s but still under review. The government’s State Pension forecast tool will tell you your exact date. It is worth checking — it is free and takes two minutes.',
    min: 60,
    max: 75,
    step: 1,
    format: 'age',
    default: 67,
  },

  qualifyingYears: {
    label: 'How many years of National Insurance do you have?',
    helper: 'You need 35 for the full amount. Not sure? Assume 35 for now and check.',
    explainer:
      'This is the single easiest thing on this page to check and the one most worth checking. You can see your record free on gov.uk. If you have gaps you can sometimes pay to fill them, and the return on doing so is usually excellent — often far better than anything else available to you. Years spent raising children or caring may already be credited without you realising.',
    min: 0,
    max: 35,
    step: 1,
    format: 'years',
    default: 35,
  },

  targetIncome: {
    label: 'What would you like to live on each year?',
    helper: 'Take-home, in today’s money. Pick a card above if you are not sure.',
    explainer:
      'This is the question everyone gets stuck on, and there is no wrong answer. The lifestyle cards give you a researched starting point based on what real retired households actually spend. Pick whichever feels closest, then nudge it. You are not committing to anything.',
    min: 8000,
    max: 120000,
    step: 500,
    largeStep: 5000,
    format: 'gbp',
    default: 32700,
  },
} as const satisfies Record<string, FieldDef>

export type FieldName = keyof typeof FIELDS

/**
 * Zod schema derived from the same definitions the sliders use.
 *
 * `.catch()` per field means one bad value falls back to its default rather
 * than invalidating the whole saved object — important because this parses
 * localStorage, which a user can edit and an older build may have written.
 */
const shape = Object.fromEntries(
  Object.entries(FIELDS).map(([name, def]) => [
    name,
    z.number().min(def.min).max(def.max).catch(def.default),
  ]),
) as unknown as Record<FieldName, z.ZodType<number>>

export const calculatorValuesSchema = z.object(shape)

export type CalculatorValues = Record<FieldName, number>

export const DEFAULT_VALUES: CalculatorValues = Object.fromEntries(
  Object.entries(FIELDS).map(([name, def]) => [name, def.default]),
) as CalculatorValues

/** Clamp a value to its field's bounds and snap it to the step. */
export function clampToField(name: FieldName, value: number): number {
  const def = FIELDS[name]
  if (!Number.isFinite(value)) return def.default
  const snapped = Math.round(value / def.step) * def.step
  const clamped = Math.min(def.max, Math.max(def.min, snapped))
  // Kill floating-point dust from the snap, e.g. 0.004999999999999999.
  return Number(clamped.toFixed(6))
}

/** Format a value for display, matching how the sliders label themselves. */
export function formatFieldValue(format: FieldFormat, value: number): string {
  switch (format) {
    case 'gbp':
      return value.toLocaleString('en-GB', {
        style: 'currency',
        currency: 'GBP',
        maximumFractionDigits: 0,
      })
    case 'gbp-monthly':
      return `${value.toLocaleString('en-GB', {
        style: 'currency',
        currency: 'GBP',
        maximumFractionDigits: 0,
      })} a month`
    case 'percent':
      return `${(value * 100).toFixed(2).replace(/\.?0+$/, '')}%`
    case 'age':
      return `age ${value}`
    case 'years':
      return `${value} ${value === 1 ? 'year' : 'years'}`
  }
}

/** Intl options for Base UI's slider, which uses them for aria-valuetext. */
export function intlOptionsFor(format: FieldFormat): Intl.NumberFormatOptions {
  switch (format) {
    case 'gbp':
    case 'gbp-monthly':
      return { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }
    case 'percent':
      return { style: 'percent', maximumFractionDigits: 2 }
    default:
      return { maximumFractionDigits: 0 }
  }
}
