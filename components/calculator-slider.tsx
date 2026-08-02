'use client'

/**
 * The one input control used across the whole calculator.
 *
 * Deliberately large and unhurried: this is for someone who finds money
 * stressful and is reading on a phone. Every control pairs a slider with a
 * number box, because sliders are good for "what if" and terrible for "it's
 * exactly £312".
 */

import * as React from 'react'
import { Info, Minus, Plus, Sparkles } from 'lucide-react'

import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import {
  FIELDS,
  clampToField,
  formatFieldValue,
  intlOptionsFor,
  type FieldDef,
  type FieldName,
} from '@/lib/fields'

export interface CalculatorSliderProps {
  name: FieldName
  value: number
  onChange: (value: number) => void
  /** A value the assistant has proposed, awaiting her confirmation. */
  suggestion?: { value: number; rationale: string } | null
  onAcceptSuggestion?: () => void
  onDismissSuggestion?: () => void
  disabled?: boolean
  className?: string
}

export function CalculatorSlider({
  name,
  value,
  onChange,
  suggestion,
  onAcceptSuggestion,
  onDismissSuggestion,
  disabled,
  className,
}: CalculatorSliderProps) {
  // Widened to FieldDef: the `as const` on FIELDS narrows each entry to its own
  // literal type, which drops optional properties like largeStep.
  const field: FieldDef = FIELDS[name]
  const labelId = `${name}-label`
  const helperId = `${name}-helper`
  const suggestionId = `${name}-suggestion`
  const inputId = `${name}-number`

  // Let her type freely — including transient states like "" or "12." — and
  // only commit a clamped number when the text parses.
  const [draft, setDraft] = React.useState<string | null>(null)
  const displayValue = draft ?? formatForInput(field.format, value)

  const [announcement, setAnnouncement] = React.useState('')
  const announceTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  /**
   * Announce only the settled value. Firing on every drag tick would flood a
   * screen reader; `aria-valuetext` on the thumb already covers live feedback.
   */
  const announceSettled = React.useCallback(
    (next: number) => {
      if (announceTimer.current) clearTimeout(announceTimer.current)
      announceTimer.current = setTimeout(() => {
        setAnnouncement(
          `${field.label} set to ${formatFieldValue(field.format, next)}`,
        )
      }, 400)
    },
    [field.label, field.format],
  )

  React.useEffect(() => {
    return () => {
      if (announceTimer.current) clearTimeout(announceTimer.current)
    }
  }, [])

  const commit = (next: number) => {
    const clamped = clampToField(name, next)
    onChange(clamped)
    announceSettled(clamped)
  }

  const nudge = (direction: 1 | -1) => commit(value + direction * field.step)

  const describedBy = [helperId, suggestion ? suggestionId : null]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={cn(
        'rounded-2xl border bg-card p-5 sm:p-6',
        suggestion && 'ring-2 ring-amber-400/70 ring-offset-2 ring-offset-background',
        className,
      )}
      data-field={name}
    >
      <div className="flex items-start justify-between gap-3">
        <label
          id={labelId}
          htmlFor={inputId}
          className="text-lg font-semibold leading-snug sm:text-xl"
        >
          {field.label}
        </label>

        <Popover>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 shrink-0 rounded-full"
                aria-label={`Why this matters: ${field.label}`}
              >
                <Info className="size-5" aria-hidden="true" />
              </Button>
            }
          />
          <PopoverContent className="max-w-sm text-base leading-relaxed">
            <p className="mb-2 font-semibold">Why this matters</p>
            <p>{field.explainer}</p>
          </PopoverContent>
        </Popover>
      </div>

      <p id={helperId} className="mt-1 text-base text-muted-foreground">
        {field.helper}
      </p>

      <div className="mt-5 flex items-center gap-2 sm:gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-12 shrink-0 rounded-full"
          onClick={() => nudge(-1)}
          disabled={disabled || value <= field.min}
          aria-label={`Decrease ${field.label}`}
        >
          <Minus className="size-5" aria-hidden="true" />
        </Button>

        <Slider
          value={Math.min(value, field.sliderMax ?? field.max)}
          min={field.min}
          max={field.sliderMax ?? field.max}
          step={field.step}
          largeStep={field.largeStep}
          disabled={disabled}
          format={intlOptionsFor(field.format)}
          locale="en-GB"
          aria-labelledby={labelId}
          aria-describedby={describedBy}
          onValueChange={(next) => {
            if (typeof next === 'number') onChange(clampToField(name, next))
          }}
          onValueCommitted={(next) => {
            if (typeof next === 'number') commit(next)
          }}
          className="grow [&_[data-slot=slider-thumb]]:size-7 [&_[data-slot=slider-track]]:h-2.5"
        />

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-12 shrink-0 rounded-full"
          onClick={() => nudge(1)}
          disabled={disabled || value >= field.max}
          aria-label={`Increase ${field.label}`}
        >
          <Plus className="size-5" aria-hidden="true" />
        </Button>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="relative">
          {isCurrency(field.format) && (
            <span
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-muted-foreground"
              aria-hidden="true"
            >
              £
            </span>
          )}
          <Input
            id={inputId}
            inputMode="decimal"
            value={displayValue}
            disabled={disabled}
            aria-describedby={describedBy}
            className={cn(
              'h-12 w-40 text-lg tabular-nums',
              isCurrency(field.format) && 'pl-7',
            )}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              if (draft !== null) {
                const parsed = parseInput(field.format, draft)
                if (parsed !== null) commit(parsed)
                setDraft(null)
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur()
              if (e.key === 'Escape') setDraft(null)
            }}
          />
        </div>
        <span className="text-base text-muted-foreground">
          {suffixFor(field.format)}
        </span>
      </div>

      {suggestion && (
        <div
          id={suggestionId}
          className="mt-4 rounded-xl border border-dashed border-amber-500 bg-amber-50 p-4 dark:bg-amber-950/30"
        >
          <p className="flex items-start gap-2 text-base">
            <Sparkles
              className="mt-0.5 size-5 shrink-0 text-amber-600"
              aria-hidden="true"
            />
            <span>
              <strong className="font-semibold">
                Try {formatFieldValue(field.format, suggestion.value)}
              </strong>{' '}
              — {suggestion.rationale}
            </span>
          </p>
          <div className="mt-3 flex gap-2">
            <Button type="button" size="lg" onClick={onAcceptSuggestion}>
              Use this
            </Button>
            <Button
              type="button"
              size="lg"
              variant="ghost"
              onClick={onDismissSuggestion}
            >
              No thanks
            </Button>
          </div>
        </div>
      )}

      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
    </div>
  )
}

function isCurrency(format: string) {
  return format === 'gbp' || format === 'gbp-monthly'
}

function suffixFor(format: string) {
  switch (format) {
    case 'gbp-monthly':
      return 'a month'
    case 'gbp':
      return 'a year'
    case 'percent':
      return '% a year'
    case 'age':
      return 'years old'
    case 'years':
      return 'years'
    default:
      return ''
  }
}

/** Percentages are stored as decimals but shown as whole percents. */
function formatForInput(format: string, value: number): string {
  if (format === 'percent') return String(Number((value * 100).toFixed(3)))
  // Money reads as money: 120,000 not 120000. The parser strips the commas.
  if (format === 'gbp' || format === 'gbp-monthly')
    return value.toLocaleString('en-GB', { maximumFractionDigits: 2 })
  return String(value)
}

function parseInput(format: string, raw: string): number | null {
  const cleaned = raw.replace(/[£,\s%]/g, '')
  if (cleaned === '') return null
  const n = Number(cleaned)
  if (!Number.isFinite(n)) return null
  return format === 'percent' ? n / 100 : n
}
