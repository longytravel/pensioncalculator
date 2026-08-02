'use client'

/**
 * The input for a single step.
 *
 * One question, one control, sized to sit comfortably in a phone viewport
 * without scrolling. Each kind of step renders its own control here so the
 * wizard shell stays about sequencing rather than form widgets.
 */

import * as React from 'react'
import { useCalculatorStore } from '@/lib/store'
import { RETIREMENT_LIVING_STANDARDS } from '@/lib/engine/assumptions'
import {
  FIELDS,
  clampToField,
  formatFieldValue,
  type FieldDef,
  type FieldName,
} from '@/lib/fields'
import type { StepKind } from '@/lib/wizard/steps'

const gbp = (n: number) =>
  n.toLocaleString('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  })

export function StepInput({ kind }: { kind: StepKind }) {
  switch (kind.type) {
    case 'field':
    case 'money':
      return (
        <BigNumber
          field={kind.field}
          unknownable={kind.type === 'money' && kind.unknownable}
        />
      )
    case 'target':
      return <TargetDial />
    case 'choice':
      return <Cards kind={kind} />
    case 'confirm':
      return <StatePensionConfirm />
    case 'risk':
      return <RiskChoice />
  }
}

/**
 * A large figure with a slider under it.
 *
 * The number is the hero and is directly editable — sliders are good for "what
 * if" and useless for "it's exactly £312".
 */
function BigNumber({
  field,
  unknownable,
}: {
  field: FieldName
  unknownable?: boolean
}) {
  const store = useCalculatorStore()
  const def: FieldDef = FIELDS[field]
  const value = store.values[field]

  const [draft, setDraft] = React.useState<string | null>(null)
  const isMoney = def.format === 'gbp' || def.format === 'gbp-monthly'

  const commit = (next: number) => store.setValue(field, clampToField(field, next))

  return (
    <div>
      <div className="flex items-baseline justify-center gap-1">
        {isMoney && <span className="text-3xl text-muted-foreground">£</span>}
        <input
          inputMode="decimal"
          aria-label={def.label}
          value={draft ?? displayFor(def, value)}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            if (draft !== null) {
              const parsed = parseFor(def, draft)
              if (parsed !== null) commit(parsed)
              setDraft(null)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
            if (e.key === 'Escape') setDraft(null)
          }}
          className="figure w-full max-w-[7ch] bg-transparent text-center text-5xl outline-none focus-visible:underline sm:text-6xl"
        />
        {def.format === 'percent' && (
          <span className="text-3xl text-muted-foreground">%</span>
        )}
      </div>

      <p className="mt-1 text-center text-sm text-muted-foreground">
        {suffixFor(def.format)}
      </p>

      <input
        type="range"
        aria-label={`${def.label} slider`}
        min={def.min}
        max={def.max}
        step={def.step}
        value={value}
        onChange={(e) => commit(Number(e.target.value))}
        className="mt-6 h-2 w-full cursor-pointer appearance-none bg-muted accent-primary"
      />

      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>{formatFieldValue(def.format, def.min)}</span>
        <span>{formatFieldValue(def.format, def.max)}</span>
      </div>

      {unknownable && (
        <button
          type="button"
          onClick={() => store.setUnknown(field, true)}
          className="mx-auto mt-5 block text-sm text-muted-foreground underline"
        >
          I don&rsquo;t know this off the top of my head
        </button>
      )}
    </div>
  )
}

/**
 * The target income step.
 *
 * Presets sit on the track as anchors rather than as the only choices — she can
 * drag or type past the top one. Someone who wants more than "comfortable"
 * must be able to say so.
 */
