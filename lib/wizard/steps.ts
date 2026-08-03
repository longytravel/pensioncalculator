/**
 * The wizard.
 *
 * Pages rather than single questions. Things that belong together are asked
 * together — nobody wants four separate screens to say how old they are, when
 * they want to stop, and what they want to live on. Only genuinely weighty
 * decisions get a page to themselves.
 *
 * The ordering is deliberate. Chapters 1 and 2 establish what she wants;
 * chapters 3 and 4 only ever ADD income, so the number at the top can only
 * rise as she works through. The gap waits for the results, where the levers
 * that close it are on the same screen.
 */

import type { FieldName } from '@/lib/fields'
import type { CalculatorState } from '@/lib/store'

export type Chapter = 'about' | 'life' | 'have' | 'paying'

export const CHAPTERS: Record<Chapter, string> = {
  about: 'About you',
  life: 'What you want',
  have: "What you've got",
  paying: 'What goes in',
}

export type Input =
  | { type: 'field'; field: FieldName }
  | { type: 'money'; field: FieldName; unknownable?: boolean }
  | { type: 'target' }
  | { type: 'choice'; option: ChoiceOption; label: string; choices: Choice[] }
  | { type: 'statePension' }
  | { type: 'risk' }

export type ChoiceOption =
  | 'contributionEscalation'
  | 'taperingStyle'
  | 'lumpSumIntent'
  | 'downsizeIntent'
  | 'legacyIntent'
  | 'workingArrangement'

export interface Choice {
  value: string
  label: string
  note?: string
}

export interface WizardPage {
  id: string
  chapter: Chapter
  /** The heading, in her words. */
  title: string
  /** One line under the heading. */
  why?: string
  inputs: Input[]
  skippable?: boolean
  /** Adaptive: an earlier answer can remove a whole page. */
  when?: (state: WizardVisibleState) => boolean
}

export interface WizardVisibleState {
  values: CalculatorState['values']
  workingArrangement: CalculatorState['workingArrangement']
  downsizeIntent: CalculatorState['downsizeIntent']
  lumpSumIntent: CalculatorState['lumpSumIntent']
  taperingStyle: CalculatorState['taperingStyle']
  legacyIntent: CalculatorState['legacyIntent']
}

