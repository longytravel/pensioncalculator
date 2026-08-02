'use client'

/**
 * The step-by-step review.
 *
 * Pages of related questions rather than one question at a time — fewer
 * clicks, and things that belong together are asked together. The number sits
 * in the frame above so it never leaves the screen.
 */

import * as React from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, MessageCircle, X } from 'lucide-react'
import { Assistant } from '@/components/assistant'

import {
  useCalculatorStore,
  useStoreHydrated,
  toEngineInputs,
} from '@/lib/store'
import { project } from '@/lib/engine/project'
import { visiblePages, CHAPTERS, type WizardVisibleState } from '@/lib/wizard/steps'
import { NumberBar, type NumberBarState } from '@/components/wizard/number-bar'
import { StepInput } from '@/components/wizard/step-input'
import { InsightCard } from '@/components/advice-cards'
import { advise } from '@/lib/advice'
import { StartAgain } from '@/components/start-again'
import { DEFAULT_VALUES } from '@/lib/fields'

/**
 * Which insight belongs to which page.
 *
 * The learning has to land where it was earned. Telling her about IR35 six
 * pages after she answered is worth almost nothing.
 */
/**
 * A question worth asking on each page.
 *
 * Prompting her beats an empty "ask me anything" box — she has said she does
 * not know what she does not know, so the app should suggest it.
 */
const PAGE_QUESTIONS: Record<string, string> = {
  about: 'Why can’t I get at my pension until 57?',
  target: 'How do I work out what I actually need to live on?',
  plans: 'What does taking a lump sum actually cost me?',
  'state-pension': 'How do I check my National Insurance record?',
  pensions: 'What if I have lost track of an old pension?',
  'pension-detail': 'What does the risk setting on my Aviva pension mean?',
  home: 'Is my house really my pension?',
  'mortgage-detail': 'Should I overpay the mortgage or pay into my pension?',
  downsize: 'How much would moving somewhere smaller really free up?',
  savings: 'Is my money better in a pension or an ISA?',
  business: 'Can I pay money from my business into my pension?',
  'paying-in': 'How does tax relief on my contributions work?',
  arrangement: 'What actually is IR35, in plain English?',
  'company-pays': 'How much can my company put in?',
}

const PAGE_INSIGHTS: Record<string, string[]> = {
  about: ['bridge-gap', 'mortgage-clears-first'],
  'state-pension': ['state-pension-full', 'ni-gaps'],
  pensions: ['unknown-balance'],
  'pension-detail': ['cautious-too-early', 'charges-high'],
  home: ['equity-real'],
  'mortgage-detail': ['mortgage-clears-first', 'mortgage-outlasts'],
  savings: ['no-isa'],
  business: ['company-route-open'],
  'paying-in': [],
  arrangement: ['ir35-unknown', 'company-route-open'],
  'company-pays': ['company-route-open'],
}

