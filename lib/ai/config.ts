/**
 * Shared AI settings.
 *
 * The model and effort live here rather than in the route so the status bar
 * can show what is actually being used. Previously the bar had its own
 * hardcoded fallback, which meant it kept saying "low" after the route had
 * been raised to medium — a status bar that lies is worse than no status bar.
 */

export const MODEL_ID = 'gpt-5.6-luna'

/**
 * Raised from 'low'. At low it answered accurately but flatly, and once it had
 * to weigh her IR35 position, the age-57 access rule and the mortgage date
 * together, the reasoning was visibly thin. At roughly a tenth of a penny a
 * message the extra thinking is free in any practical sense.
 */
export const DEFAULT_EFFORT = 'medium' as const

/** Per-million-token prices, for the running cost in the status bar. */
export const PRICE_PER_MTOK = {
  input: 0.2,
  cachedInput: 0.02,
  output: 1.2,
}
