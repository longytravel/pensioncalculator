'use client'

/**
 * What she actually wants.
 *
 * Nobody has ever asked her this. Every pension tool jumps straight to "what
 * income do you want", which is the one question she can't answer cold. These
 * come first, they're all one-tap, and the lifestyle cards do the heavy lifting
 * on the income question by showing what real retired households actually spend.
 */

import * as React from 'react'
import { useCalculatorStore } from '@/lib/store'
import { RETIREMENT_LIVING_STANDARDS } from '@/lib/engine/assumptions'
import { FIELDS } from '@/lib/fields'

const gbp = (n: number) =>
  n.toLocaleString('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  })

const LIFESTYLES = [
  {
    key: 'minimum' as const,
    name: 'Covered',
    line: 'Bills paid, food on the table, a week away in the UK. No car.',
  },
  {
    key: 'moderate' as const,
    name: 'Comfortable enough',
    line: 'A car, a fortnight abroad, meals out, a bit of slack in the month.',
  },
  {
    key: 'comfortable' as const,
    name: 'Properly enjoying it',
    line: 'Three weeks abroad, replacing the car, theatre, festivals, saying yes to things.',
  },
]

export function Objectives() {
  const store = useCalculatorStore()
  const standards = RETIREMENT_LIVING_STANDARDS[store.region][
    'moderate'
  ]
  void standards

  const target = store.values.targetIncome

  return (
    <section className="border bg-card p-5 sm:p-6">
      <p className="eyebrow text-xs text-muted-foreground">Start here</p>
      <h2 className="mt-1 text-2xl font-bold uppercase">
        What do you actually want?
      </h2>
      <p className="mt-2 text-base text-muted-foreground">
        Nobody can tell you what to pay in until we know what you&rsquo;re
        aiming at. Nothing here is a commitment.
      </p>

      {/* The question she couldn't answer, made answerable. */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold">
          What would a good retirement look like?
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          These are what real retired households actually spend, in
          today&rsquo;s money. Pick whichever feels closest &mdash; you can
          nudge it after.
        </p>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {LIFESTYLES.map((option) => {
            const amount =
              RETIREMENT_LIVING_STANDARDS[store.region][option.key][
                store.household
              ]
            const selected = Math.abs(target - amount) < 250

            return (
              <button
                key={option.key}
                type="button"
                onClick={() => store.setValue('targetIncome', amount)}
                aria-pressed={selected}
                className={`border p-4 text-left transition-colors ${
                  selected
                    ? 'border-foreground bg-muted ring-2 ring-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <span className="eyebrow block text-xs text-muted-foreground">
                  {option.name}
                </span>
                <span className="figure mt-1 block text-2xl">
                  {gbp(amount / 12)}
                </span>
                <span className="block text-xs text-muted-foreground">
                  a month, after tax
                </span>
                <span className="mt-2 block text-sm leading-snug">
                  {option.line}
                </span>
              </button>
            )
          })}
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          Worth knowing: these figures assume the mortgage is gone by then.
          Yours is, on your current plan.
        </p>
      </div>

      <Divider />

      <Choice
        label="Are you stopping all at once, or easing off first?"
        help="Going part-time for a few years costs less than you'd think, because you keep paying in."
        value={store.taperingStyle}
        onChange={(v) => store.setOption('taperingStyle', v)}
        options={[
          { value: 'cliff', label: 'Stop in one go' },
          { value: 'taper', label: 'Go part-time first' },
          { value: 'unsure', label: 'No idea yet' },
        ]}
      />

      <Divider />

      <Choice
        label="Do you want a lump sum when you stop?"
        help="A quarter of your pension can normally be taken tax-free."
        value={store.lumpSumIntent}
        onChange={(v) => store.setOption('lumpSumIntent', v)}
        options={[
          { value: 'yes', label: 'Yes, for something specific' },
          { value: 'maybe', label: 'Maybe, nothing planned' },
          { value: 'no', label: "No, I'd rather have the income" },
        ]}
      />

      <Divider />

      <Choice
        label="Would you move somewhere smaller?"
        help="You've got a lot tied up in the house. This decides whether we count it."
        value={store.downsizeIntent}
        onChange={(v) => store.setOption('downsizeIntent', v)}
        options={[
          { value: 'yes', label: 'Yes, that was the plan' },
          { value: 'maybe', label: 'Maybe, if I needed to' },
          { value: 'no', label: "No, I'm staying put" },
        ]}
      />

      <Divider />

      <Choice
        label="Do you want to leave something behind?"
        help="Pensions usually pass on free of inheritance tax, which surprises people."
        value={store.legacyIntent}
        onChange={(v) => store.setOption('legacyIntent', v)}
        options={[
          { value: 'yes', label: 'Yes, that matters to me' },
          { value: 'maybe', label: 'Whatever is left is fine' },
          { value: 'no', label: 'Spend it all, enjoy it' },
        ]}
      />

      <p className="mt-6 border-t pt-4 text-sm text-muted-foreground">
        You can change any of this later. Your target is currently{' '}
        <strong className="text-foreground">{gbp(target)} a year</strong>, and
        there&rsquo;s a slider for it below if none of the cards fit.{' '}
        {FIELDS.targetIncome.helper}
      </p>
    </section>
  )
}

function Divider() {
  return <div className="mt-6 border-t pt-6" />
}

function Choice<T extends string>({
  label,
  help,
  value,
  onChange,
  options,
}: {
  label: string
  help: string
  value: T
  onChange: (value: T) => void
  options: Array<{ value: T; label: string }>
}) {
  return (
    <fieldset>
      <legend className="text-lg font-semibold">{label}</legend>
      <p className="mt-1 text-sm text-muted-foreground">{help}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={selected}
              className={`min-h-12 border px-4 py-2 text-base transition-colors ${
                selected
                  ? 'border-foreground bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
