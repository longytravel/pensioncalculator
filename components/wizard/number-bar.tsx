'use client'

/**
 * The number, fixed to the frame.
 *
 * Not sticky-on-scroll — part of the chrome, because the steps never scroll.
 * It is physically impossible for her to lose sight of it.
 *
 * Three states, and never a fake figure. Before we know enough it says so
 * rather than inventing something. During the flow it only ever counts up,
 * because chapters three and four only add income — the gap is deliberately
 * withheld until the results, where the levers to close it are on the same
 * screen.
 *
 * Anti-scoreboard rules, applied throughout: no red, no percentages, no score,
 * no "short" or "behind". A decrease uses the same muted treatment as an
 * increase with only the arrow to signal direction. She is anxious about money
 * and this element updates constantly; it must never feel like a verdict.
 */

import * as React from 'react'
import { ArrowUp, ArrowDown } from 'lucide-react'

export type NumberBarState =
  | { mode: 'quiet' }
  | { mode: 'goal'; goalMonthly: number }
  | { mode: 'building'; soFarMonthly: number; goalMonthly: number }

const gbp = (n: number) =>
  n.toLocaleString('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  })

export function NumberBar({ state }: { state: NumberBarState }) {
  const value = state.mode === 'building' ? state.soFarMonthly : 0

  // Count up to the new figure rather than snapping, so a change reads as
  // movement she caused rather than a number that blinked.
  const shown = useCountUp(value)
  const delta = useDelta(value)

  const [expanded, setExpanded] = React.useState(false)

  return (
    <div className="sticky top-0 z-50 border-b bg-background">
      <div className="mx-auto max-w-2xl px-4 py-3 sm:px-6 sm:py-4">
        {state.mode === 'quiet' && (
          <p className="text-sm text-muted-foreground sm:text-base">
            We&rsquo;ll build your number here as we go
            <span aria-hidden="true"> &rarr;</span>
          </p>
        )}

        {state.mode === 'goal' && (
          <div className="flex items-baseline gap-2">
            <span className="eyebrow text-[11px] text-muted-foreground">
              Your goal
            </span>
            <span className="figure text-2xl sm:text-3xl">
              {gbp(state.goalMonthly)}
            </span>
            <span className="text-sm text-muted-foreground">a month</span>
          </div>
        )}

        {state.mode === 'building' && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            aria-expanded={expanded}
            className="w-full text-left"
          >
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="figure text-2xl sm:text-3xl">
                {gbp(shown)}
              </span>
              <span className="text-sm text-muted-foreground">
                of your {gbp(state.goalMonthly)} so far
              </span>

              {delta !== 0 && (
                <span className="flex items-center gap-0.5 text-sm font-semibold">
                  {delta > 0 ? (
                    <ArrowUp className="size-3.5" aria-hidden="true" />
                  ) : (
                    <ArrowDown className="size-3.5" aria-hidden="true" />
                  )}
                  {gbp(Math.abs(delta))}
                </span>
              )}
            </div>

            {/* Additive framing only. Never "short", never a percentage. */}
            <p className="mt-1 text-xs text-muted-foreground">
              {expanded
                ? 'This is what your pensions, State Pension and savings add up to so far, after tax, in today’s money. Still counting.'
                : 'Still counting — tap for what this includes'}
            </p>
          </button>
        )}
      </div>

      {/* Announce the settled figure, not every intermediate frame. */}
      <span className="sr-only" role="status" aria-live="polite">
        {delta !== 0 && state.mode === 'building'
          ? `Now ${gbp(value)} a month`
          : ''}
      </span>
    </div>
  )
}

/** Animate toward a target so a change reads as movement, not a jump. */
function useCountUp(target: number, durationMs = 500): number {
  const [shown, setShown] = React.useState(target)
  const fromRef = React.useRef(target)
  const frameRef = React.useRef<number | undefined>(undefined)

  React.useEffect(() => {
    const from = fromRef.current
    if (from === target) return

    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      // Ease out, so it decelerates into the final value.
      const eased = 1 - Math.pow(1 - t, 3)
      setShown(from + (target - from) * eased)

      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = target
      }
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      fromRef.current = target
    }
  }, [target, durationMs])

  return shown
}

/** The last meaningful change, held briefly then cleared. */
function useDelta(value: number, holdMs = 2500): number {
  const previous = React.useRef(value)
  const [delta, setDelta] = React.useState(0)

  React.useEffect(() => {
    const diff = value - previous.current
    previous.current = value
    if (Math.abs(diff) < 1) return

    setDelta(diff)
    const timer = setTimeout(() => setDelta(0), holdMs)
    return () => clearTimeout(timer)
  }, [value, holdMs])

  return delta
}