export default function Review() {
  const store = useCalculatorStore()
  // The question she tapped, sent for her the moment the panel opens.
  const [askQuestion, setAskQuestion] = React.useState<string | null>(null)
  const [askOpen, setAskOpen] = React.useState(false)
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

  const pages = React.useMemo(
    () => visiblePages(branchState),
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
    pages.findIndex((p) => p.id === store.currentStepId),
  )
  const page = pages[index] ?? pages[0]
  const isLast = index >= pages.length - 1

  const projection = React.useMemo(() => {
    try {
      return project(toEngineInputs({ ...store, values }), { inRealTerms: true })
    } catch {
      return null
    }
  }, [store, values])

  const advice = React.useMemo(() => {
    try {
      return advise({ ...store, values })
    } catch {
      return null
    }
  }, [store, values])

  // Quiet until a number would mean something, then her goal, then counting up.
  const chapter = page?.chapter ?? 'about'
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

  const insights = (PAGE_INSIGHTS[page?.id ?? ''] ?? [])
    .map((id) => advice?.insights.find((i) => i.id === id))
    .filter((i) => i !== undefined)
    .slice(0, 2)

  const go = (delta: number) => {
    const next = pages[index + delta]
    if (next) {
      store.goToStep(next.id)
      window.scrollTo({ top: 0 })
    }
  }

  const advance = (outcome: 'answered' | 'skipped') => {
    if (page) store.markStep(page.id, outcome)
    if (isLast) {
      window.location.href = '/done'
      return
    }
    go(1)
  }

  if (!page) return null

  return (
    <div className="flex min-h-dvh flex-col">
      <NumberBar state={barState} />

      <div className="h-1 w-full bg-muted">
        <div
          className="h-full bg-foreground transition-all duration-300"
          style={{ width: `${((index + 1) / pages.length) * 100}%` }}
        />
      </div>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 py-4 sm:px-6 lg:max-w-5xl lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-12">
        <div className="flex min-h-full flex-col lg:min-h-0">
        <p className="eyebrow text-[11px] text-muted-foreground">
          {CHAPTERS[page.chapter]} &middot; {index + 1} of {pages.length}
        </p>

        <h1
          className="mt-1.5 text-xl font-bold leading-tight sm:text-2xl"
          dangerouslySetInnerHTML={{ __html: page.title }}
        />
        {page.why && (
          <p
            className="mt-1 text-sm text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: page.why }}
          />
        )}

        <div className="flex-1 space-y-5 py-4">
          {page.inputs.map((input, i) => (
            <StepInput
              key={i}
              input={input}
              solo={page.inputs.length === 1}
            />
          ))}

          {/* On a phone the learning sits under the question; on a big
              screen it moves to the rail alongside. */}
          {insights.length > 0 && (
            <div className="space-y-3 lg:hidden">
              {insights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          )}
        </div>

        <div className="mt-auto pt-4">
          <button
            type="button"
            onClick={() => advance('answered')}
            className="btn-square flex h-14 w-full items-center justify-center gap-2 bg-primary text-lg font-bold uppercase tracking-wide text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {isLast ? 'Show me my plan' : 'Next'}
            <ArrowRight className="size-5" aria-hidden="true" />
          </button>

          <div className="mt-3 flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={index === 0}
              className="flex min-h-11 items-center gap-1 px-2 text-muted-foreground underline disabled:opacity-40"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back
            </button>

            {page.skippable !== false && (
              <button
                type="button"
                onClick={() => advance('skipped')}
                className="flex min-h-11 items-center px-2 text-muted-foreground underline"
              >
                Skip for now
              </button>
            )}
          </div>

          {/* Prompting a question beats an empty box she has to fill. */}
          {PAGE_QUESTIONS[page.id] && !askOpen && (
            <button
              type="button"
              onClick={() => {
                setAskQuestion(PAGE_QUESTIONS[page.id])
                setAskOpen(true)
              }}
              className="mt-4 flex w-full items-center gap-2 border border-dashed px-4 py-3 text-left text-sm transition-colors hover:bg-muted"
            >
              <MessageCircle className="size-4 shrink-0" aria-hidden="true" />
              <span>
                Not sure? Ask:{' '}
                <span className="font-semibold">{PAGE_QUESTIONS[page.id]}</span>
              </span>
            </button>
          )}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-2 text-xs text-muted-foreground">
            <Link href="/" className="inline-flex min-h-11 items-center underline">
              Saved &mdash; stop any time
            </Link>
            <StartAgain />
          </div>
        </div>
        </div>

        {/* The desktop rail: same insights, beside the question instead of
            buried under it. */}
        <aside className="hidden lg:block lg:sticky lg:top-24 lg:pt-8">
          {insights.length > 0 ? (
            <div className="space-y-3">
              <p className="eyebrow text-xs text-muted-foreground">
                What this means for you
              </p>
              {insights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          ) : (
            <div className="border bg-muted p-4 text-sm leading-relaxed text-muted-foreground">
              <p className="eyebrow mb-2 text-xs">Worth knowing</p>
              <p>
                Rough answers are fine everywhere here. The plan updates the
                moment you improve one later &mdash; nothing is locked in.
              </p>
            </div>
          )}
        </aside>
      </main>

      {/* Slides over rather than navigating away, so she keeps her place. */}
      {askOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <p className="eyebrow text-xs text-muted-foreground">
              Ask anything &mdash; it can see your figures
            </p>
            <button
              type="button"
              onClick={() => setAskOpen(false)}
              className="flex size-11 items-center justify-center"
              aria-label="Close and go back to your review"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <Assistant initialQuestion={askQuestion ?? undefined} />
          </div>
        </div>
      )}
    </div>
  )
}
