'use client'

/**
 * The money-over-time picture.
 *
 * One chart, one story: what she has, when it peaks, and whether it lasts.
 * The mid case is drawn as solid stacked areas (pensions + ISA); the low and
 * high cases are thin dashed boundaries so the honest uncertainty is visible
 * without shouting. Everything is in today's money.
 *
 * Accessibility is not delegated to the chart library: a plain-English summary
 * sits under the chart and the full numbers are available as a real table.
 */

import * as React from 'react'
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import type { ProjectionOutput } from '@/lib/engine/types'

const gbp = (n: number) =>
  Math.round(n).toLocaleString('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  })

/** £250k-style compact labels for the axis. */
const compact = (n: number) =>
  n >= 1_000_000
    ? `£${(n / 1_000_000).toLocaleString('en-GB', { maximumFractionDigits: 1 })}m`
    : n >= 1_000
      ? `£${Math.round(n / 1_000)}k`
      : `£${Math.round(n)}`

interface ChartRow {
  age: number
  pension: number
  isa: number
  total: number
  low: number
  high: number
  incomeNet: number
}

export function ProjectionChart({
  output,
  retirementAge,
  planningAge,
}: {
  output: ProjectionOutput
  retirementAge: number
  planningAge: number
}) {
  const [showTable, setShowTable] = React.useState(false)

  const mid = output.scenarios.mid
  const low = output.scenarios.low
  const high = output.scenarios.high

  const data: ChartRow[] = mid.rows.map((r, i) => ({
    age: r.age,
    pension: r.pension,
    isa: r.isa,
    total: r.total,
    low: low.rows[i]?.total ?? 0,
    high: high.rows[i]?.total ?? 0,
    incomeNet: r.incomeNet,
  }))

  if (data.length < 2) return null

  const peak = data.reduce((a, r) => (r.total > a.total ? r : a), data[0])
  const depletion = mid.potDepletionAge
  const lowDepletion = low.potDepletionAge

  const lasts =
    depletion !== undefined ? (
      <>
        {'In the middle case the money runs out around age '}
        <strong>{depletion}</strong>
        {' — before your planning age of '}
        {planningAge}
        {'. The levers below are how you change that.'}
      </>
    ) : lowDepletion !== undefined ? (
      <>
        {'In the middle case it lasts to your planning age of '}
        {planningAge}
        {'. If markets have a genuinely bad run, it could run out around age '}
        <strong>{lowDepletion}</strong>
        {' — worth knowing, not worth panicking over.'}
      </>
    ) : (
      <>
        {'It lasts to your planning age of '}
        {planningAge}
        {' in every case we ran, including the poor-markets one.'}
      </>
    )

  return (
    <section className="border bg-card">
      <header className="border-b px-5 py-4">
        <p className="eyebrow text-xs text-muted-foreground">
          In today&rsquo;s money
        </p>
        <h2 className="mt-1 text-xl font-bold uppercase">
          Your money over time
        </h2>
      </header>

      <div className="px-2 pt-4 sm:px-4">
        <div
          role="img"
          aria-label={`Chart of your pensions and ISA from age ${data[0].age} to ${planningAge}. The same numbers are in the table below the chart.`}
        >
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart
              data={data}
              margin={{ top: 8, right: 8, bottom: 0, left: 4 }}
            >
              <XAxis
                dataKey="age"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
                minTickGap={28}
              />
              <YAxis
                tickFormatter={compact}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
                width={44}
              />
              <Tooltip content={<PotTooltip />} />

              <Area
                type="monotone"
                dataKey="pension"
                stackId="pot"
                name="Pensions"
                fill="var(--foreground)"
                fillOpacity={0.8}
                stroke="none"
              />
              <Area
                type="monotone"
                dataKey="isa"
                stackId="pot"
                name="Cash ISA"
                fill="var(--muted-foreground)"
                fillOpacity={0.45}
                stroke="none"
              />

              <Line
                type="monotone"
                dataKey="high"
                name="Good markets"
                stroke="var(--muted-foreground)"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="low"
                name="Poor markets"
                stroke="var(--muted-foreground)"
                strokeDasharray="2 4"
                strokeWidth={1.5}
                dot={false}
              />

              <ReferenceLine
                x={retirementAge}
                stroke="var(--foreground)"
                strokeDasharray="3 3"
                label={{
                  value: 'You stop',
                  position: 'insideTopLeft',
                  fontSize: 11,
                  fill: 'var(--muted-foreground)',
                }}
              />
              {depletion !== undefined && (
                <ReferenceLine
                  x={depletion}
                  stroke="var(--destructive)"
                  strokeDasharray="3 3"
                  label={{
                    value: 'Runs out',
                    position: 'insideTopRight',
                    fontSize: 11,
                    fill: 'var(--destructive)',
                  }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 px-2 pb-1 pt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 bg-foreground/80" aria-hidden="true" />
            Pensions
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 bg-muted-foreground/45" aria-hidden="true" />
            Cash ISA
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-0 w-4 border-t border-dashed border-muted-foreground"
              aria-hidden="true"
            />
            If markets do better or worse
          </span>
        </div>
      </div>

      <div className="space-y-2 px-5 py-4 text-sm leading-relaxed">
        <p>
          {'Everything you have builds to about '}
          <strong className="figure">{gbp(peak.total)}</strong>
          {' around age '}
          {peak.age}
          {', then you start living on it.'}
        </p>
        <p>{lasts}</p>
      </div>

      <div className="border-t px-5 py-3">
        <button
          type="button"
          onClick={() => setShowTable((s) => !s)}
          aria-expanded={showTable}
          className="min-h-11 text-sm font-semibold underline"
        >
          {showTable ? 'Hide the numbers' : 'See the numbers behind this'}
        </button>

        {showTable && (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <caption className="sr-only">
                Your projected money at five-year steps, in today&rsquo;s money
              </caption>
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th scope="col" className="py-2 pr-2 font-semibold">Age</th>
                  <th scope="col" className="py-2 pr-2 font-semibold">Pensions</th>
                  <th scope="col" className="py-2 pr-2 font-semibold">Cash ISA</th>
                  <th scope="col" className="py-2 pr-2 font-semibold">Total</th>
                  <th scope="col" className="py-2 font-semibold">
                    Income after tax
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableRows(data, retirementAge).map((r) => (
                  <tr key={r.age} className="border-b last:border-0">
                    <td className="py-2 pr-2 font-semibold">{r.age}</td>
                    <td className="figure py-2 pr-2">{gbp(r.pension)}</td>
                    <td className="figure py-2 pr-2">{gbp(r.isa)}</td>
                    <td className="figure py-2 pr-2">{gbp(r.total)}</td>
                    <td className="figure py-2">
                      {r.incomeNet > 0 ? `${gbp(r.incomeNet / 12)} a month` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

/** Five-year steps, always including the retirement year and the last year. */
function tableRows(data: ChartRow[], retirementAge: number): ChartRow[] {
  const keep = new Set<number>()
  for (const r of data) {
    if ((r.age - data[0].age) % 5 === 0) keep.add(r.age)
  }
  keep.add(retirementAge)
  keep.add(data[data.length - 1].age)
  return data.filter((r) => keep.has(r.age))
}

interface TooltipPayload {
  payload?: ChartRow
}

function PotTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: TooltipPayload[]
}) {
  const row = payload?.[0]?.payload
  if (!active || !row) return null

  return (
    <div className="border bg-background px-3 py-2 text-xs shadow-sm">
      <p className="font-bold">Age {row.age}</p>
      <p className="figure mt-1 text-sm">{gbp(row.total)}</p>
      <p className="mt-0.5 text-muted-foreground">
        {'Pensions '}
        {gbp(row.pension)}
        {row.isa > 0 ? ` · ISA ${gbp(row.isa)}` : ''}
      </p>
      <p className="text-muted-foreground">
        {'Could be '}
        {gbp(row.low)}
        {'–'}
        {gbp(row.high)}
      </p>
    </div>
  )
}
