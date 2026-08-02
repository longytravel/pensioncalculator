/**
 * The unlock screen.
 *
 * One field. She has been given a password by a friend, not enrolled in an
 * identity system, so there is no username, no account and no fuss. It is
 * deliberately a small moment of "this one is mine" rather than a barrier.
 */

export const metadata = {
  title: 'Unlock',
  robots: { index: false, follow: false },
}

export default async function UnlockPage({
  searchParams,
}: {
  // Request APIs are async in Next 16.
  searchParams: Promise<{ retry?: string }>
}) {
  const { retry } = await searchParams

  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <p className="eyebrow text-xs text-muted-foreground">Private</p>
        <h1 className="mt-1 text-4xl font-extrabold uppercase leading-none">
          Your money plan
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          This one&rsquo;s just for you, Kirsten. Pop in the password you were
          given.
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
            aria-describedby={retry ? 'pw-error' : undefined}
            aria-invalid={retry ? true : undefined}
            className={`mt-2 h-14 w-full border bg-card px-4 text-lg outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              retry ? 'border-destructive' : ''
            }`}
          />

          {retry && (
            <p id="pw-error" role="alert" className="mt-2 text-sm text-destructive">
              That&rsquo;s not it. Have another go &mdash; it&rsquo;s the one
              in the message.
            </p>
          )}

          <button
            type="submit"
            className="btn-square mt-4 h-14 w-full bg-primary text-base font-bold uppercase tracking-wide text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Let me in
          </button>
        </form>

        <p className="mt-10 text-xs leading-relaxed text-muted-foreground">
          Nothing you enter in this tool is sent anywhere or stored on a server.
          Your figures stay in your own browser, on your own device.
        </p>
      </div>
    </main>
  )
}
