/**
 * Calculator state.
 *
 * Zustand rather than Context, chiefly because `getState()` lets non-React code
 * — the chat route's tool handlers — read her live figures without any prop
 * threading. Persisted to localStorage so she never loses her place.
 */

'use client'

import { useSyncExternalStore } from 'react'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  DEFAULT_VALUES,
  calculatorValuesSchema,
  clampToField,
  type CalculatorValues,
  type FieldName,
} from './fields'
import type {
  CalculatorInputs,
  DecumulationMethod,
  FundRiskLevel,
  TaxRegime,
} from './engine/types'
import type { WorkingArrangement } from './engine/contractor'

/** A change the assistant has proposed but she hasn't accepted yet. */
export interface PendingSuggestion {
  field: FieldName
  value: number
  rationale: string
  /** What it does to her projected income, for the confirmation chip. */
  predictedMonthlyIncomeChange?: number
}

export interface CalculatorState {
  values: CalculatorValues

  // Choices that aren't numeric sliders.
  fundRiskLevel: FundRiskLevel
  contributionType: CalculatorInputs['contributionType']
  contributionEscalation: CalculatorInputs['contributionEscalation']['mode']
  decumulationMethod: DecumulationMethod
  taxRegime: TaxRegime
  household: 'single' | 'couple'
  region: 'uk' | 'london'
  inRealTerms: boolean
  /**
   * How she is engaged. Gates whether company pension contributions are
   * actually available, so it defaults to 'unknown' rather than assuming.
   */
  workingArrangement: WorkingArrangement

  /**
   * What she actually wants. These don't all feed the maths yet — they shape
   * the wording, the next-steps list and what the assistant knows about her.
   * Asking them matters in its own right: nobody has, and a plan built without
   * them is just arithmetic.
   */
  taperingStyle: 'cliff' | 'taper' | 'unsure'
  lumpSumIntent: 'yes' | 'maybe' | 'no'
  downsizeIntent: 'yes' | 'maybe' | 'no'
  legacyIntent: 'yes' | 'maybe' | 'no'

  /** Which of the seven screens she's on. */
  step: number
  /** Screens she's completed, so we can let her jump back. */
  furthestStep: number
  hasSeenTour: boolean

  suggestion: PendingSuggestion | null

  /**
   * Fields she has told us she doesn't know.
   *
   * Deliberately separate from the value itself. "I don't know what's in my
   * Aviva pension" is not the same as "there is nothing in it" — treating the
   * first as zero would make her plan look far worse than reality and could
   * push her into decisions she doesn't need to make. The value stays at a
   * reasonable estimate, the flag drives the caveat and the follow-up action.
   */
  unknown: Partial<Record<FieldName, boolean>>

  /** Which wizard step she's on, so she can leave and come back. */
  currentStepId: string | null
  answered: string[]
  skipped: string[]
  /** Things she said she'd look up and has since ticked off. */
  found: FieldName[]

  setValue: (field: FieldName, value: number) => void
  setUnknown: (field: FieldName, isUnknown: boolean) => void
  toggleFound: (field: FieldName) => void
  markStep: (stepId: string, outcome: 'answered' | 'skipped') => void
  goToStep: (stepId: string | null) => void
  setMany: (partial: Partial<CalculatorValues>) => void
  setOption: <K extends keyof CalculatorOptions>(
    key: K,
    value: CalculatorOptions[K],
  ) => void
  setStep: (step: number) => void
  proposeChange: (suggestion: PendingSuggestion) => void
  acceptSuggestion: () => void
  dismissSuggestion: () => void
  reset: () => void
}

type CalculatorOptions = Pick<
  CalculatorState,
  | 'fundRiskLevel'
  | 'contributionType'
  | 'contributionEscalation'
  | 'decumulationMethod'
  | 'taxRegime'
  | 'household'
  | 'region'
  | 'inRealTerms'
  | 'hasSeenTour'
  | 'workingArrangement'
  | 'taperingStyle'
  | 'lumpSumIntent'
  | 'downsizeIntent'
  | 'legacyIntent'
>

/** The values each stored enum choice is allowed to hold when read back. */
const OPTION_ENUMS = {
  fundRiskLevel: ['cautious', 'balanced', 'growth'],
  contributionType: ['relief_at_source', 'net_pay', 'salary_sacrifice'],
  contributionEscalation: ['none', 'inflation', 'salary'],
  decumulationMethod: ['swr', 'amortise', 'annuity'],
  taxRegime: ['englandWales', 'scotland'],
  household: ['single', 'couple'],
  region: ['uk', 'london'],
  workingArrangement: [
    'ltd_outside_ir35',
    'ltd_inside_ir35',
    'umbrella',
    'employee',
    'sole_trader',
    'unknown',
  ],
  taperingStyle: ['cliff', 'taper', 'unsure'],
  lumpSumIntent: ['yes', 'maybe', 'no'],
  downsizeIntent: ['yes', 'maybe', 'no'],
  legacyIntent: ['yes', 'maybe', 'no'],
} as const

