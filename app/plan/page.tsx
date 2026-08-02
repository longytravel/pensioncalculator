'use client'

/**
 * The plan — the full picture, in three tabs.
 *
 * One 14,000-pixel scroll helped nobody. The projected figure stays pinned to
 * the top on every tab; below it she picks the view: the number and where it
 * comes from, the answers that drive it, or what to actually do about it.
 */

import * as React from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

import {
  useCalculatorStore,
  useStoreHydrated,
  toEngineInputs,
} from '@/lib/store'
import { project } from '@/lib/engine/project'
import { EngineInputError } from '@/lib/engine/types'
import { equity, clearedAtAge } from '@/lib/engine/mortgage'
import { companyContributionsAvailable } from '@/lib/engine/contractor'
import { CalculatorSlider } from '@/components/calculator-slider'
import { LiveHeader } from '@/components/live-header'
import { Assistant } from '@/components/assistant'
import { Objectives } from '@/components/objectives'
import { Guides } from '@/components/guides'
import { ProjectionChart } from '@/components/projection-chart'
import {
  ActionPlan,
  AccountantPanel,
  InsightList,
} from '@/components/advice-cards'
import { advise } from '@/lib/advice'
import { StartAgain } from '@/components/start-again'
import { Comparison } from '@/components/comparison'
import { compareDestinations, feeDrag } from '@/lib/advice/comparison'
import { Alert } from '@/components/ui/alert'
import { DEFAULT_VALUES, type FieldName } from '@/lib/fields'

