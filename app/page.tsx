'use client'

/**
 * Working preview of the calculator core.
 *
 * Not the finished seven-screen flow — this is the engine, the store and the
 * slider wired together so the numbers can be seen and sanity-checked while the
 * rest is built around them.
 */

import * as React from 'react'
import {
  useCalculatorStore,
  useStoreHydrated,
  toEngineInputs,
} from '@/lib/store'
import { project } from '@/lib/engine/project'
import { EngineInputError } from '@/lib/engine/types'
import { RETIREMENT_LIVING_STANDARDS } from '@/lib/engine/assumptions'
import { CalculatorSlider } from '@/components/calculator-slider'
import { Assistant } from '@/components/assistant'
import { Card } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { DEFAULT_VALUES, type FieldName } from '@/lib/fields'

const gbp = (n: number) =>
  n.toLocaleString('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  })

const SLIDERS: FieldName[] = [
  'currentAge',
  'retirementAge',
  'personalMonthlyContribution',
  'employerMonthlyContribution',
  'avivaBalance',
  'peoplesPensionBalance',
  'targetIncome',
]

export default function Home() {
  const store = useCalculatorStore()

  // Saved figures only exist in the browser, so the server and the very first
  // client render both use the defaults. Once persist has rehydrated we switch
  // to her real numbers. Rendering the full page either way means no flash of
  // an empty screen and no hydration mismatch.
  const hydrated = useStoreHydrated()
  const values = hydrated ? store.values : DEFAULT_VALUES

  const { output, error } = React.useMemo(() => {
    try {
      return {
        output: project(toEngineInputs({ ...store, values }), {
          inRealTerms: store.inRealTerms,
        }),
        error: null as string | null,
      }
    } catch (e) {
      return {
        output: null,
        error:
          e instanceof EngineInputError ? e.message : 'Something went wrong.',
      }
    }
  }, [store, values])
  const moderate = RETIREMENT_LIVING_STANDARDS.uk.moderate.single

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <p className="eyebrow text-sm text-muted-foreground">Your money plan</p>
        <h1 className="mt-1 text-4xl font-extrabold uppercase sm:text-5xl">
          Where you stand
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Move the sliders and watch what happens. Nothing is saved anywhere but
          your own browser, and there are no wrong answers here.
        </p>
      </header>

      {output && (
        <Card className="mb-8 border-2 p-6">
          <h2 className="eyebrow text-sm text-muted-foreground">
            On track for
          </h2>

          <p className="mt-2 leading-none">
            <span className="figure text-5xl sm:text-6xl">
              {gbp(output.gap.projectedNetIncome / 12)}
            </span>
            <span className="ml-2 text-xl text-muted-foreground">a month</span>
            <span className="mt-2 block text-base font-normal text-muted-foreground">
              after tax, in today&rsquo;s money &mdash; that&rsquo;s{' '}
              {gbp(output.gap.projectedNetIncome)} a year
            </span>
          </p>

          <div
            className={`mt-5 border-l-4 p-4 ${
              output.gap.onTrack
                ? 'border-l-foreground bg-muted'
                : 'border-l-destructive bg-muted'
            }`}
          >
            {output.gap.onTrack ? (
              <p className="text-lg">
                <strong>You&rsquo;re on track.</strong> That&rsquo;s{' '}
                {gbp(output.gap.gap)} a year more than you said you wanted.
              </p>
            ) : (
              <>
                <p className="text-lg">
                  <strong>
                    You&rsquo;re about {gbp(Math.abs(output.gap.gap) / 12)} a
                    month short
                  </strong>{' '}
                  of the {gbp(output.gap.targetNetIncome)} a year you asked for.
                </p>
                <p className="mt-2 text-lg">
                  Paying in an extra{' '}
                  <strong>
                    {gbp(output.gap.requiredExtraMonthlyContribution)} a month
                  </strong>{' '}
                  would close it.
                </p>
              </>
            )}
          </div>

          <dl className="mt-6 grid grid-cols-3 gap-4 border-t pt-5 text-center">
            {(['low', 'mid', 'high'] as const).map((s) => (
              <div key={s}>
                <dt className="eyebrow text-xs text-muted-foreground">
                  {s === 'mid'
                    ? 'expected'
                    : s === 'low'
                      ? 'cautious'
                      : 'optimistic'}
                </dt>
                <dd className="figure mt-1 text-xl">
                  {gbp(output.scenarios[s].potAtRetirement)}
                </dd>
                {output.scenarios[s].potDepletionAge && (
                  <dd className="mt-1 text-xs font-semibold text-destructive">
                    runs out at {output.scenarios[s].potDepletionAge}
                  </dd>
                )}
              </div>
            ))}
          </dl>
          <p className="mt-3 text-center text-sm text-muted-foreground">
            What your pensions could be worth when you stop working. Three
            possibilities, not a promise.
          </p>

          {output.warnings.length > 0 && (
            <Alert className="mt-5">
              <ul className="list-inside list-disc space-y-1">
                {output.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </Alert>
          )}
        </Card>
      )}

      {error && (
        <Alert className="mb-8 border-destructive">
          <p>{error}</p>
        </Alert>
      )}

      <p className="mb-4 text-base text-muted-foreground">
        For reference: research into what retired households actually spend puts
        a &ldquo;moderate&rdquo; lifestyle for one person at about{' '}
        <strong>{gbp(moderate)} a year</strong> — assuming no mortgage left to
        pay.
      </p>

      <div className="space-y-4">
        {SLIDERS.map((name) => (
          <CalculatorSlider
            key={name}
            name={name}
            value={values[name]}
            onChange={(v) => store.setValue(name, v)}
            suggestion={
              store.suggestion?.field === name
                ? {
                    value: store.suggestion.value,
                    rationale: store.suggestion.rationale,
                  }
                : null
            }
            onAcceptSuggestion={store.acceptSuggestion}
            onDismissSuggestion={store.dismissSuggestion}
          />
        ))}
      </div>

      <div className="mt-10 h-[32rem]">
        <Assistant />
      </div>

      <footer className="mt-10 border-t pt-6 text-sm leading-relaxed text-muted-foreground">
        <p>
          This tool gives you information and estimates to help you think. It is
          not financial advice, and it cannot know your full circumstances.
          Figures are estimates, not guarantees, and investments can go down as
          well as up. For free, impartial guidance try{' '}
          <a
            className="underline"
            href="https://www.moneyhelper.org.uk"
            target="_blank"
            rel="noopener noreferrer"
          >
            MoneyHelper
          </a>
          , or{' '}
          <a
            className="underline"
            href="https://www.moneyhelper.org.uk/en/pensions-and-retirement/pension-wise"
            target="_blank"
            rel="noopener noreferrer"
          >
            Pension Wise
          </a>{' '}
          once you turn 50.
        </p>
      </footer>
    </main>
  )
}
