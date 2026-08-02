/**
 * Shared-password gate.
 *
 * Vercel's own Password Protection is Enterprise-only (and a paid add-on on
 * Pro), so on the free tier this is the only way to keep a production domain
 * off the open web. It is honest about what it is: enough to keep search
 * engines and passers-by away from someone's financial details, not a hardened
 * authentication system. There is one shared secret, no accounts, no lockout.
 *
 * Note this is `proxy.ts`, not `middleware.ts` — the middleware convention is
 * deprecated in Next 16 and having both files is a hard build error.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const COOKIE = 'kp_access'

/**
 * Constant-time-ish comparison.
 *
 * Timing attacks are not a realistic threat against a single-user tool behind
 * a shared password, but comparing in constant time costs nothing and avoids
 * leaking the password's length or prefix through response timing.
 */
function matches(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

export function proxy(request: NextRequest) {
  const password = process.env.SITE_PASSWORD

  // With no password configured, don't lock anyone out — that would make a
  // misconfigured deployment look broken rather than open.
  if (!password) return NextResponse.next()

  const cookie = request.cookies.get(COOKIE)?.value
  if (cookie && matches(cookie, password)) return NextResponse.next()

  const supplied = request.nextUrl.searchParams.get('pw')

  if (supplied !== null) {
    if (matches(supplied, password)) {
      const url = request.nextUrl.clone()
      url.searchParams.delete('pw')
      // Land her on the welcome page rather than wherever the form posted from.
      url.pathname = '/'

      const response = NextResponse.redirect(url)
      response.cookies.set(COOKIE, password, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 180,
        path: '/',
      })
      return response
    }

    // Wrong password. Previously this bounced back with no explanation at all,
    // which just looks broken.
    const url = request.nextUrl.clone()
    url.pathname = '/unlock'
    url.search = '?retry=1'
    return NextResponse.redirect(url)
  }

  if (request.nextUrl.pathname !== '/unlock') {
    const url = request.nextUrl.clone()
    url.pathname = '/unlock'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  // Everything except Next's own assets and the unlock page's own resources.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|unlock).*)'],
}
