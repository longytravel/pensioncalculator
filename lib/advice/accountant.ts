/**
 * The accountant list, which changes with her answers.
 *
 * Someone inside IR35 needs different questions from someone outside, and
 * someone sitting on business cash needs different ones again. She said she is
 * emailing tomorrow, so the whole thing has to be copy-and-send ready.
 */

import type { AccountantQuestion, AdviceState, Derived } from './types'

const gbp = (n: number) =>
  Math.round(n).toLocaleString('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  })

export function buildAccountantQuestions(
  state: AdviceState,
  d: Derived,
): AccountantQuestion[] {
  const v = state.values
  const out: AccountantQuestion[] = []

  if (state.workingArrangement === 'unknown') {
    out.push({
      id: 'ir35',
      question:
        'Am I inside or outside IR35 on my Jack & Jones contract, and do we have the Status Determination Statement?',
      why: 'It decides whether my company can pay into my pension at all.',
      goodAnswer:
        'A clear inside or outside, and a copy of the statement the client issued.',
      priority: 1,
    })
  }

  if (
    state.workingArrangement === 'ltd_outside_ir35' ||
    state.workingArrangement === 'unknown'
  ) {
    out.push({
      id: 'company-amount',
      question:
        'How much can the company pay into my pension this year, and does the wholly and exclusively test cause any problem?',
      why: 'Employer contributions are not limited by my salary, only by the annual allowance.',
      goodAnswer:
        'A specific figure for this year, and confirmation it is an allowable business expense.',
      priority: 2,
    })

    out.push({
      id: 'dividend-vs-pension',
      question: `Comparing like for like: is ${gbp(d.tenKDividendNet)} in my hand as a dividend really worse for me than £10,000 going into the pension?`,
      why: 'I want to understand the actual trade-off before I change anything.',
      goodAnswer:
        'A worked comparison on my real figures, including when I would pay tax on the pension later.',
      priority: 3,
    })
  }

  if (state.workingArrangement === 'ltd_inside_ir35') {
    out.push({
      id: 'inside-ir35-pension',
      question:
        'Working inside IR35, can any pension contribution be made before tax — either by the fee-payer, or by moving to an umbrella with salary sacrifice?',
      why: 'I understand the tax comes off before the money reaches my company.',
      goodAnswer:
        'A straight answer on what my contract actually allows, not what is theoretically possible.',
      priority: 1,
    })
  }

  if (state.workingArrangement === 'umbrella') {
    out.push({
      id: 'umbrella-sacrifice',
      question:
        'Can I salary sacrifice into a pension through the umbrella, and what scheme and charges would that use?',
      why: 'Salary sacrifice saves National Insurance as well as income tax.',
      goodAnswer:
        'Yes, with the scheme named and its charges confirmed in writing.',
      priority: 1,
    })
  }

  if (v.businessCashAmount >= 30000) {
    out.push({
      id: 'carry-forward',
      question: `I have around ${gbp(v.businessCashAmount)} building up. Can I use carry forward from the last three years to put in more than £60,000?`,
      why: 'Unused allowance from earlier years may still be available.',
      goodAnswer:
        'A figure for how much unused allowance I have, year by year.',
      priority: 2,
    })

    out.push({
      id: 'wind-down',
      question:
        'If I ever wind the company down, am I better making pension contributions along the way or taking it as capital at the end?',
      why: 'I would rather plan this now than find out afterwards.',
      goodAnswer:
        'A comparison of both routes, including any reliefs I might qualify for.',
      priority: 5,
    })
  }

  if (v.salary < 6708 && state.workingArrangement.startsWith('ltd')) {
    out.push({
      id: 'qualifying-year',
      question:
        'Is my salary high enough for this year to count toward my State Pension?',
      why: 'A low salary can quietly cost qualifying years worth far more than the tax saved.',
      goodAnswer:
        'Confirmation my salary is at or above the lower earnings limit.',
      priority: 2,
    })
  }

  if (d.missingNiYears > 0) {
    out.push({
      id: 'ni-gaps',
      question: `I have ${d.missingNiYears} gaps in my National Insurance record. Is it worth paying to fill them?`,
      why: 'Each year is worth roughly £360 a year of State Pension, for life.',
      goodAnswer: 'A cost per year against what each one would pay back.',
      priority: 4,
    })
  }

  out.push({
    id: 'anything-missed',
    question: 'Is there anything obvious I am missing here?',
    why: 'You know things about my situation that a calculator cannot.',
    goodAnswer: 'Anything at all — this is the question that finds the surprises.',
    priority: 9,
  })

  return out.sort((a, b) => a.priority - b.priority)
}

/** Ready to paste. She said she is sending it tomorrow. */
export function buildEmail(questions: AccountantQuestion[]): string {
  const top = questions.slice(0, 5)

  return [
    'Hi,',
    '',
    'I have been going through my pension and I have a few questions I would really value your view on.',
    '',
    ...top.map((q, i) => `${i + 1}. ${q.question}`),
    '',
    'Written answers I can keep would be really useful, so I can refer back to them.',
    '',
    'Thanks very much,',
    'Kirsten',
  ].join('\n')
}