function TargetDial() {
  const store = useCalculatorStore()
  const def: FieldDef = FIELDS.targetIncome
  const annual = store.values.targetIncome
  const monthly = Math.round(annual / 12)

  const [draft, setDraft] = React.useState<string | null>(null)

  const standards = RETIREMENT_LIVING_STANDARDS[store.region]
  const anchors = (['minimum', 'moderate', 'comfortable'] as const).map((k) => ({
    key: k,
    label:
      k === 'minimum'
        ? 'Covered'
        : k === 'moderate'
          ? 'Comfortable enough'
          : 'Really enjoying it',
    annual: standards[k][store.household],
  }))

  const setMonthly = (m: number) =>
    store.setValue('targetIncome', clampToField('targetIncome', m * 12))

  return (
    <div>
      <div className="flex items-baseline justify-center gap-1">
        <span className="text-3xl text-muted-foreground">£</span>
        <input
          inputMode="numeric"
          aria-label="Monthly income you would like"
          value={draft ?? String(monthly)}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            if (draft !== null) {
              const n = Number(draft.replace(/[^\d.]/g, ''))
              if (Number.isFinite(n) && n > 0) setMonthly(n)
              setDraft(null)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
            if (e.key === 'Escape') setDraft(null)
          }}
          className="figure w-full max-w-[6ch] bg-transparent text-center text-5xl outline-none focus-visible:underline sm:text-6xl"
        />
      </div>
      <p className="mt-1 text-center text-sm text-muted-foreground">
        a month, after tax &mdash; that&rsquo;s {gbp(annual)} a year
      </p>

      <input
        type="range"
        aria-label="Monthly income slider"
        min={Math.round(def.min / 12)}
        max={Math.round(def.max / 12)}
        step={25}
        value={monthly}
        onChange={(e) => setMonthly(Number(e.target.value))}
        className="mt-6 h-2 w-full cursor-pointer appearance-none bg-muted accent-primary"
      />

      <p className="mt-5 text-center text-xs text-muted-foreground">
        Not sure? These are what real retired households actually spend.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {anchors.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={() => store.setValue('targetIncome', a.annual)}
            aria-pressed={Math.abs(annual - a.annual) < 250}
            className={`min-h-11 border px-3 py-2 text-sm transition-colors ${
              Math.abs(annual - a.annual) < 250
                ? 'border-foreground bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            {a.label}
            <span className="ml-1 opacity-70">
              {gbp(Math.round(a.annual / 12))}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Want more than that? Type any number you like above.
      </p>
    </div>
  )
}

function Cards({ kind }: { kind: Extract<StepKind, { type: 'choice' }> }) {
  const store = useCalculatorStore()
  const current = store[kind.option] as string

  return (
    <div className="flex flex-col gap-2">
      {kind.choices.map((choice) => {
        const selected = current === choice.value
        return (
          <button
            key={choice.value}
            type="button"
            onClick={() =>
              store.setOption(
                kind.option as never,
                choice.value as never,
              )
            }
            aria-pressed={selected}
            className={`min-h-14 border px-4 py-3 text-left text-base transition-colors ${
              selected
                ? 'border-foreground bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            <span className="block font-semibold">{choice.label}</span>
            {choice.note && (
              <span className="mt-0.5 block text-sm opacity-80">
                {choice.note}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function StatePensionConfirm() {
  const store = useCalculatorStore()
  const [adjusting, setAdjusting] = React.useState(false)

  const full = 12547.6
  const years = store.values.qualifyingYears
  const estimate = (full * Math.min(years, 35)) / 35

  return (
    <div className="text-center">
      <p className="figure text-5xl sm:text-6xl">
        {gbp(Math.round(estimate / 12))}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        a month, from age {store.values.statePensionAge}
      </p>
      <p className="mt-4 text-base">
        That assumes {years} years of National Insurance. Most people who have
        worked steadily have the full 35.
      </p>

      {!adjusting ? (
        <button
          type="button"
          onClick={() => setAdjusting(true)}
          className="mt-4 text-sm text-muted-foreground underline"
        >
          That&rsquo;s not right, let me change it
        </button>
      ) : (
        <div className="mt-5 text-left">
          <label htmlFor="ni-years" className="text-sm font-medium">
            Years of National Insurance
          </label>
          <input
            id="ni-years"
            type="range"
            min={0}
            max={35}
            step={1}
            value={years}
            onChange={(e) =>
              store.setValue('qualifyingYears', Number(e.target.value))
            }
            className="mt-2 h-2 w-full cursor-pointer appearance-none bg-muted accent-primary"
          />
          <p className="mt-1 text-center text-sm">{years} years</p>
        </div>
      )}

      <p className="mt-5 text-xs text-muted-foreground">
        You can check yours free at gov.uk &mdash; it takes two minutes and it
        is worth doing.
      </p>
    </div>
  )
}

function RiskChoice() {
  const store = useCalculatorStore()

  const options = [
    {
      value: 'cautious' as const,
      label: 'Cautious',
      note: 'Steadier, but grows less',
    },
    {
      value: 'balanced' as const,
      label: 'Balanced',
      note: 'The usual default',
    },
    {
      value: 'growth' as const,
      label: 'Adventurous',
      note: 'Bumpier, tends to grow more',
    },
  ]

  return (
    <div className="flex flex-col gap-2">
      {options.map((o) => {
        const selected = store.fundRiskLevel === o.value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => store.setOption('fundRiskLevel', o.value)}
            aria-pressed={selected}
            className={`min-h-14 border px-4 py-3 text-left transition-colors ${
              selected
                ? 'border-foreground bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            <span className="block font-semibold">{o.label}</span>
            <span className="mt-0.5 block text-sm opacity-80">{o.note}</span>
          </button>
        )
      })}
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Genuinely no idea? Pick Balanced &mdash; it is where most people are put
        by default, and we will help you check later.
      </p>
    </div>
  )
}

function displayFor(def: FieldDef, value: number): string {
  if (def.format === 'percent') return String(Number((value * 100).toFixed(3)))
  return String(value)
}

function parseFor(def: FieldDef, raw: string): number | null {
  const cleaned = raw.replace(/[£,\s%]/g, '')
  if (cleaned === '') return null
  const n = Number(cleaned)
  if (!Number.isFinite(n)) return null
  return def.format === 'percent' ? n / 100 : n
}

function suffixFor(format: FieldDef['format']): string {
  switch (format) {
    case 'gbp-monthly':
      return 'a month'
    case 'gbp':
      return 'in total'
    case 'percent':
      return 'a year in charges'
    case 'age':
      return 'years old'
    case 'years':
      return 'years'
  }
}
