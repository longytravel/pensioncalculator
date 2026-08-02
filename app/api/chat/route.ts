/**
 * The assistant's endpoint.
 *
 * Server-side only: the OpenAI key never reaches the browser. Runs on the Node
 * runtime because Vercel's Hobby plan caps function duration at 60s and the
 * streaming response needs the headroom.
 */

import { openai } from '@ai-sdk/openai'
import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  tool,
  type UIMessage,
} from 'ai'
import { z } from 'zod'

import { SYSTEM_PROMPT, factPack, stateContext } from '@/lib/ai/prompt'
import { MODEL_ID, DEFAULT_EFFORT, PRICE_PER_MTOK } from '@/lib/ai/config'
import { FIELDS } from '@/lib/fields'
import { readBudget, overBudget, budgetCookie } from '@/lib/ai/limit'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Effort is always passed explicitly. OpenAI's docs and Vercel's disagree
 * about Luna's default, and a live test showed omitting it still produces
 * reasoning tokens — so relying on the default would make the status bar lie.
 */
const REASONING_EFFORT = DEFAULT_EFFORT

/** Field names the assistant is allowed to propose changes to. */
const SUGGESTABLE = [
  'retirementAge',
  'personalMonthlyContribution',
  'employerMonthlyContribution',
  'targetIncome',
  'mortgageOverpayment',
  'cashIsaMonthly',
  'planningAge',
  'downsizeReleaseAmount',
] as const

export async function POST(req: Request) {
  // Spend backstops, in order of cheapness: body size, then the daily budget.
  // Cost is otherwise only *displayed* client-side, which protects nothing.
  const raw = await req.text()
  if (raw.length > 120_000) {
    return new Response('Message too long.', { status: 413 })
  }

  let parsed: { messages: UIMessage[]; calculatorState?: unknown }
  try {
    parsed = JSON.parse(raw)
    if (!Array.isArray(parsed.messages)) throw new Error('bad shape')
  } catch {
    return new Response('Bad request.', { status: 400 })
  }
  const { messages, calculatorState } = parsed

  const budget = readBudget(req.headers.get('cookie'))
  if (overBudget(budget)) {
    return new Response(
      'The assistant has had a very busy day and needs a rest. Try again tomorrow.',
      { status: 429 },
    )
  }
  const spent = { day: budget.day, count: budget.count + 1 }

  // Cap the history. Keeps cost bounded and stops a long session slowly
  // degrading as the context fills with old back-and-forth.
  const recent = messages.slice(-24)

  const result = streamText({
    model: openai.responses(MODEL_ID),
    system: [SYSTEM_PROMPT, factPack(), stateContext(calculatorState ?? {})].join(
      '\n\n---\n\n',
    ),
    messages: await convertToModelMessages(recent),
    /**
     * Without this the model stops the moment it calls a tool, leaving her
     * with a bare button and no explanation. Two steps is enough: call the
     * tool, then write the answer around it.
     */
    stopWhen: stepCountIs(3),
    // Hard per-request ceiling. Reasoning tokens count as output, so this
    // bounds the worst case even if the model wanders.
    maxOutputTokens: 6_000,
    providerOptions: {
      openai: {
        reasoningEffort: REASONING_EFFORT,
        store: false,
      },
    },
    tools: {
      suggestChange: tool({
        description:
          'Propose a change to one of her calculator inputs. This does NOT change anything — it shows her a button she can tap to apply it. Use it when a specific number would answer her question better than a paragraph. One at a time.',
        inputSchema: z.object({
          field: z
            .enum(SUGGESTABLE)
            .describe('Which input to suggest changing.'),
          value: z
            .number()
            .describe(
              'The suggested value, in the same units the field uses: pounds per month for contributions, pounds per year for income, a whole number for ages.',
            ),
          rationale: z
            .string()
            .max(140)
            .describe(
              'One short sentence, addressed to her, saying what this would do. Plain English, no jargon.',
            ),
        }),
        execute: async ({ field, value, rationale }) => {
          const def = FIELDS[field]
          // Clamp server-side too, so a hallucinated figure can never render a
          // button that would push an input outside its valid range.
          const clamped = Math.min(def.max, Math.max(def.min, value))
          return {
            field,
            value: clamped,
            rationale,
            clamped: clamped !== value,
          }
        },
      }),
    },
  })

  const response = result.toUIMessageStreamResponse({
    /**
     * Feeds the status bar. The effort is what we requested rather than
     * anything the API reports back, which is why it is always set explicitly
     * above. Reasoning tokens are a breakdown of output tokens, not an
     * addition to them, so cost is computed from the totals.
     */
    messageMetadata: ({ part }) => {
      if (part.type === 'start') {
        return { model: MODEL_ID, effort: REASONING_EFFORT }
      }

      if (part.type === 'finish') {
        const usage = part.totalUsage
        const inputTokens = usage?.inputTokens ?? 0
        const outputTokens = usage?.outputTokens ?? 0
        // AI SDK 7 nests the breakdowns rather than exposing them at the top.
        const cachedTokens = usage?.inputTokenDetails?.cacheReadTokens ?? 0
        const reasoningTokens = usage?.outputTokenDetails?.reasoningTokens ?? 0
        const uncachedInput = Math.max(0, inputTokens - cachedTokens)

        const cost =
          (uncachedInput * PRICE_PER_MTOK.input +
            cachedTokens * PRICE_PER_MTOK.cachedInput +
            outputTokens * PRICE_PER_MTOK.output) /
          1_000_000

        return {
          model: MODEL_ID,
          effort: REASONING_EFFORT,
          inputTokens,
          outputTokens,
          reasoningTokens,
          cachedTokens,
          costUsd: cost,
        }
      }
    },
    onError: (error) => {
      // Never surface a raw provider error to someone anxious about money.
      console.error('[chat]', error)
      return 'Sorry — I could not get an answer just then. Try asking again.'
    },
  })

  response.headers.append('set-cookie', budgetCookie(spent))
  return response
}