type OptionEnumKey = keyof typeof OPTION_ENUMS

const INITIAL_OPTIONS: CalculatorOptions = {
  fundRiskLevel: 'growth',
  contributionType: 'relief_at_source',
  contributionEscalation: 'none',
  decumulationMethod: 'swr',
  taxRegime: 'englandWales',
  household: 'single',
  region: 'uk',
  inRealTerms: true,
  hasSeenTour: false,
  workingArrangement: 'unknown',
  taperingStyle: 'unsure',
  lumpSumIntent: 'maybe',
  // Defaults to 'maybe' rather than 'no' so the house isn't silently written
  // out of her plan by a question she skipped.
  downsizeIntent: 'maybe',
  legacyIntent: 'maybe',
}

export const useCalculatorStore = create<CalculatorState>()(
  persist(
    (set, get) => ({
      values: { ...DEFAULT_VALUES },
      ...INITIAL_OPTIONS,
      step: 0,
      furthestStep: 0,
      suggestion: null,
      unknown: {},
      currentStepId: null,
      answered: [],
      skipped: [],
      found: [],

      setValue: (field, value) =>
        set((s) => ({
          values: { ...s.values, [field]: clampToField(field, value) },
          // Typing a figure means she does know it after all.
          unknown: s.unknown[field] ? { ...s.unknown, [field]: false } : s.unknown,
        })),

      setUnknown: (field, isUnknown) =>
        set((s) => ({ unknown: { ...s.unknown, [field]: isUnknown } })),

      toggleFound: (field) =>
        set((s) => ({
          found: s.found.includes(field)
            ? s.found.filter((f) => f !== field)
            : [...s.found, field],
        })),

      markStep: (stepId, outcome) =>
        set((s) => ({
          answered:
            outcome === 'answered' && !s.answered.includes(stepId)
              ? [...s.answered, stepId]
              : s.answered,
          skipped:
            outcome === 'skipped'
              ? s.skipped.includes(stepId)
                ? s.skipped
                : [...s.skipped, stepId]
              : s.skipped.filter((id) => id !== stepId),
        })),

      goToStep: (stepId) => set({ currentStepId: stepId }),

      setMany: (partial) =>
        set((s) => {
          const next = { ...s.values }
          for (const [k, v] of Object.entries(partial)) {
            if (typeof v === 'number') {
              next[k as FieldName] = clampToField(k as FieldName, v)
            }
          }
          return { values: next }
        }),

      setOption: (key, value) => set({ [key]: value } as Partial<CalculatorState>),

      setStep: (step) =>
        set((s) => ({
          step,
          furthestStep: Math.max(s.furthestStep, step),
        })),

      proposeChange: (suggestion) => set({ suggestion }),

      acceptSuggestion: () => {
        const s = get().suggestion
        if (!s) return
        get().setValue(s.field, s.value)
        set({ suggestion: null })
      },

      dismissSuggestion: () => set({ suggestion: null }),

      reset: () =>
        set({
          values: { ...DEFAULT_VALUES },
          ...INITIAL_OPTIONS,
          step: 0,
          furthestStep: 0,
          suggestion: null,
          unknown: {},
          currentStepId: null,
          answered: [],
          skipped: [],
          found: [],
        }),
    }),
    {
      name: 'kirsten-pension',
      storage: createJSONStorage(() => localStorage),
      /**
       * Bump this when a stored shape changes meaning (a renamed enum value, a
       * repurposed field). `migrate` gets the old blob and the version it was
       * written at; today all versions fall through to `merge`, which
       * revalidates everything anyway.
       */
      version: 1,
      migrate: (persisted) => persisted as CalculatorState,
      /**
       * localStorage is user-editable and may hold values written by an older
       * version of the app, so validate EVERYTHING on the way back in. A stale
       * enum that slipped through here would flow into a switch with no
       * default and turn every projected figure into NaN — silently.
       */
      merge: (persisted, current) => {
        const p = persisted as Partial<CalculatorState> | undefined
        if (!p || typeof p !== 'object') return current

        const parsed = calculatorValuesSchema.safeParse({
          ...DEFAULT_VALUES,
          ...(p.values && typeof p.values === 'object' ? p.values : {}),
        })

        // A stored choice survives only if it is still a value the app uses.
        const options: Partial<Record<string, unknown>> = {}
        for (const key of Object.keys(OPTION_ENUMS) as OptionEnumKey[]) {
          const v = p[key]
          if (typeof v === 'string' && (OPTION_ENUMS[key] as readonly string[]).includes(v)) {
            options[key] = v
          }
        }
        if (typeof p.inRealTerms === 'boolean') options.inRealTerms = p.inRealTerms
        if (typeof p.hasSeenTour === 'boolean') options.hasSeenTour = p.hasSeenTour

        const strings = (v: unknown): string[] =>
          Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []

        const fieldNames = Object.keys(DEFAULT_VALUES)
        const found = strings(p.found).filter((f): f is FieldName =>
          fieldNames.includes(f),
        )

        const unknown: Partial<Record<FieldName, boolean>> = {}
        if (p.unknown && typeof p.unknown === 'object') {
          for (const [k, v] of Object.entries(p.unknown)) {
            if (fieldNames.includes(k) && typeof v === 'boolean') {
              unknown[k as FieldName] = v
            }
          }
        }

        return {
          ...current,
          ...options,
          values: parsed.success ? parsed.data : { ...DEFAULT_VALUES },
          step: typeof p.step === 'number' ? p.step : current.step,
          furthestStep:
            typeof p.furthestStep === 'number' ? p.furthestStep : current.furthestStep,
          // A stale id for a removed page is fine: the wizard falls back to
          // page one when it can't find it.
          currentStepId: typeof p.currentStepId === 'string' ? p.currentStepId : null,
          answered: strings(p.answered),
          skipped: strings(p.skipped),
          found,
          unknown,
          // Never restore a half-finished suggestion from a previous session.
          suggestion: null,
        }
      },
    },
  ),
)

