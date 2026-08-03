/** Walk all wizard pages fresh and verify insights are grounded. */
import { chromium, devices } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const BASE = 'https://pensioncalculator-fawn.vercel.app'
const SHOTS =
  'C:/Users/User/AppData/Local/Temp/claude/C--Users-User-Projects-Kirsten-Pension/8e51fb21-ab97-42dc-adb0-43cf12b5202e/scratchpad/flow'
mkdirSync(SHOTS, { recursive: true })

const browser = await chromium.launch()
const ctx = await browser.newContext({ ...devices['iPhone 12'] })
await ctx.addCookies([
  { name: 'kp_access', value: 'raving', domain: 'pensioncalculator-fawn.vercel.app', path: '/' },
])
const page = await ctx.newPage()

// Wait for deploy: page 1 now says "Three quick things".
let live = false
for (let i = 0; i < 24 && !live; i++) {
  await page.goto(`${BASE}/review`, { waitUntil: 'networkidle' })
  live = (await page.textContent('main'))?.includes('Three quick things') ?? false
  if (!live) await new Promise((r) => setTimeout(r, 10_000))
}
console.log('deploy live:', live)

// Fresh walk. On each page: record heading, whether an insight card shows,
// and scroll depth.
for (let i = 1; i <= 15; i++) {
  await page.waitForTimeout(350)
  const info = await page.evaluate(() => {
    const heading = document.querySelector('h1')?.textContent?.trim() ?? '?'
    const eyebrow =
      document.querySelector('main p.eyebrow')?.textContent?.trim() ?? ''
    const insights = [...document.querySelectorAll('.border-l-4')]
      .map((el) => el.querySelector('p')?.textContent?.trim() ?? '')
      .filter(Boolean)
    const doc = document.documentElement
    return {
      heading,
      eyebrow,
      insights,
      scroll: doc.scrollHeight - doc.clientHeight,
    }
  })
  console.log(
    `${info.eyebrow.padEnd(24)} "${info.heading}" [scrolls ${info.scroll}px]${
      info.insights.length ? `\n    insight: ${info.insights.join(' | ')}` : ''
    }`,
  )
  await page.screenshot({ path: `${SHOTS}/p${String(i).padStart(2, '0')}.png` })

  const next = page.getByRole('button', { name: /Next|Show me my plan/ })
  if (!(await next.count())) break
  const label = (await next.first().textContent()) ?? ''
  await next.first().click()
  if (/Show me my plan/i.test(label)) break
}

// Now prove the mortgage insight is live-linked: go to the mortgage page and
// change the years left, and watch the clear-age move.
await page.goto(`${BASE}/review`, { waitUntil: 'networkidle' })
// jump forward to mortgage-detail (page 8 of 14 on defaults)
for (let i = 0; i < 7; i++) {
  await page.getByRole('button', { name: /Next/ }).first().click()
  await page.waitForTimeout(250)
}
const before = await page.textContent('main')
const beforeCard = before?.match(/Mortgage gone at \d+[^.]*/)?.[0]
console.log('\nmortgage page card before:', beforeCard)
// Set years left to 20 via its number box (second field on the page).
const years = page.locator('input[id="f-mortgageYearsLeft"]')
if (await years.count()) {
  await years.fill('20')
  await years.blur()
  await page.waitForTimeout(600)
  const after = await page.textContent('main')
  console.log(
    'after setting 20 years:',
    after?.match(/(Mortgage gone at \d+|The mortgage runs to \d+)[^.]*/)?.[0],
  )
}
await page.screenshot({ path: `${SHOTS}/mortgage-live.png` })

await browser.close()
console.log('shots in', SHOTS)
