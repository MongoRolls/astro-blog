import { expect, test } from '@playwright/test'

const standalone = '/widgets/weather-bottle/index.html'
const forecast = { available: true, place: 'Test city', country: 'CN', temperature: 12.5, humidity: 63, code: 61, isDay: true }
test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1'
    ? route.continue()
    : route.abort())
})

for (const [path, locale, condition, humidity] of [['/', 'zh-CN', '雨', '湿度'], ['/en/', 'en', 'Rain', 'Humidity']]) {
  test(`home card presents real readings in ${locale} and fits a narrow viewport`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 650 })
    await page.route('**/api/weather', route => route.fulfill({ json: { ...forecast, observedAt: Date.now() } }))
    await page.goto(path)
    const card = page.locator('blog-weather')
    await card.scrollIntoViewIfNeeded()
    await expect(card).toHaveAttribute('lang', locale)
    await expect(card.getByRole('heading')).toHaveText('Test city · CN')
    await expect(card.locator('[data-temperature]')).toHaveText('12.5°C')
    await expect(card.locator('[data-condition]')).toHaveText(condition)
    await expect(card.locator('[data-detail]')).toContainText(`${humidity} 63%`)
    await expect(card.getByRole('link')).toHaveAttribute('href', 'https://open-meteo.com/')
    const bounds = await card.evaluate(el => ({ scroll: el.scrollWidth, width: el.clientWidth, right: el.getBoundingClientRect().right }))
    expect(bounds.scroll).toBeLessThanOrEqual(bounds.width)
    expect(bounds.right).toBeLessThanOrEqual(320)
    await expect(card.locator('canvas')).toHaveCount(0)
  })
}

test('standalone link supports language and theme offline without requesting weather', async ({ page }) => {
  let requests = 0
  page.on('request', (req) => {
    if (req.url().endsWith('/api/weather'))
      requests++
  })
  await page.goto(`${standalone}?lang=en&theme=dark`)
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect(page.getByRole('region', { name: 'Local weather' })).toContainText('Weather unavailable')
  await expect(page.locator('[data-temperature]')).toBeHidden()
  expect(requests).toBe(0)
})

test('standalone recovers on refresh and drops stale readings', async ({ page }) => {
  const start = new Date('2026-11-18T12:00:00Z')
  await page.clock.install({ time: start })
  let requests = 0
  await page.route('**/api/weather', (route) => {
    requests++
    return route.fulfill({ json: requests === 1
      ? { available: false }
      : { ...forecast, code: 0, isDay: false, observedAt: requests === 2 ? +start + 900_000 : 1 } })
  })
  await page.goto(`${standalone}?lang=en&live=1`)
  const card = page.locator('blog-weather')
  await expect.poll(() => requests).toBe(1)
  await expect(card.locator('[data-temperature]')).toBeHidden()
  await page.clock.fastForward(901_000)
  await expect(card.locator('[data-condition]')).toHaveText('Clear')
  await expect(card).toHaveAttribute('data-night', '')
  await page.clock.fastForward(901_000)
  await expect(card.locator('[data-condition]')).toHaveText('Weather unavailable')
  await expect(card.locator('[data-temperature]')).toBeHidden()
  await expect(card.getByRole('link')).toHaveCount(0)
})

test('Astro navigation remounts one localized card and fetches once per visit', async ({ page }) => {
  let requests = 0
  await page.route('**/api/weather', (route) => {
    requests++
    return route.fulfill({ json: { ...forecast, observedAt: Date.now() } })
  })
  await page.goto('/')
  const card = page.locator('blog-weather')
  await card.scrollIntoViewIfNeeded()
  await expect(card.locator('[data-condition]')).toHaveText('雨')
  await page.locator('a[hreflang]').click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await card.scrollIntoViewIfNeeded()
  await expect(card.locator('[data-condition]')).toHaveText('Rain')
  await expect(card).toHaveCount(1)
  expect(requests).toBe(2)
})
