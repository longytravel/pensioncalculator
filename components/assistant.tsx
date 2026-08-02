'use client'

/**
 * The assistant panel.
 *
 * Reads her live figures, answers questions, and can propose a change to a
 * single input — which renders as a button she taps. Nothing the assistant does
 * changes her numbers on its own.
 */

import * as React from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Send, Sparkles, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCalculatorStore } from '@/lib/store'
import { buildSnapshot } from '@/lib/ai/snapshot'
import { FIELDS, formatFieldValue, type FieldName } from '@/lib/fields'
import { MODEL_ID, DEFAULT_EFFORT } from '@/lib/ai/config'

/** What the route attaches via messageMetadata. */
interface ChatMetadata {
  model?: string
  effort?: string
  inputTokens?: number
  outputTokens?: number
  reasoningTokens?: number
  cachedTokens?: number
  costUsd?: number
}

const STARTERS = [
  'What does all this actually mean?',
  'Can my company pay into my pension?',
  'Should I put my two pensions together?',
  'Is my money better in a pension or an ISA?',
]

export function Assistant() {
  const [input, setInput] = React.useState('')
  const [sessionCost, setSessionCost] = React.useState(0)
  const [lastMeta, setLastMeta] = React.useState<ChatMetadata | null>(null)

  const scrollRef = React.useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      /**
       * Built at send time, straight from the store rather than from a
       * captured render value. Running the projection on every keystroke
       * would be wasted work, and reading through getState() guarantees the
       * assistant sees her figures exactly as they are when she hits send.
       */
      prepareSendMessagesRequest: ({ messages }) => {
        const s = useCalculatorStore.getState()
        return {
          body: {
            messages,
            calculatorState: buildSnapshot({
              values: s.values,
              fundRiskLevel: s.fundRiskLevel,
              contributionType: s.contributionType,
              contributionEscalation: s.contributionEscalation,
              decumulationMethod: s.decumulationMethod,
              taxRegime: s.taxRegime,
              workingArrangement: s.workingArrangement,
              inRealTerms: s.inRealTerms,
            }),
          },
        }
      },
    }),
    onFinish: ({ message }) => {
      const meta = message.metadata as ChatMetadata | undefined
      if (!meta) return
      setLastMeta(meta)
      if (typeof meta.costUsd === 'number') {
        setSessionCost((c) => c + meta.costUsd!)
      }
    },
  })

  const busy = status === 'submitted' || status === 'streaming'

  React.useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages])

  const send = (text: string) => {
    if (!text.trim() || busy) return
    sendMessage({ text })
    setInput('')
  }

  return (
    <section
      className="flex h-full flex-col border bg-card"
      aria-label="Your assistant"
    >
      <header className="border-b px-4 py-3">
        <p className="eyebrow text-xs text-muted-foreground">Ask anything</p>
        <h2 className="text-xl font-bold uppercase">Your assistant</h2>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
        role="log"
        aria-live="polite"
        aria-label="Conversation"
      >
        {messages.length === 0 && (
          <div>
            <p className="text-base text-muted-foreground">
              I can see your figures. Ask me anything — there are no daft
              questions here.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-xs border px-3 py-2 text-left text-base transition-colors hover:bg-muted"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id}>
            <p className="eyebrow mb-1 text-xs text-muted-foreground">
              {m.role === 'user' ? 'You' : 'Assistant'}
            </p>

            {m.parts.map((part, i) => {
              if (part.type === 'text') {
                return (
                  <p
                    key={i}
                    className="whitespace-pre-wrap text-base leading-relaxed"
                  >
                    {part.text}
                  </p>
                )
              }

              // A proposed change renders as a button she taps. The tool call
              // itself never touches her figures.
              if (
                part.type === 'tool-suggestChange' &&
                part.state === 'output-available'
              ) {
                const out = part.output as {
                  field: FieldName
                  value: number
                  rationale: string
                }
                return <SuggestionChip key={i} {...out} />
              }

              return null
            })}
          </div>
        ))}

        {busy && (
          <p className="flex items-center gap-2 text-base text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Thinking…
          </p>
        )}

        {error && (
          <p className="text-base text-destructive">
            Something went wrong there. Try asking again.
          </p>
        )}
      </div>

      <form
        className="flex gap-2 border-t p-3"
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
      >
        <label htmlFor="assistant-input" className="sr-only">
          Ask your assistant a question
        </label>
        <Input
          id="assistant-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything…"
          disabled={busy}
          className="h-11 text-base"
        />
        <Button
          type="submit"
          size="icon"
          disabled={busy || !input.trim()}
          className="btn-square size-11"
          aria-label="Send"
        >
          <Send className="size-4" aria-hidden="true" />
        </Button>
      </form>

      <StatusBar meta={lastMeta} sessionCost={sessionCost} busy={busy} />
    </section>
  )
}

/** Model, effort and spend. Requested by the user to be always visible. */
function StatusBar({
  meta,
  sessionCost,
  busy,
}: {
  meta: ChatMetadata | null
  sessionCost: number
  busy: boolean
}) {
  const cost =
    sessionCost > 0 && sessionCost < 0.01
      ? '<$0.01'
      : `$${sessionCost.toFixed(2)}`

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t bg-muted px-3 py-2 text-[11px] text-muted-foreground">
      <span className="flex items-center gap-1 font-semibold uppercase tracking-wide">
        <span
          className={`inline-block size-1.5 rounded-full ${
            busy ? 'animate-pulse bg-foreground' : 'bg-muted-foreground/50'
          }`}
          aria-hidden="true"
        />
        {meta?.model ?? MODEL_ID}
      </span>

      <span className="uppercase tracking-wide">
        effort:{' '}
        <strong className="font-semibold">
          {meta?.effort ?? DEFAULT_EFFORT}
        </strong>
      </span>

      {meta?.reasoningTokens !== undefined && (
        <span className="tabular-nums">
          reasoning: {meta.reasoningTokens.toLocaleString('en-GB')}
        </span>
      )}

      {meta?.outputTokens !== undefined && (
        <span className="tabular-nums">
          out: {meta.outputTokens.toLocaleString('en-GB')}
        </span>
      )}

      {meta?.cachedTokens ? (
        <span className="tabular-nums">
          cached: {meta.cachedTokens.toLocaleString('en-GB')}
        </span>
      ) : null}

      <span className="ml-auto tabular-nums">{cost} this session</span>
    </div>
  )
}

function SuggestionChip({
  field,
  value,
  rationale,
}: {
  field: FieldName
  value: number
  rationale: string
}) {
  const store = useCalculatorStore()
  const [applied, setApplied] = React.useState(false)
  const [dismissed, setDismissed] = React.useState(false)

  const def = FIELDS[field]
  if (dismissed) return null

  if (applied) {
    return (
      <p className="mt-3 border-l-4 border-l-foreground bg-muted px-3 py-2 text-sm">
        Done — {def.label.toLowerCase().replace(/\?$/, '')} is now{' '}
        <strong>{formatFieldValue(def.format, value)}</strong>.
      </p>
    )
  }

  return (
    <div className="mt-3 border border-dashed border-foreground/40 bg-muted p-3">
      <p className="flex items-start gap-2 text-sm">
        <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>{rationale}</span>
      </p>
      <div className="mt-3 flex gap-2">
        <Button
          type="button"
          size="sm"
          className="btn-square"
          onClick={() => {
            store.setValue(field, value)
            setApplied(true)
          }}
        >
          Try {formatFieldValue(def.format, value)}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setDismissed(true)}
        >
          No thanks
        </Button>
      </div>
    </div>
  )
}
