'use client'

/**
 * The number, pinned to the top of the screen.
 *
 * The whole point of a slider-driven tool is watching the figure move as you
 * change something. If the headline scrolls out of sight while she is dragging,
 * the tool stops being a tool. So this sticks, and it flashes the change.
 */

import * as React from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import type { ProjectionOutput } from '@/lib/engine/types'

const gbp = (n: number) =>
  n.toLocaleString('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  })

export function LiveHeader({ output }: { output: ProjectionOutput | null }) {
  const monthly = output ? output.gap.projectedNetIncome / 12 : 0
  const targetMonthly = output ? output.gap.targetNetIncome / 12 : 0
  const onTrack = output?.gap.onTrack ?? false

  // Remember the last figure so we can show what a change just did.
  const previous = React.useRef(monthly)
  const [delta, setDelta] = React.useState(0)

  React.useEffect(() => {
    const diff = monthly - previous.current
    previous.current = monthly
    if (Math.abs(diff) < 1) return

    setDelta(diff)
    const timer = setTimeout(() => setDelta(0), 2600)
    return () => clearTimeout(timer)
  }, [monthly])

  // How close she is, for the bar. Capped so a big surplus doesn't overflow.
  const progress =
    targetMonthly > 0 ? Math.min(100, (monthly / targetMonthly) * 100) : 0

  return (
    <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto max-w-3xl px-4 py-3 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="eyebrow text-[11px] text-muted-foreground">
              You&rsquo;re on track for
            </p>
            <p className="flex items-baseline gap-2 leading-none">
              <span className="figure text-3xl sm:text-4xl">
                {gbp(monthly)}
              </span>
              <span className="text-sm text-muted-foreground">a month</span>

              {delta !== 0 && (
                <span
                  className={`flex items-center gap-0.5 text-sm font-semibold ${
                    delta > 0 ? 'text-foreground' : 'text-destructive'
                  }`}
                >
                  {delta > 0 ? (
                    <ArrowUp className="size-3.5" aria-hidden="true" />
                  ) : (
                    <ArrowDown className="size-3.5" aria-hidden="true" />
                  )}
                  {gbp(Math.abs(delta))}
                </span>
              )}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="eyebrow text-[11px] text-muted-foreground">You want</p>
            <p className="figure text-lg sm:text-xl">{gbp(targetMonthly)}</p>
          </div>
        </div>

        {/* Have versus need, at a glance. No interpretation required. */}
        <div className="mt-2 h-2 w-full overflow-hidden bg-muted">
          <div
            className={`h-full transition-all duration-500 ${
              onTrack ? 'bg-foreground' : 'bg-destructive'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="mt-1.5 text-xs text-muted-foreground">
          {onTrack ? (
            <>You&rsquo;ve got enough for what you asked for.</>
          ) : output ? (
            <>
              {gbp(Math.abs(output.gap.gap) / 12)} a month short &mdash; an
              extra{' '}
              <strong className="text-foreground">
                {gbp(output.gap.requiredExtraMonthlyContribution)} a month
              </strong>{' '}
              in would close it
            </>
          ) : (
            <>Checking your figures&hellip;</>
          )}
        </p>
      </div>

      {/* Announce the settled figure, not every drag tick. */}
      <span className="sr-only" role="status" aria-live="polite">
        {delta !== 0 ? `Now ${gbp(monthly)} a month` : ''}
      </span>
    </div>
  )
}
