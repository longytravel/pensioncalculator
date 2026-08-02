/**
 * Welcome screen.
 *
 * The first thing she sees. Video first, one button, nothing else competing
 * for attention — the whole job of this page is to get her to press start
 * without feeling like she's begun an admin task.
 */

import Link from 'next/link'

export default function Welcome() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-16">
      <header>
        <p className="eyebrow text-sm text-muted-foreground">
          Made for you, Kirsten
        </p>
        <h1 className="mt-2 text-4xl font-extrabold uppercase leading-[0.95] sm:text-6xl">
          What does it cost
          <br />
          to keep you dancing?
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
          You asked how much to put into your pension each month. Nobody can
          answer that until we know what you want your life to look like. So
          let&rsquo;s work it out properly.
        </p>
      </header>

      {/* 16:9, responsive without pushing the page sideways on a phone. */}
      <div className="mt-8 overflow-hidden border bg-card">
        <div className="relative w-full pt-[56.25%]">
          <iframe
            src="https://app.heygen.com/embeds/509a899acce948c7b1595d82a4c6e7d3"
            title="Watch this first"
            allow="encrypted-media; fullscreen;"
            allowFullScreen
            className="absolute inset-0 size-full"
          />
        </div>
      </div>

      <div className="mt-8">
        <Link
          href="/plan"
          className="btn-square inline-flex h-14 w-full items-center justify-center bg-primary px-8 text-lg font-bold uppercase tracking-wide text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
        >
          Start with my numbers
        </Link>
        <p className="mt-3 text-base text-muted-foreground">
          Takes about five minutes. You can change anything later.
        </p>
      </div>

      <section className="mt-14 border-t pt-10">
        <h2 className="eyebrow text-sm text-muted-foreground">
          What you&rsquo;ll get
        </h2>
        <dl className="mt-5 grid gap-6 sm:grid-cols-3">
          <div>
            <dt className="text-lg font-bold">One honest number</dt>
            <dd className="mt-1 text-base leading-relaxed text-muted-foreground">
              What you&rsquo;re on track for each month, after tax, in
              today&rsquo;s money. Not a brochure figure.
            </dd>
          </div>
          <div>
            <dt className="text-lg font-bold">Everything in one place</dt>
            <dd className="mt-1 text-base leading-relaxed text-muted-foreground">
              Both pensions, the State Pension, the house, the business and
              your savings &mdash; together, not scattered.
            </dd>
          </div>
          <div>
            <dt className="text-lg font-bold">Someone to ask</dt>
            <dd className="mt-1 text-base leading-relaxed text-muted-foreground">
              An assistant that can see your figures and explain anything,
              however many times you ask.
            </dd>
          </div>
        </dl>
      </section>

      <footer className="mt-14 border-t pt-6 text-sm leading-relaxed text-muted-foreground">
        <p>
          This is a private tool built for one person. It gives information and
          estimates to help you think — it is not financial advice, and it
          cannot know your full circumstances. Figures are estimates, not
          guarantees, and investments can go down as well as up. Nothing you
          type is stored on a server; your figures stay in your own browser.
        </p>
        <p className="mt-3">
          For free, impartial guidance try{' '}
          <a
            className="underline"
            href="https://www.moneyhelper.org.uk"
            target="_blank"
            rel="noopener noreferrer"
          >
            MoneyHelper
          </a>
          . You&rsquo;re also old enough for{' '}
          <a
            className="underline"
            href="https://www.moneyhelper.org.uk/en/pensions-and-retirement/pension-wise"
            target="_blank"
            rel="noopener noreferrer"
          >
            Pension Wise
          </a>
          , which is a free government-backed appointment about your pensions —
          genuinely worth booking.
        </p>
      </footer>
    </main>
  )
}
