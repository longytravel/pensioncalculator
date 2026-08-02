/**
 * A spend backstop for the assistant.
 *
 * There is no user database and no Redis here, so the daily budget rides in a
 * signed cookie: `day.count.hmac`. The signature stops casual tampering; a
 * determined attacker could drop the cookie and start again, but the threat
 * model is a leaked link or a stuck client retry loop, not a funded adversary.
 * The real ceiling is LIMIT_PER_DAY × the per-request token caps in the route.
 */

import { createHmac, timingSafeEqual } from 'crypto'

export const LIMIT_PER_DAY = 80

const COOKIE = 'kp_chat'

function secret(): string {
  // Derived from values that already live only on the server.
  return `${process.env.SITE_PASSWORD ?? ''}|${process.env.OPENAI_API_KEY ?? ''}|kp-chat-limit-v1`
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url')
}

export interface ChatBudget {
  day: string
  count: number
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Parse and verify the budget cookie; anything off resets to a fresh day. */
export function readBudget(cookieHeader: string | null): ChatBudget {
  const fresh = { day: today(), count: 0 }
  if (!cookieHeader) return fresh

  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`))
  if (!match) return fresh

  const parts = decodeURIComponent(match[1]).split('.')
  if (parts.length !== 3) return fresh
  const [day, countStr, sig] = parts

  const expected = sign(`${day}.${countStr}`)
  const sigBuf = Buffer.from(sig)
  const expBuf = Buffer.from(expected)
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return fresh
  }

  if (day !== today()) return fresh

  const count = Number(countStr)
  return { day, count: Number.isInteger(count) && count >= 0 ? count : 0 }
}

export function overBudget(budget: ChatBudget): boolean {
  return budget.count >= LIMIT_PER_DAY
}

/** The Set-Cookie header value for an updated budget. */
export function budgetCookie(budget: ChatBudget): string {
  const payload = `${budget.day}.${budget.count}`
  const value = encodeURIComponent(`${payload}.${sign(payload)}`)
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=172800${secure}`
}
