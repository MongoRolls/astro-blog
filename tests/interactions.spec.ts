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

test('blog and post index pages render all posts without pagination and avoid overflow', async ({ page }) => {
  for (const { blogPath, postPath, paginationLabel, blogHeading, postHeading } of [
    { blogPath: '/blog/', postPath: '/post/', paginationLabel: '分页导航', blogHeading: '图文阅读', postHeading: '全部归档' },
    { blogPath: '/en/blog/', postPath: '/en/post/', paginationLabel: 'Pagination', blogHeading: 'Reading Feed', postHeading: 'Archive' },
  ]) {
    await page.goto(blogPath)
    await expect(page.locator('nav .nav-link[href*="/projects/"], nav .nav-link[href*="/tags/"]')).toHaveCount(0)
    await expect(page.locator(`nav[aria-label="${paginationLabel}"]`)).toHaveCount(0)
    await expect(page.locator('main h1.sr-only')).toHaveCount(1)
    await expect(page.getByRole('heading', { level: 2, name: blogHeading })).toBeVisible()
    const blogPostsCount = await page.locator('main article.post-feed-item').count()
    expect(blogPostsCount).toBeGreaterThan(6)
    await expect(page.locator('.section-head .section-count')).toHaveText(String(blogPostsCount))

    await page.goto(postPath)
    await expect(page.locator(`nav[aria-label="${paginationLabel}"]`)).toHaveCount(0)
    await expect(page.locator('main h1.sr-only')).toHaveCount(1)
    await expect(page.getByRole('heading', { level: 2, name: postHeading })).toBeVisible()
    await expect(page.locator('.section-head .section-count')).toHaveText(String(blogPostsCount))
    const items = page.locator('.archive-item')
    await expect(items).toHaveCount(blogPostsCount)
    await expect(page.locator('span.archive-tag').first()).toBeVisible()
    await expect(page.locator('a.archive-tag')).toHaveCount(0)
    await expect(page.locator('.archive-date time').first()).toHaveText(/^\d{4}-\d{2}-\d{2}$/)

    for (const viewport of [{ width: 1280, height: 800 }, { width: 375, height: 812 }]) {
      await page.setViewportSize(viewport)
      const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
      expect(hasHorizontalOverflow).toBe(false)
    }
  }

  for (const removedPath of ['/blog/2/', '/projects/', '/en/projects/', '/tags/', '/en/tags/']) {
    const response = await page.goto(removedPath)
    expect(response?.status()).toBe(404)
  }
})

test('friends and reading page displays both message card sections without overflow', async ({ page }) => {
  for (const { path, friendsHeading, readingHeading } of [
    { path: '/friends/', friendsHeading: '认识的朋友', readingHeading: '在看的博客' },
    { path: '/en/friends/', friendsHeading: 'People I Know', readingHeading: 'Blogs I Read' },
  ]) {
    await page.goto(path)
    await expect(page.locator('nav.toc')).toHaveCount(0)
    await expect(page.locator('main h1.sr-only')).toHaveCount(1)
    await expect(page.locator('.friends-header, .friends-anchors')).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 2, name: friendsHeading })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: readingHeading })).toBeVisible()
    await expect(page.locator('section[aria-labelledby="friends"] .info-card')).toHaveCount(3)
    await expect(page.locator('section[aria-labelledby="reading"] .info-card')).toHaveCount(4)
    await expect(page.locator('.info-card-rss').first()).toHaveAttribute('href', /^https:\/\//)
    await expect(page.locator('.site-info-card .site-copy-button')).toBeVisible()

    for (const viewport of [{ width: 1280, height: 800 }, { width: 375, height: 812 }]) {
      await page.setViewportSize(viewport)
      const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
      expect(hasHorizontalOverflow).toBe(false)
    }
  }

  for (const nonArticlePath of ['/', '/about/', '/en/about/', '/post/', '/blog/']) {
    await page.goto(nonArticlePath)
    await expect(page.locator('nav.toc')).toHaveCount(0)
  }

  await page.setViewportSize({ width: 1280, height: 800 })
  const firstHeadingTops: number[] = []
  for (const [routePath, selector] of [
    ['/', 'main h1'],
    ['/post/', 'main h2.section-title'],
    ['/blog/', 'main h2.section-title'],
    ['/friends/', 'main h2.section-title'],
    ['/about/', 'main h2#about-me'],
  ] as const) {
    await page.goto(routePath)
    const top = await page.locator(selector).first().evaluate(el => Math.round(el.getBoundingClientRect().top))
    firstHeadingTops.push(top)
  }
  expect(new Set(firstHeadingTops).size).toBe(1)

  await page.goto('/blog/26-08-21-ai-text-watermarking/')
  await expect(page.locator('nav.toc')).toHaveCount(1)
  await expect(page.locator('.related-section .related-item')).toHaveCount(5)
  await expect(page.locator('.related-section a.card')).toHaveCount(0)
  await expect(page.locator('.post-pager-prev')).toBeVisible()
  await expect(page.locator('[data-random-post]')).toHaveAttribute('href', /^\/blog\/.+\/$/)
  await expect(page.locator('footer a[href*="qq.com"], footer a:has-text("QQ")')).toHaveCount(0)

  await page.goto('/blog/26-08-13-ai-tools/')
  const copyButton = page.locator('.code-copy-button').first()
  await expect(copyButton).toBeVisible()
  await expect(copyButton).toHaveText('')
  await expect(copyButton.locator('svg')).toHaveCount(1)
  await expect(copyButton).toHaveAttribute('aria-label', '复制代码')
})

