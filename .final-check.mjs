/** Final live verification of Round 4. */
import { chromium, devices } from '@playwright/test'

const BASE = 'https://pensioncalculator-fawn.vercel.app'
const SHOTS =
  'C:/Users/User/AppData/Local/Temp/claude/C--Users-User-Projects-Kirsten-Pension/8e51fb21-ab97-42dc-adb0-43cf12b5202e/scratchpad/final'
import { mkdirSync } from 'node:fs'
mkdirSync(SHOTS, { recursive: true })

// Wait for the deploy: the target dial should render "2,725" with a comma.
const browser = await chromium.launch()
const ctx = await browser.newContext({ ...devices['iPhone 12'] })
await ctx.addCookies([
  { name: 'kp_access', value: 'raving', domain: 'pensioncalculator-fawn.vercel.app', path: '/' },
])
const page = await ctx.newPage()

let deployed = false
for (let i = 0; i < 24; i++) {
  await page.goto(`${BASE}/review`, { waitUntil: 'networkidle' })
  // step 2 is the target dial; navigate: click Next once from step 1
  const next = page.getByRole('button', { name: /Next/ })
  if (await next.count()) {
    await next.first().click()
    await page.waitForTimeout(400)
    const val = await page
      .getByLabel('Monthly income you would like')
      .inputValue()
      .catch(() => '')
    if (val.includes(',')) {
      deployed = true
      break
    }
  }
  await new Promise((r) => setTimeout(r, 10_000))
}
console.log('deploy live with comma dial:', deployed)
await page.screenshot({ path: `${SHOTS}/target-dial.png` })

// Pensions page sliders: thumb should sit ~10% along now, not at the far left.
for (let i = 0; i < 3; i++) {
  await page.getByRole('button', { name: /Next/ }).first().click()
  await page.waitForTimeout(300)
}
await page.screenshot({ path: `${SHOTS}/pensions-sliders.png` })

// The suggested-question auto-send, end to end. This costs one real request.
const ask = page.locator('button', { hasText: 'Not sure? Ask:' })
if (await ask.count()) {
  await ask.first().click()
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${SHOTS}/chat-opened.png` })
  // Wait for an assistant reply to stream in (up to 45s).
  const assistantText = page.locator('p.whitespace-pre-wrap')
  let ok = false
  for (let i = 0; i < 45; i++) {
    const n = await assistantText.count()
    if (n >= 2) {
      const t = (await assistantText.nth(1).textContent()) ?? ''
      if (t.trim().length > 40) {
        ok = true
        break
      }
    }
    await page.waitForTimeout(1000)
  }
  console.log('chat auto-send produced an answer:', ok)
  await page.screenshot({ path: `${SHOTS}/chat-answer.png` })
} else {
  console.log('no ask prompt on this page')
}

// /plan answers tab: new bigger thumbs.
await page.goto(`${BASE}/plan`, { waitUntil: 'networkidle' })
await page.getByRole('tab', { name: 'Your answers' }).click()
await page.waitForTimeout(600)
await page.screenshot({ path: `${SHOTS}/plan-answers.png` })

// /done: print button present?
await page.goto(`${BASE}/done`, { waitUntil: 'networkidle' })
const print = await page.getByRole('button', { name: /Print it/ }).count()
console.log('print button on /done:', print > 0)

await browser.close()
console.log('done — shots in', SHOTS)
