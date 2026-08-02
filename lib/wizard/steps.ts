/**
 * The wizard.
 *
 * One question per screen, always inside a single viewport, never scrolling.
 * Steps branch on her answers, so the path she walks is shorter and more
 * relevant than the full list below.
 *
 * The ordering is deliberate. Chapters 1 and 2 establish what she wants, and
 * chapters 3 and 4 only ever ADD income to the picture — which means the
 * number at the top only rises as she works through. The gap is never named
 * until the results, where it appears beside the levers that close it.
 */

import type { FieldName } from '@/lib/fields'
import type { CalculatorState } from '@/lib/store'

export type Chapter = 'about' | 'life' | 'have' | 'paying'

export const CHAPTERS: Record<Chapter, { title: string; blurb: string }> = {
  about: { title: 'About you', blurb: 'Two quick things to get started.' },
  life: {
    title: 'The life you want',
    blurb: 'The bit nobody ever asks you about.',
  },
  have: {
    title: "What you've already got",
    blurb: 'Rough figures are fine. Nothing here has to be exact.',
  },
  paying: {
    title: 'What goes in',
    blurb: 'The part you can actually change.',
  },
}

/** How the step collects its answer. */
export type StepKind =
  | { type: 'field'; field: FieldName }
  | { type: 'target' }
  | { type: 'choice'; option: ChoiceOption; choices: Choice[] }
  | { type: 'confirm'; field: FieldName; adjustable: FieldName[] }
  | { type: 'money'; field: FieldName; unknownable?: boolean }
  | { type: 'risk'; pot: 'aviva' | 'peoples' }

export type ChoiceOption =
  | 'taperingStyle'
  | 'lumpSumIntent'
  | 'downsizeIntent'
  | 'legacyIntent'
  | 'workingArrangement'

export interface Choice {
  value: string
  label: string
  /** Optional second line on the card. */
  note?: string
}

export interface WizardStep {
  id: string
  chapter: Chapter
  /** The question, in her words. */
  question: string
  /** Why we're asking. One line, above the input. */
  why?: string
  kind: StepKind
  /** False for the two steps the whole thing depends on. */
  skippable?: boolean
  /**
   * Only show this step when the condition holds. This is what makes the path
   * adaptive — an answer earlier can remove several steps later.
   */
  when?: (state: WizardVisibleState) => boolean
}

/** The slice of state the branching rules are allowed to read. */
export interface WizardVisibleState {
  values: CalculatorState['values']
  workingArrangement: CalculatorState['workingArrangement']
  downsizeIntent: CalculatorState['downsizeIntent']
  lumpSumIntent: CalculatorState['lumpSumIntent']
  taperingStyle: CalculatorState['taperingStyle']
  legacyIntent: CalculatorState['legacyIntent']
}

const YES_MAYBE_NO: Choice[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'maybe', label: 'Maybe' },
  { value: 'no', label: 'No' },
]

