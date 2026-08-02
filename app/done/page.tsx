'use client'

/**
 * The end of the review.
 *
 * Three things, in this order: what she now knows, what to go and find out,
 * and the email to her accountant. Anything she said she didn't know becomes a
 * tracked item she can tick off and come back to — it all persists, so the
 * list is still here next week.
 */

import * as React from 'react'
import Link from 'next/link'
import { Check, Circle, ArrowUpRight, Printer } from 'lucide-react'

import {
  useCalculatorStore,
  useStoreHydrated,
  toEngineInputs,
} from '@/lib/store'
import { project } from '@/lib/engine/project'
import { ProjectionChart } from '@/components/projection-chart'
import { advise } from '@/lib/advice'
import { ActionPlan, AccountantPanel } from '@/components/advice-cards'
import { Comparison } from '@/components/comparison'
import { compareDestinations, feeDrag } from '@/lib/advice/comparison'
import { DEFAULT_VALUES, FIELDS, type FieldName } from '@/lib/fields'
import { StartAgain } from '@/components/start-again'

const gbp = (n: number) =>
  Math.round(n).toLocaleString('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  })

/** How to actually find each thing she didn't know. */
const HOW_TO_FIND: Partial<Record<FieldName, string>> = {
  avivaBalance:
    'Log in to Aviva, or find your last annual statement. Your policy number is on any letter from them.',
  peoplesPensionBalance:
    'Log in to The People’s Pension, or check your last statement.',
  qualifyingYears:
    'Go to gov.uk/check-state-pension. It is free and takes about two minutes.',
  annualChargeRate:
    'On your annual statement, look for the ongoing charge, OCF, or annual management charge.',
  houseValue:
    'Look at what similar places near you have actually sold for, not what they are listed at.',
  mortgageBalance: 'Your lender’s app or your last mortgage statement.',
  businessCashAmount: 'Your accountant will know this one straight away.',
}

export default function Done() {
  const store = useCalculatorStore()
  const hydrated = useStoreHydrated()
  const values = hydrated ? store.values : DEFAULT_VALUES

  const advice = React.useMemo(() => {
    try {
      return advise({ ...store, values })
    } catch {
      return null
    }
  }, [store, values])

  const projection = React.useMemo(() => {
    try {
      return project(toEngineInputs({ ...store, values }), { inRealTerms: true })
    } catch {
      return null
    }
  }, [store, values])

  // Everything she told us she didn't know, plus anything she skipped past.
  const toFind = (Object.keys(store.unknown) as FieldName[]).filter(
    (f) => store.unknown[f],
  )

  if (!advice) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <p>Something went wrong with your figures. Try the review again.</p>
      </main>
    )
  }

  const d = advice.derived

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8 sm:px-6 lg:max-w-3xl">
      {/* Only the printed page sees this. */}
      <p className="print-only mb-4 border-b pb-2 text-sm">
        Your retirement plan &mdash; all figures in today&rsquo;s money.
        Guidance, not financial advice.
      </p>

      <p className="eyebrow text-xs text-muted-foreground">That&rsquo;s it</p>
      <h1 className="mt-1 text-3xl font-extrabold uppercase sm:text-4xl">
        Here&rsquo;s where you stand
      </h1>

      <section className="mt-6 border-2 p-5">
        <p className="leading-none">
          <span className="figure text-4xl sm:text-5xl">
            {gbp(d.projectedMonthly)}
          </span>
          <span className="ml-2 text-lg text-muted-foreground">a month</span>
        </p>
        <p className="mt-2 text-base text-muted-foreground">
          after tax, in today&rsquo;s money, against the{' '}
          {gbp(d.targetMonthly)}
          {' a month you said you wanted.'}
        </p>

        {!d.onTrack && (
          <p className="mt-3 border-l-4 border-l-destructive bg-muted p-3 text-base">
            {'That leaves '}
            <strong>{gbp(d.shortfallMonthly)} a month</strong>
            {' to find. Everything below moves that number — the first one moves it most.'}
          </p>
        )}
        {d.onTrack && (
          <p className="mt-3 border-l-4 border-l-foreground bg-muted p-3 text-base">
            <strong>You are on track</strong>
            {' for what you asked for. Worth looking at what happens if you want to stop earlier.'}
          </p>
        )}
      </section>

      {projection && (
        <div className="mt-6">
          <ProjectionChart
            output={projection}
            retirementAge={values.retirementAge}
            planningAge={values.planningAge}
          />
        </div>
      )}

      {/* The things she said she did not know, kept and tickable. */}
      {toFind.length > 0 && (
        <section className="mt-6 border bg-card">
          <header className="border-b px-5 py-4">
            <p className="eyebrow text-xs text-muted-foreground">
              Saved for you &mdash; still here when you come back
            </p>
            <h2 className="mt-1 text-xl font-bold uppercase">
              Things to go and find out
            </h2>
          </header>

          <ul className="divide-y">
            {toFind.map((field) => (
              <FindItem key={field} field={field} />
            ))}
          </ul>

          <p className="border-t px-5 py-3 text-sm text-muted-foreground">
            We used sensible estimates for these, not zero. Filling them in will
            make your number more accurate &mdash; and it may well be better
            news than the estimate.
          </p>
        </section>
      )}

      <div className="mt-6">
        <ActionPlan actions={advice.actions} />
      </div>

      <div className="mt-6">
        <Comparison
          destinations={compareDestinations({ ...store, values }, d)}
          feeDrag={feeDrag({ ...store, values }, d)}
          years={d.yearsToRetirement}
        />
      </div>

      <div className="mt-6">
        <AccountantPanel
          questions={advice.accountantQuestions}
          emailBody={advice.emailBody}
        />
      </div>

      <div className="no-print mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/plan"
          className="btn-square flex h-14 flex-1 items-center justify-center bg-primary text-base font-bold uppercase tracking-wide text-primary-foreground transition-colors hover:bg-primary/90"
        >
          See the full picture
        </Link>
        <Link
          href="/review"
          className="btn-square flex h-14 flex-1 items-center justify-center border text-base font-bold uppercase tracking-wide transition-colors hover:bg-muted"
        >
          Change an answer
        </Link>
      </div>

      <button
        type="button"
        onClick={() => window.print()}
        className="no-print btn-square mt-3 flex h-12 w-full items-center justify-center gap-2 border text-sm font-bold uppercase tracking-wide transition-colors hover:bg-muted"
      >
        <Printer className="size-4" aria-hidden="true" />
        Print it, or save it as a PDF
      </button>

      <div className="no-print mt-6 border-t pt-4">
        <StartAgain />
      </div>

      <footer className="mt-8 border-t pt-6 text-sm leading-relaxed text-muted-foreground">
        <p>
          Information and estimates to help you think &mdash; not financial
          advice. Figures are estimates, not guarantees. Free impartial guidance
          at{' '}
          <a
            className="underline"
            href="https://www.moneyhelper.org.uk"
            target="_blank"
            rel="noopener noreferrer"
          >
            MoneyHelper
          </a>
          , and{' '}
          <a
            className="underline"
            href="https://www.moneyhelper.org.uk/en/pensions-and-retirement/pension-wise"
            target="_blank"
            rel="noopener noreferrer"
          >
            Pension Wise
          </a>{' '}
          is free to you from 50 &mdash; genuinely worth booking.
        </p>
        <p className="mt-2">
          Want the workings?{' '}
          <Link href="/how" className="underline">
            How we worked this out
          </Link>
          .
        </p>
      </footer>
    </main>
  )
}

function FindItem({ field }: { field: FieldName }) {
  const store = useCalculatorStore()
  const done = store.found.includes(field)

  return (
    <li className="flex items-start gap-3 px-5 py-4">
      <button
        type="button"
        onClick={() => store.toggleFound(field)}
        aria-pressed={done}
        aria-label={done ? 'Mark as still to do' : 'Mark as done'}
        className="mt-0.5 shrink-0"
      >
        {done ? (
          <Check className="size-5" aria-hidden="true" />
        ) : (
          <Circle className="size-5 text-muted-foreground" aria-hidden="true" />
        )}
      </button>

      <div className={`min-w-0 flex-1 ${done ? 'opacity-50' : ''}`}>
        <p className="text-base font-semibold">{FIELDS[field].label}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {HOW_TO_FIND[field] ?? 'Check your latest statement.'}
        </p>
        <Link
          href="/review"
          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold underline"
        >
          Add it now
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
    </li>
  )
}