export const PAGES: WizardPage[] = [
  {
    id: 'about',
    chapter: 'about',
    title: 'Let&rsquo;s start with the basics',
    why: 'Three quick things, then we get to the interesting part.',
    skippable: false,
    inputs: [
      { type: 'field', field: 'currentAge' },
      { type: 'field', field: 'retirementAge' },
      // Asked here rather than assumed: the tax relief sums, the dividend
      // comparison and the "same as you live on now" anchor all lean on it.
      { type: 'field', field: 'salary' },
    ],
  },

  {
    id: 'target',
    chapter: 'life',
    title: 'What would feel like enough, each month?',
    why: 'There is no right answer. Start anywhere and adjust.',
    skippable: false,
    inputs: [{ type: 'target' }],
  },

  {
    id: 'plans',
    chapter: 'life',
    title: 'How do you picture it?',
    why: 'Four quick ones. None of this commits you to anything.',
    inputs: [
      {
        type: 'choice',
        option: 'taperingStyle',
        label: 'Stop all at once, or ease off first?',
        choices: [
          { value: 'cliff', label: 'Stop in one go' },
          { value: 'taper', label: 'Go part-time first' },
          { value: 'unsure', label: 'No idea yet' },
        ],
      },
      {
        type: 'choice',
        option: 'lumpSumIntent',
        label: 'Want a lump sum when you stop?',
        choices: [
          { value: 'yes', label: 'Yes, for something specific' },
          { value: 'maybe', label: 'Maybe' },
          { value: 'no', label: "No, I'd rather have income" },
        ],
      },
      {
        type: 'choice',
        option: 'downsizeIntent',
        label: 'Could you see yourself moving somewhere smaller?',
        choices: [
          { value: 'yes', label: 'Yes, that was the plan' },
          { value: 'maybe', label: 'Maybe, if I needed to' },
          { value: 'no', label: "No, I'm staying put" },
        ],
      },
      {
        type: 'choice',
        option: 'legacyIntent',
        label: 'Want to leave something behind?',
        choices: [
          { value: 'yes', label: 'Yes, that matters' },
          { value: 'maybe', label: "Whatever's left is fine" },
          { value: 'no', label: 'Spend it, enjoy it' },
        ],
      },
    ],
  },

  {
    id: 'state-pension',
    chapter: 'have',
    title: 'Your State Pension',
    why: 'Most people get the full amount. Check this looks right.',
    inputs: [{ type: 'statePension' }],
  },

  {
    id: 'pensions',
    chapter: 'have',
    title: 'Your two pensions',
    why: "Rough figures are fine. If you don't know, say so and we'll add it to your list.",
    inputs: [
      { type: 'money', field: 'avivaBalance', unknownable: true },
      { type: 'money', field: 'peoplesPensionBalance', unknownable: true },
    ],
  },

  {
    id: 'pension-detail',
    chapter: 'have',
    title: 'How are they invested?',
    why: 'The question you asked first &mdash; and the one worth five minutes.',
    inputs: [
      { type: 'risk' },
      { type: 'money', field: 'annualChargeRate', unknownable: true },
    ],
  },

  {
    id: 'home',
    chapter: 'have',
    title: 'Your house',
    why: 'You thought of this as your lump sum. Let&rsquo;s see what it&rsquo;s really worth to you.',
    inputs: [
      { type: 'money', field: 'houseValue' },
      { type: 'money', field: 'mortgageBalance' },
    ],
  },

  {
    id: 'mortgage-detail',
    chapter: 'have',
    title: 'A bit more about the mortgage',
    why: 'This tells us whether it is gone before your income stops.',
    // Nothing to ask if it is already paid off.
    when: (s) => s.values.mortgageBalance > 0,
    inputs: [
      { type: 'money', field: 'mortgageRate' },
      { type: 'field', field: 'mortgageYearsLeft' },
      { type: 'money', field: 'mortgageOverpayment' },
    ],
  },

  {
    id: 'downsize',
    chapter: 'have',
    title: 'If you did move somewhere smaller',
    why: 'Remember the mortgage comes off the sale first, so it frees up less than the sale price.',
    when: (s) => s.downsizeIntent !== 'no',
    inputs: [
      { type: 'money', field: 'downsizeReleaseAmount' },
      { type: 'field', field: 'downsizeAge' },
    ],
  },

  {
    id: 'savings',
    chapter: 'have',
    title: 'Savings and ISAs',
    why: 'Unlike a pension, you can reach these at any age &mdash; which matters if you ever want to stop before 57.',
    inputs: [
      { type: 'money', field: 'cashIsaBalance' },
      { type: 'money', field: 'cashIsaMonthly' },
      { type: 'money', field: 'cashIsaLumpYearly' },
    ],
  },

  {
    id: 'business',
    chapter: 'have',
    title: 'Anything coming from the business?',
    why: 'Be conservative. A business is worth what someone will actually pay for it.',
    // Someone on payroll has no business to draw from.
    when: (s) => s.workingArrangement !== 'employee',
    inputs: [
      { type: 'money', field: 'businessCashAmount' },
      { type: 'field', field: 'businessCashAge' },
    ],
  },

  {
    id: 'paying-in',
    chapter: 'paying',
    title: 'What goes in each month',
    why: 'The part you can actually change &mdash; and where the biggest wins are.',
    inputs: [
      { type: 'money', field: 'personalMonthlyContribution' },
      { type: 'money', field: 'pensionLumpYearly' },
      {
        type: 'choice',
        option: 'contributionEscalation',
        label: 'Will you increase it over time?',
        choices: [
          { value: 'none', label: 'Keep it the same' },
          { value: 'inflation', label: 'Rise with prices' },
          { value: 'salary', label: 'Rise with my income' },
        ],
      },
    ],
  },

  {
    id: 'arrangement',
    chapter: 'paying',
    title: 'How do you work with Jack & Jones?',
    why: 'This decides what your company can do for your pension &mdash; the biggest lever here.',
    inputs: [
      {
        type: 'choice',
        option: 'workingArrangement',
        label: 'Pick whichever is closest',
        choices: [
          { value: 'ltd_outside_ir35', label: 'My own company, outside IR35' },
          { value: 'ltd_inside_ir35', label: 'My own company, inside IR35' },
          { value: 'umbrella', label: 'Through an umbrella company' },
          { value: 'employee', label: 'Employed on payroll' },
          { value: 'sole_trader', label: 'Self-employed, no company' },
          { value: 'unknown', label: "I'm not sure" },
        ],
      },
    ],
  },

  {
    id: 'company-pays',
    chapter: 'paying',
    title: 'Could the company pay in too?',
    why: 'Often the single most valuable thing available to you.',
    // Pointless for someone with no company.
    when: (s) =>
      s.workingArrangement !== 'sole_trader' &&
      s.workingArrangement !== 'employee',
    inputs: [{ type: 'money', field: 'employerMonthlyContribution' }],
  },
]

export function visiblePages(state: WizardVisibleState): WizardPage[] {
  return PAGES.filter((page) => !page.when || page.when(state))
}
