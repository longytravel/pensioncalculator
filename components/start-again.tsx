'use client'

/**
 * Start again.
 *
 * Two taps, deliberately. Wiping everything is the one genuinely destructive
 * thing in the app, and she may well have spent twenty minutes on it — a
 * single stray tap should not be able to undo that.
 */

import * as React from 'react'
import { RotateCcw } from 'lucide-react'
import { useCalculatorStore } from '@/lib/store'

export function StartAgain({ className }: { className?: string }) {
  const store = useCalculatorStore()
  const [confirming, setConfirming] = React.useState(false)

  // Drop back out of the confirm state if she wanders off and thinks better of it.
  React.useEffect(() => {
    if (!confirming) return
    const timer = setTimeout(() => setConfirming(false), 6000)
    return () => clearTimeout(timer)
  }, [confirming])

  if (confirming) {
    return (
      <div className={className}>
        <p className="text-sm">
          Clear everything and start from scratch? Your figures will be gone.
        </p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => {
              store.reset()
              window.location.href = '/review'
            }}
            className="btn-square min-h-11 bg-destructive px-4 text-sm font-semibold uppercase tracking-wide text-white"
          >
            Yes, start again
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="min-h-11 px-4 text-sm underline"
          >
            No, keep it
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className={`inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground underline ${className ?? ''}`}
    >
      <RotateCcw className="size-3.5" aria-hidden="true" />
      Start again
    </button>
  )
}
