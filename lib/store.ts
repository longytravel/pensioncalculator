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

  /** Which of the seven screens she's on. */
  step: number
  /** Screens she's completed, so we can let her jump back. */
  furthestStep: number
  hasSeenTour: boolean

  suggestion: PendingSuggestion | null

  setValue: (field: FieldName, value: number) => void
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
>

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
}

export const useCalculatorStore = create<CalculatorState>()(
  persist(
    (set, get) => ({
      values: { ...DEFAULT_VALUES },
      ...INITIAL_OPTIONS,
      step: 0,
      furthestStep: 0,
      suggestion: null,

      setValue: (field, value) =>
        set((s) => ({
          values: { ...s.values, [field]: clampToField(field, value) },
        })),

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
        }),
    }),
    {
      name: 'kirsten-pension',
      storage: createJSONStorage(() => localStorage),
      /**
       * localStorage is user-editable and may hold values written by an older
       * version of the app, so validate on the way back in rather than trusting
       * it. `.catch()` on each field means one bad number falls back to its
       * default instead of wiping everything.
       */
      merge: (persisted, current) => {
        const p = persisted as Partial<CalculatorState> | undefined
        if (!p) return current

        const parsed = calculatorValuesSchema.safeParse({
          ...DEFAULT_VALUES,
          ...(p.values ?? {}),
        })

        return {
          ...current,
          ...p,
          values: parsed.success ? parsed.data : { ...DEFAULT_VALUES },
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