const gbp = (n: number) =>
  n.toLocaleString('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  })

const TABS = [
  { id: 'number', label: 'Your number' },
  { id: 'answers', label: 'Your answers' },
  { id: 'actions', label: 'What to do' },
] as const

type TabId = (typeof TABS)[number]['id']

interface Section {
  id: string
  title: string
  blurb: string
  fields: FieldName[]
  /** Open by default — the ones she most needs to see. */
  open?: boolean
  /** An extra control that isn't a plain numeric slider. */
  extra?: 'risk'
}

const SECTIONS: Section[] = [
  {
    id: 'want',
    title: 'What you actually want',
    blurb:
      'Nobody can tell you what to pay in until we know what you are aiming at. Start here.',
    fields: ['targetIncome', 'retirementAge', 'planningAge'],
    open: true,
  },
  {
    id: 'paying',
    title: 'What goes in each month',
    blurb:
      'The two boxes that move your number the most. The second one is the interesting one.',
    fields: ['personalMonthlyContribution', 'employerMonthlyContribution'],
    open: true,
  },
  {
    id: 'pensions',
    title: 'The two pensions you already have',
    blurb: 'Rough figures are fine. You can check the exact ones later.',
    /** The risk question she asked about directly. */
    extra: 'risk',
    fields: [
      'avivaBalance',
      'peoplesPensionBalance',
      'annualChargeRate',
      'statePensionAge',
      'qualifyingYears',
    ],
    open: true,
  },
  {
    id: 'home',
    title: 'Your house',
    blurb:
      'You thought of this as your lump sum. Let us see what it is actually worth to you.',
    fields: [
      'houseValue',
      'mortgageBalance',
      'mortgageRate',
      'mortgageYearsLeft',
      'mortgageOverpayment',
      'downsizeReleaseAmount',
      'downsizeAge',
    ],
  },
  {
    id: 'business',
    title: 'The business and your savings',
    blurb: 'Anything else that will be there when you stop working.',
    fields: [
      'businessCashAmount',
      'businessCashAge',
      'cashIsaBalance',
      'cashIsaMonthly',
      'salary',
      'currentAge',
    ],
  },
]

export default function Plan() {
  const store = useCalculatorStore()
  const hydrated = useStoreHydrated()
  const values = hydrated ? store.values : DEFAULT_VALUES
  const [tab, setTab] = React.useState<TabId>('number')

  const { output, error } = React.useMemo(() => {
    try {
      return {
        output: project(toEngineInputs({ ...store, values }), {
          inRealTerms: store.inRealTerms,
        }),
        error: null as string | null,
      }
    } catch (e) {
      return {
        output: null,
        error:
          e instanceof EngineInputError ? e.message : 'Something went wrong.',
      }
    }
  }, [store, values])

  // The whole advisory layer, recomputed from her current state.
  const advice = React.useMemo(() => {
    try {
      return advise({ ...store, values })
    } catch {
      return null
    }
  }, [store, values])

  const switchTab = (next: TabId) => {
    setTab(next)
    window.scrollTo({ top: 0 })
  }

  return (
    <>
      <LiveHeader output={output} />

      {/* The view switcher, directly under the pinned number. */}
      <div className="border-b bg-background">
        <div
          className="mx-auto flex w-full max-w-4xl px-4 sm:px-6"
          role="tablist"
          aria-label="Views of your plan"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => switchTab(t.id)}
              className={`min-h-12 flex-1 border-b-2 px-2 text-sm font-bold uppercase tracking-wide transition-colors sm:text-base ${
                tab === t.id
                  ? 'border-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-5 sm:px-6">
        {error && (
          <Alert className="border-destructive">
            <p>{error}</p>
          </Alert>
        )}

        {tab === 'number' && (
          <NumberTab
            output={output}
            values={values}
            onFixAnswers={() => switchTab('answers')}
          />
        )}
        {tab === 'answers' && <AnswersTab values={values} />}
        {tab === 'actions' && advice && (
          <div className="space-y-6">
            <InsightList insights={advice.insights} />
            <ActionPlan actions={advice.actions} />
            <Comparison
              destinations={compareDestinations({ ...store, values }, advice.derived)}
              feeDrag={feeDrag({ ...store, values }, advice.derived)}
              years={advice.derived.yearsToRetirement}
            />
            <AccountantPanel
              questions={advice.accountantQuestions}
              emailBody={advice.emailBody}
            />
            <Guides />
          </div>
        )}

        <div className="mt-8 h-[32rem]">
          <Assistant />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t pt-4">
          <Link href="/" className="min-h-11 text-sm underline">
            &larr; Back to the start
          </Link>
          <StartAgain />
        </div>

        <footer className="mt-6 border-t pt-6 text-sm leading-relaxed text-muted-foreground">
          <p>
            Information and estimates to help you think &mdash; not financial
            advice. Figures are estimates, not guarantees, and investments can
            go down as well as up. Free impartial guidance at{' '}
            <a
              className="underline"
              href="https://www.moneyhelper.org.uk"
              target="_blank"
              rel="noopener noreferrer"
            >
              MoneyHelper
            </a>
            , and{' '}
            <a
              className="underline"
              href="https://www.moneyhelper.org.uk/en/pensions-and-retirement/pension-wise"
              target="_blank"
              rel="noopener noreferrer"
            >
              Pension Wise
            </a>{' '}
            is free to you from 50.
          </p>
        </footer>
      </main>
    </>
  )
}

function NumberTab({
  output,
  values,
  onFixAnswers,
}: {
  output: ReturnType<typeof project> | null
  values: typeof DEFAULT_VALUES
  onFixAnswers: () => void
}) {
  const homeEquity = equity(values.houseValue, values.mortgageBalance)
  const mortgageEnds = clearedAtAge(
    {
      balance: values.mortgageBalance,
      annualRate: values.mortgageRate,
      yearsRemaining: values.mortgageYearsLeft,
      monthlyOverpayment: values.mortgageOverpayment,
    },
    values.currentAge,
  )

  return (
    <div className="space-y-5">
      <Objectives />

      {output && (
        <ProjectionChart
          output={output}
          retirementAge={values.retirementAge}
          planningAge={values.planningAge}
        />
      )}

      {/* Where the money is actually coming from. */}
      {output && (
        <section className="border bg-card p-5">
          <h2 className="eyebrow text-xs text-muted-foreground">
            Where it comes from
          </h2>
          <dl className="mt-3 space-y-2 text-base">
            <Row
              label="Your two pensions, by the time you stop"
              value={gbp(output.scenarios.mid.potAtRetirement)}
            />
            <Row
              label="Tax-free cash from that (25%)"
              value={gbp(output.scenarios.mid.taxFreeLumpSum)}
              muted
            />
            <Row
              label="State Pension, every year from 67"
              value={gbp(
                output.scenarios.mid.rows.find((r) => r.statePensionIncome > 0)
                  ?.statePensionIncome ?? 0,
              )}
            />
            <Row
              label="Equity in your house right now"
              value={gbp(homeEquity)}
            />
            {values.downsizeReleaseAmount > 0 && (
              <Row
                label={`Freed up by moving at ${values.downsizeAge}`}
                value={gbp(values.downsizeReleaseAmount)}
              />
            )}
            {values.businessCashAmount > 0 && (
              <Row
                label={`From the business at ${values.businessCashAge}`}
                value={gbp(values.businessCashAmount)}
              />
            )}
            {values.cashIsaBalance > 0 && (
              <Row label="Savings and ISAs" value={gbp(values.cashIsaBalance)} />
            )}
          </dl>

          {mortgageEnds !== null && (
            <p className="mt-4 border-t pt-3 text-sm text-muted-foreground">
              Your mortgage is paid off at{' '}
              <strong className="text-foreground">{mortgageEnds}</strong>
              {mortgageEnds <= values.retirementAge
                ? ' — before you stop working, which is what you want.'
                : ` — that is after you stop at ${values.retirementAge}, so the payments carry on without the income.`}
            </p>
          )}
        </section>
      )}

      {output && output.warnings.length > 0 && (
        <Alert>
          <ul className="list-inside list-disc space-y-1">
            {output.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </Alert>
      )}

      <button
        type="button"
        onClick={onFixAnswers}
        className="btn-square flex h-12 w-full items-center justify-center border text-sm font-bold uppercase tracking-wide transition-colors hover:bg-muted"
      >
        Change what&rsquo;s behind these numbers
      </button>
    </div>
  )
}

function AnswersTab({ values }: { values: typeof DEFAULT_VALUES }) {
  const store = useCalculatorStore()
  const company = companyContributionsAvailable(store.workingArrangement)

  return (
    <div className="space-y-4">
      {/* The company-contribution route she is already chasing. */}
      <section className="border-l-4 border-l-foreground bg-muted p-5">
        <h2 className="text-lg font-bold">
          Can the business pay in instead of you?
        </h2>
        <p className="mt-2 text-base leading-relaxed">{company.explanation}</p>
        <div className="mt-3">
          <label
            htmlFor="arrangement"
            className="eyebrow block text-xs text-muted-foreground"
          >
            How are you working at the moment?
          </label>
          <select
            id="arrangement"
            value={store.workingArrangement}
            onChange={(e) =>
              store.setOption(
                'workingArrangement',
                e.target.value as typeof store.workingArrangement,
              )
            }
            className="mt-1 h-12 w-full max-w-md rounded-xs border bg-card px-3 text-base"
          >
            <option value="unknown">I am not sure yet</option>
            <option value="ltd_outside_ir35">
              My own company, outside IR35
            </option>
            <option value="ltd_inside_ir35">
              My own company, inside IR35
            </option>
            <option value="umbrella">Through an umbrella company</option>
            <option value="employee">Employed on payroll</option>
            <option value="sole_trader">Self-employed, no company</option>
          </select>
        </div>
      </section>

      {SECTIONS.map((section) => (
        <Collapsible key={section.id} section={section}>
          {section.extra === 'risk' && (
            <div className="border bg-card p-5 lg:col-span-2">
              <p className="text-lg font-semibold">
                How is your money invested?
              </p>
              <p className="mt-1 text-base text-muted-foreground">
                If you have never picked, you are almost certainly in the
                default fund, which is usually the middle one. Have a look at
                the guide below to find out for certain.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(
                  [
                    ['cautious', 'Cautious / safe'],
                    ['balanced', 'Balanced'],
                    ['growth', 'Adventurous / growth'],
                  ] as const
                ).map(([level, label]) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => store.setOption('fundRiskLevel', level)}
                    aria-pressed={store.fundRiskLevel === level}
                    className={`min-h-12 border px-4 py-2 text-base transition-colors ${
                      store.fundRiskLevel === level
                        ? 'border-foreground bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {section.fields.map((name) => (
            <CalculatorSlider
              key={name}
              name={name}
              value={values[name]}
              onChange={(v) => store.setValue(name, v)}
              suggestion={
                store.suggestion?.field === name
                  ? {
                      value: store.suggestion.value,
                      rationale: store.suggestion.rationale,
                    }
                  : null
              }
              onAcceptSuggestion={store.acceptSuggestion}
              onDismissSuggestion={store.dismissSuggestion}
            />
          ))}
        </Collapsible>
      ))}
    </div>
  )
}

function Row({
  label,
  value,
  muted,
}: {
  label: string
  value: string
  muted?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={muted ? 'text-muted-foreground' : ''}>{label}</dt>
      <dd
        className={`figure shrink-0 ${muted ? 'text-muted-foreground' : ''}`}
      >
        {value}
      </dd>
    </div>
  )
}

function Collapsible({
  section,
  children,
}: {
  section: Section
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(section.open ?? false)

  return (
    <section className="border bg-card">
      <h2>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={`${section.id}-content`}
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-muted"
        >
          <span>
            <span className="block text-lg font-bold uppercase">
              {section.title}
            </span>
            <span className="mt-0.5 block text-sm font-normal text-muted-foreground">
              {section.blurb}
            </span>
          </span>
          <ChevronDown
            className={`size-5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
      </h2>
      {open && (
        <div
          id={`${section.id}-content`}
          className="grid gap-3 border-t p-3 lg:grid-cols-2"
        >
          {children}
        </div>
      )}
    </section>
  )
}