/**
 * Whether the persisted state has been read back from localStorage yet.
 *
 * Server-rendered markup uses the defaults, so components must wait for
 * hydration before showing her saved figures or React reports a mismatch.
 * Subscribing to the persist API rather than setting state in an effect avoids
 * the cascading render that would cause.
 */
export function useStoreHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useCalculatorStore.persist.onFinishHydration(onChange),
    () => useCalculatorStore.persist.hasHydrated(),
    () => false,
  )
}

/**
 * Map the flat UI state onto the engine's input shape.
 *
 * Kept as a plain function rather than a selector so the chat route can call it
 * server-side against a state snapshot posted from the client.
 */
export function toEngineInputs(state: {
  values: CalculatorValues
  fundRiskLevel: FundRiskLevel
  contributionType: CalculatorInputs['contributionType']
  contributionEscalation: CalculatorInputs['contributionEscalation']['mode']
  decumulationMethod: DecumulationMethod
  taxRegime: TaxRegime
}): CalculatorInputs {
  const v = state.values

  const otherAssets: CalculatorInputs['otherAssets'] = []
  if (v.downsizeReleaseAmount > 0) {
    otherAssets.push({
      label: 'Moving somewhere smaller',
      netAmount: v.downsizeReleaseAmount,
      ageReceived: v.downsizeAge,
    })
  }
  if (v.businessCashAmount > 0) {
    otherAssets.push({
      label: 'Business cash',
      netAmount: v.businessCashAmount,
      ageReceived: v.businessCashAge,
    })
  }

  return {
    currentAge: v.currentAge,
    // Guard the ordering here so a mid-drag state can never throw in render.
    retirementAge: Math.max(v.retirementAge, v.currentAge + 1),
    planningAge: Math.max(v.planningAge, v.retirementAge + 1),
    salary: v.salary,
    taxRegime: state.taxRegime,
    pensionPots: [
      {
        provider: 'Aviva',
        balance: v.avivaBalance,
        annualChargeRate: v.annualChargeRate,
      },
      {
        provider: 'The People’s Pension',
        balance: v.peoplesPensionBalance,
        annualChargeRate: v.annualChargeRate,
      },
    ],
    personalMonthlyContribution: v.personalMonthlyContribution,
    employerMonthlyContribution: v.employerMonthlyContribution,
    contributionType: state.contributionType,
    contributionEscalation: { mode: state.contributionEscalation },
    fundRiskLevel: state.fundRiskLevel,
    otherAssets,
    cashISA: {
      balance: v.cashIsaBalance,
      annualGrowthRate: 0.025,
      monthlyContribution: v.cashIsaMonthly,
    },
    statePension: {
      statePensionAge: v.statePensionAge,
      qualifyingYears: v.qualifyingYears,
    },
    targetIncome: { amount: v.targetIncome, isNet: true },
    decumulationMethod: state.decumulationMethod,
  }
}