test('about page displays now updates, book and game media cards, and heading anchors without overflow', async ({ page }) => {
  for (const { path, expectedBooks, expectedGames } of [
    { path: '/about/', expectedBooks: ['思考，快与慢', '纳瓦尔宝典'], expectedGames: ['影之刃零', '深空当铺'] },
    { path: '/en/about/', expectedBooks: ['Thinking, Fast and Slow', 'The Almanack of Naval Ravikant'], expectedGames: ['Phantom Blade Zero', 'Probably Stolen'] },
  ]) {
    await page.goto(path)
    await expect(page.locator('nav.toc')).toHaveCount(0)
    await expect(page.locator('.about-now-item')).toHaveCount(4)

    const nowHeading = page.locator('h2#about-me-now')
    const nowAnchor = nowHeading.locator('.heading-anchor')
    await expect(nowAnchor).toHaveAttribute('href', '#about-me-now')
    await nowHeading.hover()
    await expect(nowAnchor).toHaveCSS('opacity', '1')

    const bookCards = page.locator('section[aria-labelledby="about-me-books"] .media-card')
    await expect(bookCards).toHaveCount(2)
    await expect(bookCards.locator('.media-card-badge')).toHaveText(['Book', 'Book'])
    await expect(bookCards.locator('.media-card-title')).toHaveText(expectedBooks)

    const gameCards = page.locator('section[aria-labelledby="about-me-games"] .media-card')
    await expect(gameCards).toHaveCount(2)
    await expect(gameCards.locator('.media-card-badge')).toHaveText(['Game', 'Game'])
    await expect(gameCards.locator('.media-card-title')).toHaveText(expectedGames)
    await expect(gameCards.locator('.media-card-link').first()).toHaveAttribute('href', /^https:\/\/store\.steampowered\.com\/app\//)

    for (const viewport of [{ width: 1280, height: 800 }, { width: 375, height: 812 }]) {
      await page.setViewportSize(viewport)
      const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
      expect(hasHorizontalOverflow).toBe(false)
    }
  }
})

test('dark mode persists across ClientRouter navigations, language switches, and reload', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/')
  await page.evaluate(() => Object.assign(window, { themeNavMarker: true }))

  await expect(page.locator('html')).not.toHaveClass(/\bdark\b/)
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)')

  await page.locator('#theme-toggle').click()
  await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(30, 30, 46)')

  // Soft navigate to blog feed, then article detail, then switch locale
  await page.locator('nav .nav-link[href="/blog/"]').click()
  await expect(page).toHaveURL(/\/blog\/$/)
  await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(30, 30, 46)')

  await page.locator('.feed-title-link').first().click()
  await expect(page).toHaveURL(/\/blog\/.+\/$/)
  await expect(page.locator('html')).toHaveClass(/\bdark\b/)

  await page.locator('a[hreflang]').click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  expect(await page.evaluate(() => (window as Window & { themeNavMarker?: boolean }).themeNavMarker)).toBe(true)

  // Hard reload still preserves dark theme
  await page.reload()
  await expect(page.locator('html')).toHaveClass(/\bdark\b/)

  // Toggle back to light and verify soft nav keeps light theme
  await page.locator('#theme-toggle').click()
  await expect(page.locator('html')).not.toHaveClass(/\bdark\b/)
  await page.locator('nav .nav-link[href="/en/post/"]').click()
  await expect(page).toHaveURL(/\/en\/post\/$/)
  await expect(page.locator('html')).not.toHaveClass(/\bdark\b/)
})

test('fonts, hero dimensions, and reading-time consistency match expectations', async ({ page }) => {
  await page.goto('/')

  const heroImg = page.locator('img.hero-image')
  await expect(heroImg).toHaveAttribute('width', '1600')
  await expect(heroImg).toHaveAttribute('height', '901')

  const bodyFont = await page.locator('body').evaluate(el => getComputedStyle(el).fontFamily)
  const headingFont = await page.locator('h1').first().evaluate(el => getComputedStyle(el).fontFamily)
  expect(bodyFont).toContain('Inter Variable')
  expect(headingFont).toContain('Newsreader Variable')

  // Verify reading time matches between /blog/ preview card and article detail page
  await page.goto('/blog/')
  const targetCard = page.locator('article.post-feed-item', { has: page.locator('a[href="/blog/26-02-25-typescript/"]') })
  const feedStatsText = await targetCard.locator('.feed-stats').textContent()
  const feedMinutes = feedStatsText?.match(/(\d+)\s*分钟/)?.[1]
  expect(feedMinutes).toBeTruthy()

  await page.goto('/blog/26-02-25-typescript/')
  const detailText = await page.locator('article header').textContent()
  const detailMinutes = detailText?.match(/(\d+)\s*分钟阅读/)?.[1]
  expect(detailMinutes).toBe(feedMinutes)

  // Verify Tailwind v4 prose typography rules (headings, blockquote serif, Shiki code monospace)
  await page.goto('/style/')
  const proseHeadingFont = await page.locator('.prose h2').first().evaluate(el => getComputedStyle(el).fontFamily)
  const proseParagraphFont = await page.locator('.prose > p').first().evaluate(el => getComputedStyle(el).fontFamily)
  const proseBlockquoteFont = await page.locator('.prose blockquote p').first().evaluate(el => getComputedStyle(el).fontFamily)
  const proseCodeTokenFont = await page.locator('.prose pre code span').first().evaluate(el => getComputedStyle(el).fontFamily)
  expect(proseHeadingFont).toContain('Newsreader Variable')
  expect(proseParagraphFont).toContain('Inter Variable')
  expect(proseBlockquoteFont).toContain('Newsreader Variable')
  expect(proseCodeTokenFont).toContain('Fira Code')
})
