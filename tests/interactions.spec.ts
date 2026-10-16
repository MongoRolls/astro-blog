import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

async function search(page: Page, query: string) {
  await page.locator('#search-icon').click()
  await page.locator('#search-input').fill(query)
}

async function switchLanguage(page: Page, locale: string) {
  await page.keyboard.press('Escape')
  await page.locator('a[hreflang]').click()
  await expect(page.locator('html')).toHaveAttribute('lang', locale)
}

test.beforeEach(async ({ page }) => {
  // Keep the regression suite independent of analytics, images and comment services.
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1'
    ? route.continue()
    : route.abort())
})

for (const fallback of [false, true]) {
  test(`search follows client-side language switches (fallback: ${fallback})`, async ({ page }) => {
    if (fallback)
      await page.route('**/pagefind/**', route => route.abort())
    let fallbackRequests = 0
    page.on('request', (request) => {
      if (request.url().includes('/search-index.json'))
        fallbackRequests++
    })
    await page.goto('/')
    await page.evaluate(() => Object.assign(window, { navigationMarker: true }))
    await search(page, 'TypeScript')
    await expect(page.locator('.search-result a').first()).toBeVisible()
    await expect(page.locator('.search-result a').first()).toHaveAttribute('href', /^\/blog\//)
    await switchLanguage(page, 'en')
    await search(page, 'TypeScript')
    await expect(page.locator('.search-result a').first()).toBeVisible()
    for (const link of await page.locator('.search-result a').all())
      await expect(link).toHaveAttribute('href', /^\/en\//)
    await switchLanguage(page, 'zh-CN')
    await search(page, 'TypeScript')
    await expect(page.locator('.search-result a').first()).toHaveAttribute('href', /^\/blog\//)
    expect(await page.evaluate(() => (window as Window & { navigationMarker?: boolean }).navigationMarker)).toBe(true)
    expect(fallbackRequests).toBe(fallback ? 2 : 0)
  })
}

test('failed fallback loads can be retried without reloading the page', async ({ page }) => {
  await page.route('**/pagefind/**', route => route.abort())
  let attempts = 0
  await page.route('**/search-index.json', async (route) => {
    attempts++
    if (attempts === 1)
      await route.fulfill({ status: 503, body: 'Unavailable' })
    else
      await route.continue()
  })
  await page.goto('/')
  await search(page, 'TypeScript')
  await expect(page.locator('#results')).toContainText('搜索暂时不可用')
  await page.locator('#search-input').fill('')
  await page.locator('#search-input').fill('TypeScript')
  await expect(page.locator('.search-result a').first()).toBeVisible()
  expect(attempts).toBe(2)
})

test('search only loads one batch of details and ignores stale queries', async ({ page }) => {
  await page.route('**/pagefind/pagefind.js*', route => route.fulfill({
    contentType: 'text/javascript',
    body: `export function createInstance() {
      return { init: async () => {}, destroy: async () => {}, search: async (query) => {
        if (query === 'old') await new Promise(resolve => setTimeout(resolve, 800));
        return { results: Array.from({length: 45}, (_, i) => ({ data: async () => {
          window.detailCalls = (window.detailCalls || []).concat(query);
          return {excerpt:'example', meta:{title:query + ' ' + i}, url:'/blog/test-' + i + '/'};
        }})) };
      }};
    }`,
  }))
  await page.goto('/')
  await search(page, 'batch')
  await expect(page.locator('.search-result')).toHaveCount(20)
  await expect(page.locator('#results')).toContainText('找到 45 条结果')
  const detailCalls = () => page.evaluate(() => (window as Window & { detailCalls?: string[] }).detailCalls)
  expect(await detailCalls()).toHaveLength(20)
  await page.getByRole('button', { name: '加载更多', exact: true }).click()
  await expect(page.locator('.search-result')).toHaveCount(40)
  expect(await detailCalls()).toHaveLength(40)
  await page.getByRole('button', { name: '加载更多', exact: true }).click()
  await expect(page.locator('.search-result')).toHaveCount(45)
  await expect(page.getByRole('button', { name: '加载更多', exact: true })).toHaveCount(0)
  await page.locator('#search-input').fill('old')
  await page.waitForTimeout(400)
  await page.locator('#search-input').fill('new')
  await expect(page.locator('.search-result a').first()).toHaveText('new 0')
  await page.waitForTimeout(800)
  expect(await detailCalls()).not.toContain('old')
  await expect(page.locator('.search-result')).toHaveCount(20)
  await page.locator('#search-input').fill('')
  await expect(page.locator('.search-result')).toHaveCount(0)
  await expect(page.locator('#results')).not.toHaveAttribute('aria-busy', 'true')
})

test('typing demo rebinds after navigation and supports keyboard and reduced motion', async ({ page }) => {
  await page.goto('/blog/25-06-27-demo/')
  const typing = page.locator('.typing')
  await typing.focus()
  await page.keyboard.press('Enter')
  await expect(typing).toHaveAttribute('aria-pressed', 'true')
  await page.locator('a[hreflang]').click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await typing.click()
  await expect(typing).toHaveAttribute('aria-pressed', 'true')
  await page.goBack()
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')
  await typing.focus()
  await page.keyboard.press('Space')
  await expect(typing).toHaveAttribute('aria-pressed', 'true')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  expect(await typing.evaluate(element => getComputedStyle(element).animationName)).toBe('none')
})
