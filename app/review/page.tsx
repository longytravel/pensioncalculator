'use client'

/**
 * The step-by-step review.
 *
 * One question on screen at a time, inside a fixed frame with the number
 * pinned above it. Nothing scrolls, so she can never lose sight of what her
 * answers are doing.
 */

import * as React from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, MessageCircleQuestion } from 'lucide-react'

import {
  useCalculatorStore,
  useStoreHydrated,
  toEngineInputs,
} from '@/lib/store'
import { project } from '@/lib/engine/project'
import { visibleSteps, CHAPTERS, type WizardVisibleState } from '@/lib/wizard/steps'
import { NumberBar, type NumberBarState } from '@/components/wizard/number-bar'
import { StepInput } from '@/components/wizard/step-input'
import { InsightCard } from '@/components/advice-cards'
import { advise } from '@/lib/advice'
import { DEFAULT_VALUES } from '@/lib/fields'

/**
 * Which insight belongs to which step.
 *
 * The learning has to land at the step that earned it — telling her about IR35
 * twenty screens after she answered the question is worth almost nothing.
 */
const STEP_INSIGHTS: Record<string, string[]> = {
  'retire-age': ['bridge-gap', 'mortgage-clears-first', 'mortgage-outlasts'],
  'state-pension': ['state-pension-full', 'ni-gaps'],
  'aviva-balance': ['unknown-balance'],
  'aviva-risk': ['cautious-too-early', 'charges-high'],
  'peoples-balance': ['unknown-balance'],
  isa: ['no-isa'],
  'house-value': ['equity-real'],
  mortgage: ['mortgage-clears-first', 'mortgage-outlasts'],
  arrangement: ['ir35-unknown', 'company-route-open'],
  'company-contribution': ['company-route-open'],
}

export default function Review() {
  const store = useCalculatorStore()
  const hydrated = useStoreHydrated()
  const values = hydrated ? store.values : DEFAULT_VALUES

  const branchState: WizardVisibleState = {
    values,
    workingArrangement: store.workingArrangement,
    downsizeIntent: store.downsizeIntent,
    lumpSumIntent: store.lumpSumIntent,
    taperingStyle: store.taperingStyle,
    legacyIntent: store.legacyIntent,
  }

  const steps = React.useMemo(
    () => visibleSteps(branchState),
    // Recompute whenever an answer could change the path.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      store.workingArrangement,
      store.downsizeIntent,
      store.lumpSumIntent,
      store.taperingStyle,
      store.legacyIntent,
    ],
  )

  const index = Math.max(
    0,
    steps.findIndex((s) => s.id === store.currentStepId),
  )
  const step = steps[index] ?? steps[0]
  const isLast = index >= steps.length - 1

  const projection = React.useMemo(() => {
    try {
      return project(toEngineInputs({ ...store, values }), {
        inRealTerms: true,
      })
    } catch {
      return null
    }
  }, [store, values])

  // The number stays quiet until it would mean something, shows her goal while
  // she is deciding what she wants, then counts up as she adds what she has.
  const chapter = step?.chapter ?? 'about'
  const barState: NumberBarState =
    chapter === 'about'
      ? { mode: 'quiet' }
      : chapter === 'life'
        ? { mode: 'goal', goalMonthly: Math.round(values.targetIncome / 12) }
        : {
            mode: 'building',
            soFarMonthly: projection
              ? Math.round(projection.gap.projectedNetIncome / 12)
              : 0,
            goalMonthly: Math.round(values.targetIncome / 12),
          }

  // Recomputed live, so the insight reflects the answer she just gave.
  const advice = React.useMemo(() => {
    try {
      return advise({ ...store, values })
    } catch {
      return null
    }
  }, [store, values])

  const stepInsights = (STEP_INSIGHTS[step?.id ?? ''] ?? [])
    .map((id) => advice?.insights.find((i) => i.id === id))
    .filter((i) => i !== undefined)
    .slice(0, 1)

  const go = (delta: number) => {
    const next = steps[index + delta]
    if (next) store.goToStep(next.id)
  }

  const advance = (outcome: 'answered' | 'skipped') => {
    if (step) store.markStep(step.id, outcome)
    if (isLast) {
      window.location.href = '/plan'
      return
    }
    go(1)
  }

  if (!step) return null

  return (
    <div className="flex min-h-dvh flex-col">
      <NumberBar state={barState} />

      {/* Progress against the path she is actually walking, not the full list. */}
      <div className="h-1 w-full bg-muted">
        <div
          className="h-full bg-foreground transition-all duration-300"
          style={{ width: `${((index + 1) / steps.length) * 100}%` }}
        />
      </div>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 py-6 sm:px-6">
        <p className="eyebrow text-[11px] text-muted-foreground">
          {CHAPTERS[step.chapter].title} &middot; {index + 1} of {steps.length}
        </p>

        <h1 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">
          {step.question}
        </h1>
        {step.why && (
          <p className="mt-2 text-base text-muted-foreground">{step.why}</p>
        )}

        <div className="my-auto py-6">
          <StepInput kind={step.kind} />

          {/* Lands under the input she just used, not on a later screen. */}
          {stepInsights.length > 0 && (
            <div className="mt-6 space-y-3">
              {stepInsights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          )}
        </div>

        <div className="mt-auto">
          <button
            type="button"
            onClick={() => advance('answered')}
            className="btn-square flex h-14 w-full items-center justify-center gap-2 bg-primary text-lg font-bold uppercase tracking-wide text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {isLast ? 'See the whole picture' : 'Next'}
            <ArrowRight className="size-5" aria-hidden="true" />
          </button>

          <div className="mt-3 flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={index === 0}
              className="flex items-center gap-1 text-muted-foreground underline disabled:opacity-40"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back
            </button>

            {step.skippable !== false && (
              <button
                type="button"
                onClick={() => advance('skipped')}
                className="text-muted-foreground underline"
              >
                Skip for now
              </button>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm">
            <Link
              href="/plan"
              className="flex items-center gap-1 text-muted-foreground underline"
            >
              <MessageCircleQuestion className="size-4" aria-hidden="true" />
              See where you&rsquo;re up to
            </Link>
            <Link href="/" className="text-muted-foreground underline">
              Save and come back later
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
