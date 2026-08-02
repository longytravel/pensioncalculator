'use client'

/**
 * How the advice is shown.
 *
 * Insight cards land where the input was, so the learning arrives at the step
 * that earned it. The action plan is the payoff screen: every lever she has,
 * ordered by what moves her number most for the least effort.
 */

import * as React from 'react'
import Link from 'next/link'
import { ArrowUpRight, Check, Copy, Sparkles } from 'lucide-react'
import {
  HORIZONS,
  type Insight,
  type RankedAction,
  type AccountantQuestion,
} from '@/lib/advice/types'
import { byHorizon } from '@/lib/advice'

const gbp = (n: number) =>
  Math.round(n).toLocaleString('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  })

/** A single "what this means for you" card. */
export function InsightCard({ insight }: { insight: Insight }) {
  // Severity changes the accent only. No red, no icons that shout.
  const accent =
    insight.severity === 'act'
      ? 'border-l-foreground'
      : insight.severity === 'watch'
        ? 'border-l-muted-foreground'
        : 'border-l-muted-foreground/40'

  return (
    <div className={`border-l-4 bg-muted p-4 ${accent}`}>
      <p className="text-base font-semibold leading-snug">{insight.headline}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        {insight.detail}
      </p>

      {insight.action && (
        <InsightActionLink action={insight.action} />
      )}
    </div>
  )
}

function InsightActionLink({
  action,
}: {
  action: NonNullable<Insight['action']>
}) {
  const className =
    'mt-3 inline-flex items-center gap-1 text-sm font-semibold underline'

  if (action.kind === 'link') {
    return (
      <a
        href={action.target}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {action.label}
        <ArrowUpRight className="size-3.5" aria-hidden="true" />
      </a>
    )
  }

  return (
    <Link href="/plan" className={className}>
      {action.label}
      <ArrowUpRight className="size-3.5" aria-hidden="true" />
    </Link>
  )
}

/**
 * The ranked plan.
 *
 * The ordering rule is stated on screen, because a list that claims to be
 * "best for you" without saying how it decided is just an opinion with
 * confidence.
 */
export function ActionPlan({ actions }: { actions: RankedAction[] }) {
  if (actions.length === 0) return null

  return (
    <section className="border bg-card">
      <header className="border-b px-5 py-4">
        <p className="eyebrow text-xs text-muted-foreground">
          Ordered by what moves your number most, for the least effort
        </p>
        <h2 className="mt-1 text-xl font-bold uppercase">What to do next</h2>
      </header>

      {byHorizon(actions).map((group) => (
        <div key={group.horizon}>
          <div className="border-b bg-muted px-5 py-3">
            <p className="text-base font-bold uppercase">
              {HORIZONS[group.horizon].title}
            </p>
            <p className="text-sm text-muted-foreground">
              {HORIZONS[group.horizon].blurb}
            </p>
          </div>

          <ol className="divide-y">
            {group.actions.map((action, i) => (
              <li key={action.id} className="px-5 py-4">
                <div className="flex items-start gap-4">
                  <span className="figure mt-0.5 text-lg text-muted-foreground">
                    {i + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold leading-snug">
                      {action.headline}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {action.detail}
                    </p>

                    <p className="mt-2 text-sm">
                      <span className="font-semibold">First step:</span>{' '}
                      {action.firstStep}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="eyebrow">{action.effortLabel}</span>
                      {action.unlocks && <span>Unlocks {action.unlocks}</span>}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="figure block text-lg">
                      {action.impactMonthly > 0
                        ? `+${gbp(action.impactMonthly)}`
                        : '—'}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      a month
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </section>
  )
}

/** The list she takes to her accountant, with the email written for her. */
export function AccountantPanel({
  questions,
  emailBody,
}: {
  questions: AccountantQuestion[]
  emailBody: string
}) {
  const [copied, setCopied] = React.useState(false)

  return (
    <section className="border bg-card">
      <header className="border-b px-5 py-4">
        <p className="eyebrow text-xs text-muted-foreground">
          Changes as your answers do
        </p>
        <h2 className="mt-1 text-xl font-bold uppercase">
          Ask your accountant
        </h2>
      </header>

      <ol className="divide-y">
        {questions.slice(0, 6).map((q) => (
          <li key={q.id} className="px-5 py-4">
            <p className="text-base font-semibold leading-snug">
              &ldquo;{q.question}&rdquo;
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{q.why}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-semibold">A good answer sounds like:</span>{' '}
              {q.goodAnswer}
            </p>
          </li>
        ))}
      </ol>

      <div className="border-t p-5">
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(emailBody)
              setCopied(true)
              setTimeout(() => setCopied(false), 2500)
            } catch {
              setCopied(false)
            }
          }}
          className="btn-square flex h-12 w-full items-center justify-center gap-2 bg-primary text-sm font-bold uppercase tracking-wide text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {copied ? (
            <>
              <Check className="size-4" aria-hidden="true" />
              Copied — paste it into your email
            </>
          ) : (
            <>
              <Copy className="size-4" aria-hidden="true" />
              Copy the whole email
            </>
          )}
        </button>
        <pre className="mt-4 max-h-48 overflow-auto whitespace-pre-wrap border bg-muted p-3 text-xs leading-relaxed">
          {emailBody}
        </pre>
      </div>
    </section>
  )
}

/** Shown at the top of the results, so she starts on a win. */
export function InsightList({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null

  // Open on something good where there is one — the tone rule that matters most.
  const good = insights.filter((i) => i.severity === 'good')
  const rest = insights.filter((i) => i.severity !== 'good')
  const ordered = [...good.slice(0, 1), ...rest.slice(0, 4), ...good.slice(1, 3)]

  return (
    <section>
      <h2 className="eyebrow mb-3 text-xs text-muted-foreground">
        <Sparkles className="mr-1 inline size-3.5" aria-hidden="true" />
        What this means for you
      </h2>
      <div className="space-y-3">
        {ordered.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>
    </section>
  )
}
