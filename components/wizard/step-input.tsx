'use client'

/**
 * The inputs on a wizard page.
 *
 * Pages hold several related questions, so each control carries its own label.
 * The hero treatment (huge figure, no label) is reserved for pages with a
 * single question, where the heading already says what the number is.
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
import type { Input } from '@/lib/wizard/steps'

const gbp = (n: number) =>
  n.toLocaleString('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  })

export function StepInput({ input, solo }: { input: Input; solo: boolean }) {
  switch (input.type) {
    case 'field':
    case 'money':
      return (
        <NumberField
          field={input.field}
          solo={solo}
          unknownable={input.type === 'money' && input.unknownable}
        />
      )
    case 'target':
      return <TargetDial />
    case 'choice':
      return <ChoiceGroup input={input} />
    case 'statePension':
      return <StatePension />
    case 'risk':
      return <RiskChoice />
  }
}

function NumberField({
  field,
  solo,
  unknownable,
}: {
  field: FieldName
  solo: boolean
  unknownable?: boolean
}) {
  const store = useCalculatorStore()
  const def: FieldDef = FIELDS[field]
  const value = store.values[field]
  const isUnknown = store.unknown[field] === true

  const [draft, setDraft] = React.useState<string | null>(null)
  const isMoney = def.format === 'gbp' || def.format === 'gbp-monthly'
  const id = `f-${field}`

  const commit = (next: number) =>
    store.setValue(field, clampToField(field, next))

  return (
    <div>
      <label htmlFor={id} className="block text-base font-semibold">
        {def.label}
      </label>

      <div className="mt-1.5 flex items-center gap-3">
        <div className="relative">
          {isMoney && (
            <span
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-muted-foreground"
              aria-hidden="true"
            >
              £
            </span>
          )}
          <input
            id={id}
            inputMode="decimal"
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
            className={`figure h-12 border bg-card text-center outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              solo ? 'w-40 text-2xl' : 'w-32 text-xl'
            } ${isMoney ? 'pl-6' : ''} ${isUnknown ? 'opacity-60' : ''}`}
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {suffixFor(def.format)}
        </span>
      </div>

      <input
        type="range"
        aria-label={`${def.label} slider`}
        min={def.min}
        max={def.max}
        step={def.step}
        value={value}
        onChange={(e) => commit(Number(e.target.value))}
        className="mt-4 w-full cursor-pointer appearance-none bg-transparent accent-primary"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatFieldValue(def.format, def.min)}</span>
        <span>{formatFieldValue(def.format, def.max)}</span>
      </div>

      {unknownable && (
        <div className="mt-2">
          {isUnknown ? (
            <p className="text-sm text-muted-foreground">
              On your list to check. We&rsquo;ve used an estimate meanwhile
              &mdash; not zero.{' '}
              <button
                type="button"
                onClick={() => store.setUnknown(field, false)}
                className="underline"
              >
                Actually, I know it
              </button>
            </p>
          ) : (
            <button
              type="button"
              onClick={() => store.setUnknown(field, true)}
              className="inline-flex min-h-11 items-center text-sm text-muted-foreground underline"
            >
              I don&rsquo;t know this &mdash; add it to my list
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * The target income control.
 *
 * The presets are anchors, not the whole menu. She can type any figure,
 * including more than the top one — the previous three-card version quietly
 * capped her ambition, which was wrong.
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
          ? 'Comfortable'
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
        {'a month, after tax — '}
        {gbp(annual)}
        {' a year'}
      </p>

      <input
        type="range"
        aria-label="Monthly income slider"
        min={Math.round(def.min / 12)}
        max={Math.round(def.max / 12)}
        step={25}
        value={monthly}
        onChange={(e) => setMonthly(Number(e.target.value))}
        className="mt-5 w-full cursor-pointer appearance-none bg-transparent accent-primary"
      />

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Not sure? This is what real retired households actually spend.
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
        Want more than that? Type any figure you like.
      </p>
    </div>
  )
}

function ChoiceGroup({
  input,
}: {
  input: Extract<Input, { type: 'choice' }>
}) {
  const store = useCalculatorStore()
  const current = store[input.option] as string

  return (
    <fieldset>
      <legend className="text-base font-semibold">{input.label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {input.choices.map((choice) => {
          const selected = current === choice.value
          return (
            <button
              key={choice.value}
              type="button"
              onClick={() =>
                store.setOption(input.option as never, choice.value as never)
              }
              aria-pressed={selected}
              className={`min-h-12 border px-3 py-2 text-left text-sm transition-colors ${
                selected
                  ? 'border-foreground bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              <span className="block font-medium">{choice.label}</span>
              {choice.note && (
                <span className="mt-0.5 block text-xs opacity-80">
                  {choice.note}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function StatePension() {
  const store = useCalculatorStore()
  const [adjusting, setAdjusting] = React.useState(false)

  const years = store.values.qualifyingYears
  const estimate = (12547.6 * Math.min(years, 35)) / 35

  return (
    <div className="text-center">
      <p className="figure text-4xl sm:text-5xl">
        {gbp(Math.round(estimate / 12))}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        a month, from age {store.values.statePensionAge}
      </p>
      <p className="mt-3 text-base">
        {'That assumes '}
        {years}
        {' years of National Insurance. Most people who have worked steadily have the full 35.'}
      </p>

      {!adjusting ? (
        <button
          type="button"
          onClick={() => setAdjusting(true)}
          className="mt-2 inline-flex min-h-11 items-center text-sm text-muted-foreground underline"
        >
          Let me change that
        </button>
      ) : (
        <div className="mt-4 text-left">
          <label htmlFor="ni-years" className="text-sm font-medium">
            Years of National Insurance: {years}
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
            className="mt-2 w-full cursor-pointer appearance-none bg-transparent accent-primary"
          />
          <button
            type="button"
            onClick={() => store.setUnknown('qualifyingYears', true)}
            className="mt-1 inline-flex min-h-11 items-center text-sm text-muted-foreground underline"
          >
            I don&rsquo;t know &mdash; add it to my list
          </button>
        </div>
      )}
    </div>
  )
}

function RiskChoice() {
  const store = useCalculatorStore()

  const options = [
    { value: 'cautious' as const, label: 'Cautious', note: 'Steadier, grows less' },
    { value: 'balanced' as const, label: 'Balanced', note: 'The usual default' },
    { value: 'growth' as const, label: 'Adventurous', note: 'Bumpier, grows more' },
  ]

  return (
    <fieldset>
      <legend className="text-base font-semibold">
        How are they invested?
      </legend>
      <p className="mt-1 text-sm text-muted-foreground">
        Never chosen? You&rsquo;re almost certainly in the default, which is
        usually Balanced.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => {
          const selected = store.fundRiskLevel === o.value
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => store.setOption('fundRiskLevel', o.value)}
              aria-pressed={selected}
              className={`min-h-12 border px-3 py-2 text-left text-sm transition-colors ${
                selected
                  ? 'border-foreground bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              <span className="block font-medium">{o.label}</span>
              <span className="mt-0.5 block text-xs opacity-80">{o.note}</span>
            </button>
          )
        })}
      </div>
    </fieldset>
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
