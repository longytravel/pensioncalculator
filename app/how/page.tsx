/**
 * How we worked this out.
 *
 * The single auditable page: every assumption the engine uses, where it comes
 * from, and what we deliberately do not do. The figures are imported straight
 * from the engine's own configuration, so this page cannot drift from the
 * maths — if a number changes in the engine, it changes here.
 */

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import {
  DEFAULT_ASSUMPTIONS as A,
  RETIREMENT_LIVING_STANDARDS as RLS,
  LIMITS_2026_27 as L,
} from '@/lib/engine/assumptions'

export const metadata = {
  title: 'How we worked this out',
}

const pct = (n: number) =>
  `${(n * 100).toLocaleString('en-GB', { maximumFractionDigits: 2 })}%`

const gbp = (n: number) =>
  n.toLocaleString('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  })

export default function How() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8 sm:px-6">
      <Link
        href="/plan"
        className="inline-flex min-h-11 items-center gap-1 text-sm underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to your plan
      </Link>

      <p className="eyebrow mt-4 text-xs text-muted-foreground">
        No black boxes
      </p>
      <h1 className="mt-1 text-3xl font-extrabold uppercase sm:text-4xl">
        How we worked this out
      </h1>
      <p className="mt-3 text-base leading-relaxed text-muted-foreground">
        Every figure this tool shows you is built from the assumptions on this
        page. None of them are secret, most of them you can change yourself,
        and each one says where it comes from. Figures are for the 2026/27 tax
        year.
      </p>

      <Section title="How we grow your money">
        <p>
          Your pensions are projected month by month: money goes in at the
          start of each month, then grows. Charges come off the growth rate
          first, so a 5% year with 0.5% charges is treated as roughly 4.5%,
          compounded properly rather than just subtracted.
        </p>
        <p>
          The three growth cases use the Financial Conduct Authority&rsquo;s
          standard projection rates (COBS 13 Annex 2). One thing worth knowing:
          these are the <strong>maximum</strong> rates firms are allowed to
          illustrate with, not a forecast. Real funds can and do return less.
        </p>
        <Table
          caption="Yearly growth rates used, before charges"
          head={['How your money is invested', 'Poor run', 'Middle', 'Good run']}
          rows={[
            [
              'Adventurous / growth',
              pct(A.growthRates.growth.low),
              pct(A.growthRates.growth.mid),
              pct(A.growthRates.growth.high),
            ],
            [
              'Balanced',
              pct(A.growthRates.balanced.low),
              pct(A.growthRates.balanced.mid),
              pct(A.growthRates.balanced.high),
            ],
            [
              'Cautious',
              pct(A.growthRates.cautious.low),
              pct(A.growthRates.cautious.mid),
              pct(A.growthRates.cautious.high),
            ],
          ]}
        />
      </Section>

      <Section title="Today's money">
        <p>
          Everything you see is in <strong>today&rsquo;s money</strong>. We
          assume prices rise by {pct(A.cpi)} a year (the Bank of England&rsquo;s
          2% target, plus a little margin), and every future figure is scaled
          back so that &ldquo;£2,000 a month&rdquo; always means what £2,000
          buys you now — not a devalued future £2,000.
        </p>
      </Section>

      <Section title="Turning a pot into an income">
        <p>
          The headline income figure assumes you draw{' '}
          {pct(A.swr.mid)} of the pot in your first retired year and then keep
          pace with prices — a &ldquo;safe withdrawal rate&rdquo;. We use{' '}
          {pct(A.swr.low)}&ndash;{pct(A.swr.high)} across the three cases,
          deliberately below the American &ldquo;4% rule&rdquo;, in line with
          UK research (Morningstar puts the UK figure at 3.7&ndash;3.9%;
          Vanguard UK says 3&ndash;4%).
        </p>
        <p>
          The tool can also show spending the pot down to zero by your planning
          age, or an annuity — using illustrative rates only, never a quote.
          Annuity rates move with the market and providers differ by around
          15%, so the only honest number is the one on a real quote the week
          you buy.
        </p>
      </Section>

      <Section title="Tax">
        <p>
          Pension income is taxed as income, but with two kindnesses: no
          National Insurance on any of it, and 25% of your pension pot can come
          out tax-free (capped at {gbp(A.lumpSumAllowance)}). Your State
          Pension uses up your {gbp(A.personalAllowance)} personal allowance
          first, and the rest is taxed through the normal bands — including
          Scotland&rsquo;s different ones if you tell the tool you live there.
        </p>
        <p>
          When we show &ldquo;after tax&rdquo;, we have run the full band
          arithmetic, not an approximation.
        </p>
      </Section>

      <Section title="The State Pension">
        <p>
          The full new State Pension is {gbp(A.statePensionFullAmount)} a year
          ({gbp(A.statePensionFullAmount / 52)} a week). You need{' '}
          {A.statePensionFullQualifyingYears} qualifying years of National
          Insurance for all of it, and fewer years mean a proportionate slice.
          We treat it as keeping pace with prices. Check your own record at{' '}
          <a
            className="underline"
            href="https://www.gov.uk/check-state-pension"
            target="_blank"
            rel="noopener noreferrer"
          >
            gov.uk/check-state-pension
          </a>
          {' — it takes two minutes and is the single most useful check in this whole tool.'}
        </p>
      </Section>

      <Section title="The limits that matter">
        <Table
          caption="Allowances and limits, 2026/27"
          head={['Limit', 'Amount']}
          rows={[
            ['Pension contributions per year (Annual Allowance)', gbp(L.annualAllowance)],
            [
              'After you start drawing flexibly (MPAA)',
              gbp(L.moneyPurchaseAnnualAllowance),
            ],
            ['Unused allowance you can carry forward', `${L.carryForwardYears} years`],
            ['ISA allowance per year', gbp(L.isaAllowance)],
            ['Maximum tax-free lump sum', gbp(A.lumpSumAllowance)],
            [
              'Earliest you can touch a private pension',
              `${L.normalMinimumPensionAge} now, ${L.normalMinimumPensionAgeFrom2028} from April 2028`,
            ],
          ]}
        />
      </Section>

      <Section title="The lifestyle anchors">
        <p>
          The &ldquo;what would you like to live on&rdquo; anchors are the
          Retirement Living Standards, published by Pensions UK (the PLSA) with
          modelling by Loughborough University — real research into what
          retired households actually spend.
        </p>
        <Table
          caption="Retirement Living Standards, per year, single person"
          head={['Standard', 'UK-wide', 'London']}
          rows={[
            ['Minimum', gbp(RLS.uk.minimum.single), gbp(RLS.london.minimum.single)],
            ['Moderate', gbp(RLS.uk.moderate.single), gbp(RLS.london.moderate.single)],
            [
              'Comfortable',
              gbp(RLS.uk.comfortable.single),
              gbp(RLS.london.comfortable.single),
            ],
          ]}
        />
        <p>
          One big caveat, and it is why this tool keeps going on about your
          mortgage: these figures assume your home is{' '}
          <strong>paid off</strong>. Source:{' '}
          <a
            className="underline"
            href="https://www.retirementlivingstandards.org.uk"
            target="_blank"
            rel="noopener noreferrer"
          >
            retirementlivingstandards.org.uk
          </a>
          .
        </p>
      </Section>

      <Section title="What we deliberately don't do">
        <ul className="list-inside list-disc space-y-2">
          <li>
            <strong>Forecast your house price or business value.</strong> You
            tell us what you expect to get and when; pretending to know better
            would be false precision.
          </li>
          <li>
            <strong>Recommend a fund, product or provider.</strong> This tool
            gives guidance and education, not regulated financial advice. It
            will show you the arithmetic; it will not tell you what to buy.
          </li>
          <li>
            <strong>Model care costs or inheritance tax.</strong> Both are real
            and both are personal enough to need a professional conversation.
          </li>
        </ul>
      </Section>

      <Section title="Sources">
        <ul className="list-inside list-disc space-y-1 text-sm">
          <li>FCA COBS 13 Annex 2 — projection rates</li>
          <li>HMRC, 2026/27 rates and thresholds — tax bands and allowances</li>
          <li>gov.uk — State Pension amounts and ages</li>
          <li>
            Pensions UK / PLSA Retirement Living Standards, June 2026 —
            lifestyle anchors
          </li>
          <li>Morningstar (2026) and Vanguard UK — withdrawal-rate research</li>
        </ul>
        <p className="mt-3 text-sm text-muted-foreground">
          Last reviewed August 2026. Tax figures need re-checking every April
          and after each Budget.
        </p>
      </Section>

      <footer className="mt-10 border-t pt-6 text-sm leading-relaxed text-muted-foreground">
        <p>
          Information and estimates to help you think &mdash; not financial
          advice. Free impartial guidance at{' '}
          <a
            className="underline"
            href="https://www.moneyhelper.org.uk"
            target="_blank"
            rel="noopener noreferrer"
          >
            MoneyHelper
          </a>
          .
        </p>
      </footer>
    </main>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold uppercase">{title}</h2>
      <div className="mt-3 space-y-3 text-base leading-relaxed">{children}</div>
    </section>
  )
}

function Table({
  caption,
  head,
  rows,
}: {
  caption: string
  head: string[]
  rows: string[][]
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b bg-muted text-left text-xs uppercase text-muted-foreground">
            {head.map((h) => (
              <th key={h} scope="col" className="px-3 py-2 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]} className="border-b last:border-0">
              {r.map((cell, i) =>
                i === 0 ? (
                  <th
                    key={i}
                    scope="row"
                    className="px-3 py-2 text-left font-medium"
                  >
                    {cell}
                  </th>
                ) : (
                  <td key={i} className="figure px-3 py-2">
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