export const STEPS: WizardStep[] = [
  // ---------------------------------------------------------------- about
  {
    id: 'age',
    chapter: 'about',
    question: 'How old are you now?',
    why: 'It tells us how long your money has to grow.',
    kind: { type: 'field', field: 'currentAge' },
    skippable: false,
  },
  {
    id: 'retire-age',
    chapter: 'about',
    question: 'When would you like to stop working?',
    why: "Nothing's fixed. Move it around and see what happens.",
    kind: { type: 'field', field: 'retirementAge' },
  },

  // ----------------------------------------------------------------- life
  {
    id: 'target',
    chapter: 'life',
    question: 'What would feel like enough, each month?',
    why: 'There is no right answer. Start anywhere and adjust.',
    kind: { type: 'target' },
    skippable: false,
  },
  {
    id: 'taper',
    chapter: 'life',
    question: 'Stop all at once, or ease off first?',
    why: 'Going part-time costs less than you might think.',
    kind: {
      type: 'choice',
      option: 'taperingStyle',
      choices: [
        { value: 'cliff', label: 'Stop in one go' },
        {
          value: 'taper',
          label: 'Go part-time first',
          note: 'Keep earning, keep paying in',
        },
        { value: 'unsure', label: 'No idea yet' },
      ],
    },
  },
  {
    id: 'lump-sum',
    chapter: 'life',
    question: 'Do you want a lump sum when you stop?',
    why: 'A quarter of your pension can normally be taken tax-free.',
    kind: {
      type: 'choice',
      option: 'lumpSumIntent',
      choices: [
        { value: 'yes', label: 'Yes, for something specific' },
        { value: 'maybe', label: 'Maybe, nothing planned' },
        { value: 'no', label: "No, I'd rather have the income" },
      ],
    },
  },
  {
    id: 'legacy',
    chapter: 'life',
    question: 'Do you want to leave something behind?',
    why: 'Pensions usually pass on free of inheritance tax.',
    kind: {
      type: 'choice',
      option: 'legacyIntent',
      choices: [
        { value: 'yes', label: 'Yes, that matters to me' },
        { value: 'maybe', label: "Whatever's left is fine" },
        { value: 'no', label: 'Spend it, enjoy it' },
      ],
    },
  },
  {
    id: 'downsize',
    chapter: 'life',
    question: 'Could you see yourself moving somewhere smaller?',
    why: "You've a lot tied up in the house. This decides whether we count it.",
    kind: {
      type: 'choice',
      option: 'downsizeIntent',
      choices: [
        { value: 'yes', label: 'Yes, that was the plan' },
        { value: 'maybe', label: 'Maybe, if I needed to' },
        { value: 'no', label: "No, I'm staying put" },
      ],
    },
  },

  // ----------------------------------------------------------------- have
  {
    id: 'state-pension',
    chapter: 'have',
    question: 'Your State Pension',
    why: 'Most people get the full amount. Check this sounds right.',
    kind: {
      type: 'confirm',
      field: 'qualifyingYears',
      adjustable: ['qualifyingYears', 'statePensionAge'],
    },
  },
  {
    id: 'aviva-balance',
    chapter: 'have',
    question: "How much is in your Aviva pension?",
    why: "A rough figure is fine — you can check the exact one later.",
    kind: { type: 'money', field: 'avivaBalance', unknownable: true },
  },
  {
    id: 'aviva-risk',
    chapter: 'have',
    question: 'How is the Aviva one invested?',
    why: "If you've never chosen, you're in the default — usually the middle one.",
    kind: { type: 'risk', pot: 'aviva' },
  },
  {
    id: 'peoples-balance',
    chapter: 'have',
    question: "And your People's Pension?",
    why: 'Same again. Roughly is fine.',
    kind: { type: 'money', field: 'peoplesPensionBalance', unknownable: true },
  },
  {
    id: 'isa',
    chapter: 'have',
    question: 'Any savings or ISAs?',
    why: "Unlike a pension, you can reach these at any age.",
    kind: { type: 'money', field: 'cashIsaBalance' },
  },
  {
    id: 'business-cash',
    chapter: 'have',
    question: 'Anything coming from the business?',
    why: 'Be conservative. A business is worth what someone will actually pay.',
    kind: { type: 'money', field: 'businessCashAmount' },
    when: (s) => s.workingArrangement !== 'employee',
  },
  {
    id: 'house-value',
    chapter: 'have',
    question: 'What is your house worth?',
    why: 'Roughly what it would sell for today.',
    kind: { type: 'money', field: 'houseValue' },
  },
  {
    id: 'mortgage',
    chapter: 'have',
    question: 'How much is left on the mortgage?',
    why: 'This decides whether the payments stop before your income does.',
    kind: { type: 'money', field: 'mortgageBalance' },
  },
  {
    id: 'downsize-amount',
    chapter: 'have',
    question: 'What would moving free up?',
    why: 'After selling costs and buying somewhere smaller.',
    kind: { type: 'money', field: 'downsizeReleaseAmount' },
    // Only worth asking if she has not ruled it out.
    when: (s) => s.downsizeIntent !== 'no',
  },

  // --------------------------------------------------------------- paying
  {
    id: 'personal-contribution',
    chapter: 'paying',
    question: 'How much do you pay in each month?',
    why: 'What actually leaves your account. We add the tax relief on top.',
    kind: { type: 'money', field: 'personalMonthlyContribution' },
  },
  {
    id: 'arrangement',
    chapter: 'paying',
    question: 'How do you work with Jack & Jones?',
    why: 'This changes what your company can do for your pension.',
    kind: {
      type: 'choice',
      option: 'workingArrangement',
      choices: [
        { value: 'ltd_outside_ir35', label: 'My own company, outside IR35' },
        { value: 'ltd_inside_ir35', label: 'My own company, inside IR35' },
        { value: 'umbrella', label: 'Through an umbrella company' },
        { value: 'employee', label: 'Employed on payroll' },
        { value: 'sole_trader', label: 'Self-employed, no company' },
        { value: 'unknown', label: "I'm not sure" },
      ],
    },
  },
  {
    id: 'company-contribution',
    chapter: 'paying',
    question: 'Could the company pay in each month?',
    why: 'Often the single most valuable thing available to you.',
    kind: { type: 'money', field: 'employerMonthlyContribution' },
    // Pointless to ask someone with no company.
    when: (s) =>
      s.workingArrangement !== 'sole_trader' &&
      s.workingArrangement !== 'employee',
  },
]

/** Unused import guard — YES_MAYBE_NO is kept for future yes/maybe/no steps. */
void YES_MAYBE_NO

/** The steps she will actually see, given her answers so far. */
export function visibleSteps(state: WizardVisibleState): WizardStep[] {
  return STEPS.filter((step) => !step.when || step.when(state))
}

/**
 * Where she is, expressed against the path she is actually walking.
 *
 * Recomputed from the visible steps rather than the full list, so a branch
 * that removes steps shortens the journey instead of leaving gaps.
 */
export function progressFor(
  state: WizardVisibleState,
  stepId: string,
): { index: number; total: number; chapter: Chapter } {
  const steps = visibleSteps(state)
  const index = Math.max(
    0,
    steps.findIndex((s) => s.id === stepId),
  )
  return {
    index,
    total: steps.length,
    chapter: steps[index]?.chapter ?? 'about',
  }
}
