'use client'

/**
 * The comparison table.
 *
 * Ordered by a stated metric, with no badges, stars or "best buy" flags. The
 * framing line at the top matters as much as the numbers: this compares what
 * the options produce, it does not tell her which to pick.
 */

import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import type { Destination } from '@/lib/advice/comparison'

const gbp = (n: number) =>
  n.toLocaleString('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  })

export function Comparison({
  destinations,
  feeDrag,
  years,
}: {
  destinations: Destination[]
  feeDrag: { expensive: number; cheap: number; difference: number }
  years: number
}) {
  const [openId, setOpenId] = React.useState<string | null>(null)

  return (
    <section className="border bg-card">
      <header className="border-b px-5 py-4">
        <p className="eyebrow text-xs text-muted-foreground">
          Your figures, not a league table
        </p>
        <h2 className="mt-1 text-xl font-bold uppercase">
          Where would your next £100 do most?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          This compares what each option costs and what the maths says it would
          produce, using the numbers you have given. It does not recommend any
          of them &mdash; the right answer depends on things a calculator
          cannot see.
        </p>
      </header>

      <ul className="divide-y">
        {destinations.map((dest) => {
          const open = openId === dest.id
          return (
            <li key={dest.id} className={dest.available ? '' : 'opacity-60'}>
              <button
                type="button"
                onClick={() => setOpenId(open ? null : dest.id)}
                aria-expanded={open}
                className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted"
              >
                <span className="min-w-0">
                  <span className="block text-base font-semibold">
                    {dest.name}
                  </span>
                  {dest.pinned && (
                    <span className="mt-1 block text-sm font-medium">
                      {dest.pinned}
                    </span>
                  )}
                  {!dest.available && dest.unavailableBecause && (
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {dest.unavailableBecause}
                    </span>
                  )}
                </span>

                <span className="shrink-0 text-right">
                  <span className="figure block text-lg">
                    {gbp(dest.atRetirement)}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">
                    by then
                  </span>
                </span>

                <ChevronDown
                  className={`mt-1 size-4 shrink-0 transition-transform ${
                    open ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              {open && (
                <div className="space-y-2 px-5 pb-4 text-sm leading-relaxed">
                  <p>{dest.reason}</p>
                  <p className="text-muted-foreground">
                    <span className="font-semibold">The trade-off:</span>{' '}
                    {dest.tradeOff}
                  </p>
                  <p className="text-muted-foreground">
                    {'Of £100 of company profit, '}
                    {gbp(dest.dayOne)}
                    {' is working for you on day one.'}
                  </p>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {/* The single most persuasive figure here, on her real pot. */}
      <div className="border-t bg-muted px-5 py-4">
        <p className="eyebrow text-xs text-muted-foreground">
          And the quiet one
        </p>
        <p className="mt-1 text-base leading-relaxed">
          On what you have now, moving from your current charges to around 0.3%
          would be worth about{' '}
          <strong className="figure">{gbp(feeDrag.difference)}</strong>
          {' more by the time you stop — '}
          {years}
          {' years of charges either working for you or against you.'}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Charges come out every year whether the fund does well or not. Finding
          out what you actually pay is a ten-minute job.
        </p>
      </div>
    </section>
  )
}
