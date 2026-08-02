/**
 * The unlock screen.
 *
 * One field, no security theatre — she has been given a password by a friend,
 * not enrolled in an identity system. The form posts the password as a query
 * parameter, which the proxy exchanges for a cookie.
 */

export const metadata = {
  title: 'Unlock',
  robots: { index: false, follow: false },
}

export default async function UnlockPage({
  searchParams,
}: {
  searchParams: Promise<{ retry?: string }>
}) {
  // Request APIs are async in Next 16.
  const { retry } = await searchParams

  return (
    <main className="flex min-h-full flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <p className="eyebrow text-sm text-muted-foreground">Private</p>
        <h1 className="mt-1 text-4xl font-extrabold uppercase">Your money plan</h1>
        <p className="mt-3 text-base text-muted-foreground">
          This one&rsquo;s just for you. Pop in the password you were given.
        </p>

        <form action="/" method="get" className="mt-8">
          <label
            htmlFor="pw"
            className="eyebrow block text-xs text-muted-foreground"
          >
            Password
          </label>
          <input
            id="pw"
            name="pw"
            type="password"
            autoFocus
            autoComplete="current-password"
            className="mt-2 h-12 w-full rounded-xs border bg-card px-3 text-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            type="submit"
            className="btn-square mt-4 h-12 w-full bg-primary text-base font-semibold uppercase tracking-wide text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Let me in
          </button>
        </form>

        {retry && (
          <p className="mt-4 text-sm text-destructive">
            That didn&rsquo;t work. Have another go.
          </p>
        )}

        <p className="mt-10 text-xs leading-relaxed text-muted-foreground">
          Nothing you enter in this tool is sent anywhere or stored on a server.
          Your figures stay in your own browser.
        </p>
      </div>
    </main>
  )
}
