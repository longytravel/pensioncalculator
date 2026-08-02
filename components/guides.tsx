'use client'

/**
 * Her questions, answered.
 *
 * These are the four things she actually asked, in her own words, kept
 * verbatim as the headings so she recognises them. Written answers rather than
 * left to the assistant, because these four are the ones most likely to pull a
 * chatbot over the advice line — and because a written answer can be checked
 * before she reads it.
 */

import * as React from 'react'
import { ChevronDown, Check, MessageSquare } from 'lucide-react'
import { GUIDES } from '@/content/guides'

export function Guides() {
  const [open, setOpen] = React.useState<string | null>(null)

  return (
    <section className="border bg-card">
      <header className="border-b px-5 py-4">
        <p className="eyebrow text-xs text-muted-foreground">
          The things you asked
        </p>
        <h2 className="text-xl font-bold uppercase">Your questions, answered</h2>
      </header>

      <div className="divide-y">
        {GUIDES.map((guide) => {
          const isOpen = open === guide.id
          return (
            <article key={guide.id}>
              <h3>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : guide.id)}
                  aria-expanded={isOpen}
                  aria-controls={`guide-${guide.id}`}
                  className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-muted"
                >
                  <span>
                    <span className="block text-base font-semibold">
                      &ldquo;{guide.question}&rdquo;
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {guide.short}
                    </span>
                  </span>
                  <ChevronDown
                    className={`mt-1 size-5 shrink-0 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
              </h3>

              {isOpen && (
                <div id={`guide-${guide.id}`} className="px-5 pb-6">
                  <div className="space-y-3 text-base leading-relaxed">
                    {guide.body.map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>

                  <div className="mt-5 border-l-4 border-l-foreground bg-muted p-4">
                    <p className="eyebrow text-xs text-muted-foreground">
                      What to actually do
                    </p>
                    <ul className="mt-2 space-y-2">
                      {guide.checklist.map((item) => (
                        <li key={item} className="flex gap-2 text-base">
                          <Check
                            className="mt-1 size-4 shrink-0"
                            aria-hidden="true"
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {guide.askYourAccountant && (
                    <div className="mt-4 border border-dashed p-4">
                      <p className="eyebrow flex items-center gap-2 text-xs text-muted-foreground">
                        <MessageSquare className="size-3.5" aria-hidden="true" />
                        Ask your accountant
                      </p>
                      <ul className="mt-2 space-y-2">
                        {guide.askYourAccountant.map((q) => (
                          <li key={q} className="text-base">
                            &ldquo;{q}&rdquo;
                          </li>
                        ))}
                      </ul>
                      <CopyButton
                        text={[
                          'Hi, a few pension questions:',
                          '',
                          ...guide.askYourAccountant.map((q) => `- ${q}`),
                          '',
                          'Thanks!',
                        ].join('\n')}
                      />
                    </div>
                  )}
                </div>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

/** She said she is emailing her accountant tomorrow. Save her writing it. */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false)

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 2500)
        } catch {
          // Clipboard can be blocked; the questions are on screen regardless.
          setCopied(false)
        }
      }}
      className="btn-square mt-3 h-11 bg-primary px-4 text-sm font-semibold uppercase tracking-wide text-primary-foreground transition-colors hover:bg-primary/90"
    >
      {copied ? 'Copied — paste into your email' : 'Copy these for your email'}
    </button>
  )
}
