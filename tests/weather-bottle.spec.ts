import type { Page } from '@playwright/test'
import type { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import process from 'node:process'
import { expect, test } from '@playwright/test'

// Use the actual pinned library. Cache it once; no fake WebGL or substitute scene.
let three: Buffer
const source = 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js'
const sourcePattern = `${source}*`
const sha256 = 'ce1fa418de16a19495a9f72495580e3015d7745c296d3ce0485897f902ddedfb'
const route = '/widgets/weather-bottle/index.html?debug=1'

test.beforeAll(async ({ request }) => {
  if (process.env.WEATHER_THREE_FIXTURE) {
    three = await readFile(process.env.WEATHER_THREE_FIXTURE)
  }
  else {
    const response = await request.get(source)
    expect(response.ok()).toBe(true)
    three = await response.body()
  }
  expect(createHash('sha256').update(three).digest('hex')).toBe(sha256)
})

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 460, height: 680 })
  await page.route(sourcePattern, request => request.fulfill({ body: three, contentType: 'text/javascript' }))
  await page.route('https://unpkg.com/**', request => request.abort())
})

async function ready(page: Page, url = route) {
  await page.goto(url)
  await expect(page.locator('[data-weather-scene]')).toHaveAttribute('data-state', 'ready', { timeout: 30000 })
}

async function state(page: Page) {
  return page.evaluate(() => (document.querySelector('[data-weather-scene]') as any).__weatherBottle.snapshot())
}

async function advance(page: Page, seconds: number) {
  const target = (await state(page)).time + seconds
  await expect.poll(async () => (await state(page)).time, { timeout: 60000, intervals: [200] }).toBeGreaterThan(target)
}

test('bottle physics, precipitation, accumulation, melting and bounded extreme tilt', async ({ page }) => {
  test.setTimeout(120000)
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  await ready(page)
  await advance(page, 1.5)
  let s = await state(page)
  expect(s.snowHits).toBeGreaterThan(0)
  expect(s.snowCover).toBeGreaterThan(0)
  expect(s.melted).toBeGreaterThan(0)
  await page.locator('[data-bottle-part=stage]').focus()
  for (let i = 0; i < 9; i++)
    await page.keyboard.press('ArrowDown')
  for (let i = 0; i < 12; i++)
    await page.keyboard.press('ArrowRight')
  await page.locator('[data-bottle-part=shake]').click()
  expect((await state(page)).shakeEnergy).toBeGreaterThan(0.3)
  await advance(page, 6)
  s = await state(page)
  expect(Math.hypot(s.tiltX, s.tiltZ)).toBeLessThanOrEqual(0.341)
  expect(s.normalWorld[1]).toBeGreaterThan(0.995)
  expect(s.water.minY).toBeGreaterThan(-1.34)
  expect(s.water.maxY).toBeLessThan(0.1)
  expect(s.water.maxR).toBeLessThan(1.01)
  expect(s.boat.outside).toBe(0)
  expect(s.snowOutside).toBe(0)
  expect(s.boat.y - s.boat.waterY).toBeCloseTo(0.035, 5)
  await page.locator('[data-weather=rain]').click()
  await advance(page, 2.5)
  expect((await state(page)).rainMix).toBeGreaterThan(0.98)
  expect((await state(page)).rippleHits).toBeGreaterThan(0)
  await page.locator('[data-weather=storm]').click()
  await advance(page, 3)
  s = await state(page)
  expect(s.flashCount).toBeGreaterThan(0)
  expect(s.drawCalls).toBeLessThan(90)
  expect(s.triangles).toBeLessThan(40000)
  expect(errors).toEqual([])
})

test('surface wipes are continuous and isolated from rotation; rapid reversals stir snow', async ({ page }) => {
  test.setTimeout(90000)
  await ready(page)
  await page.locator('[data-bottle-part=pause]').click()
  const before = await state(page)
  await page.locator('[data-mode=wipe]').click()
  const box = (await page.locator('[data-bottle-part=stage]').boundingBox())!
  const x = box.x + box.width / 2
  const y = box.y + box.height * 0.55
  await page.mouse.move(x - 18, y - 25)
  await page.mouse.down()
  await page.mouse.move(x + 18, y + 25, { steps: 12 })
  await page.mouse.up()
  let s = await state(page)
  expect(s.fogMean).toBeLessThan(before.fogMean - 0.5)
  expect(s.fogMean).toBeGreaterThan(230)
  expect(s.wipeCount).toBeGreaterThan(6)
  expect(s.yaw).toBe(before.yaw)
  const hits = s.wipeCount
  await page.mouse.move(2, box.y + 10)
  await page.mouse.down()
  await page.mouse.move(5, box.y + 40)
  await page.mouse.up()
  expect((await state(page)).wipeCount).toBe(hits)
  await page.locator('[data-mode=observe]').click()
  await page.locator('[data-bottle-part=pause]').click()
  // Dispatch a real browser pointer sequence with explicit fast timing, independent of GPU speed.
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.locator('[data-bottle-part=stage]').evaluate((el) => {
    for (const clientX of [260, 210, 270, 200, 260])
      el.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientX, clientY: 310, bubbles: true }))
  })
  await page.mouse.up()
  s = await state(page)
  expect(s.shakeEnergy).toBeGreaterThan(0.3)
  expect(s.wipeCount).toBe(hits)
})

test('touch observe and wipe work at 320px; resize and reduced motion remain usable', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 320, height: 700 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.route(sourcePattern, r => r.fulfill({ body: three, contentType: 'text/javascript' }))
  await ready(page)
  expect((await state(page)).paused).toBe(true)
  expect((await state(page)).particles).toBe(280)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320)
  const session = await context.newCDPSession(page)
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 160, y: 300 }] })
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 200, y: 350 }] })
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await expect.poll(async () => (await state(page)).yaw).not.toBe(0.12)
  await page.locator('[data-mode=wipe]').tap()
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 160, y: 350 }] })
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 170, y: 375 }] })
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  expect((await state(page)).wipeCount).toBeGreaterThan(0)
  await page.setViewportSize({ width: 760, height: 600 })
  await expect.poll(async () => (await state(page)).width).toBe(760)
  expect((await state(page)).boat.outside).toBe(0)
  await context.close()
})

test('local weather maps clear, cloud, fog, rain, snow and thunder without browser permissions', async ({ page }) => {
  test.setTimeout(120000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(() => {
    navigator.geolocation.getCurrentPosition = () => {
      throw new Error('must not request precise location')
    }
  })
  for (const [code, expected] of [[0, 'clear'], [3, 'cloud'], [45, 'fog'], [63, 'rain'], [75, 'snow'], [95, 'storm']] as const) {
    await page.route('**/api/weather', r => r.fulfill({ json: { available: true, temperature: 16.2, humidity: 73, code, observedAt: Date.now(), fetchedAt: Date.now(), place: 'Test city', country: 'CN' } }))
    await ready(page, `${route}&live=1`)
    await expect.poll(async () => (await state(page)).weather).toBe(expected)
    await expect(page.locator('[data-bottle-part=weather-data]')).toContainText('16°C')
    await expect(page.locator('[data-bottle-part=weather-data]')).toContainText('73%')
    await expect(page.locator('[data-bottle-part=weather-source]')).toContainText('IP')
    await page.unroute('**/api/weather')
  }
})

test('late weather never overrides a manual choice; unavailable weather remains a labelled default', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  let release: () => void = () => {}
  const waiting = new Promise<void>(resolve => release = resolve)
  await page.route('**/api/weather', async (r) => {
    await waiting
    await r.fulfill({ json: { available: true, temperature: 20, humidity: 50, code: 0, place: 'Test', observedAt: Date.now(), fetchedAt: Date.now() } }).catch(() => {})
  })
  await ready(page, `${route}&live=1`)
  await page.locator('[data-weather=rain]').click()
  release()
  await page.waitForTimeout(200)
  expect((await state(page)).weather).toBe('rain')
  expect((await state(page)).liveMode).toBe(false)
  await page.unroute('**/api/weather')
  await page.route('**/api/weather', r => r.fulfill({ status: 503, body: 'unavailable' }))
  await ready(page, `${route}&live=1&lang=en`)
  await expect(page.locator('[data-bottle-part=weather-data]')).toHaveText('Default scene · Demo weather')
  await expect(page.locator('[data-bottle-part=weather-data]')).not.toContainText('°C')
  expect((await state(page)).weather).toBe('snow')
})

test('CDN and unsupported WebGL errors are explicit and retryable', async ({ page }) => {
  await page.route(sourcePattern, r => r.abort())
  await page.goto(route)
  await expect(page.locator('[data-weather-scene]')).toHaveAttribute('data-state', 'error')
  await expect(page.locator('[data-bottle-part=message-text]')).toContainText('Three.js 加载失败')
  await expect(page.locator('[data-bottle-part=retry]')).toBeVisible()
  await page.unroute(sourcePattern)
  await page.route(sourcePattern, r => r.fulfill({ body: three, contentType: 'text/javascript' }))
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string, ...args: any[]) {
      if (kind === 'webgl2')
        return null
      return getContext.call(this, kind as any, ...args)
    } as typeof getContext
  })
  await page.goto(route)
  await expect(page.locator('[data-weather-scene]')).toHaveAttribute('data-state', 'error')
  await expect(page.locator('[data-bottle-part=message-text]')).toContainText('WebGL 2')
})

async function nativeReady(page: Page, url = '/?debug=1') {
  await page.goto(url)
  await page.locator('[data-weather-scene]').scrollIntoViewIfNeeded()
  await expect(page.locator('[data-weather-scene]')).toHaveAttribute('data-state', 'ready', { timeout: 30000 })
}

test('native scene appears on scroll and supports weather, wiping, theme and offscreen suspension', async ({ page }) => {
  test.setTimeout(90000)
  await page.setViewportSize({ width: 1100, height: 800 })
  await page.route('**/api/weather', r => r.fulfill({ json: { available: false } }))
  let libraryLoads = 0
  page.on('request', (request) => {
    if (request.url().startsWith(source))
      libraryLoads++
  })
  await page.goto('/?debug=1')
  await expect(page.locator('[data-weather-scene]')).toHaveAttribute('data-state', 'waiting')
  expect(libraryLoads).toBe(0)
  await expect(page.locator('.weather-bottle iframe, .bottle-open')).toHaveCount(0)
  await page.locator('[data-weather-scene]').scrollIntoViewIfNeeded()
  await expect(page.locator('[data-weather-scene]')).toHaveAttribute('data-state', 'ready', { timeout: 30000 })
  expect(page.frames()).toHaveLength(1)
  await expect(page.locator('[data-bottle-part=stage] canvas')).toHaveCount(1)
  await page.locator('[data-weather=rain]').click()
  await advance(page, 2)
  expect((await state(page)).rippleHits).toBeGreaterThan(0)
  await page.locator('[data-bottle-part=pause]').click()
  await page.locator('[data-mode=wipe]').click()
  const box = (await page.locator('[data-bottle-part=stage]').boundingBox())!
  const before = await state(page)
  await page.mouse.move(box.x + box.width / 2 - 20, box.y + box.height * 0.5)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + 20, box.y + box.height * 0.6, { steps: 10 })
  await page.mouse.up()
  expect((await state(page)).wipeCount).toBeGreaterThan(5)
  expect((await state(page)).yaw).toBe(before.yaw)
  await page.locator('[data-mode=observe]').click()
  await page.locator('[data-bottle-part=pause]').click()
  await page.locator('[data-bottle-part=stage]').focus()
  await page.keyboard.press('ArrowDown')
  await advance(page, 0.5)
  expect(Math.abs((await state(page)).tiltX)).toBeGreaterThan(0.02)
  expect((await state(page)).boat.outside).toBe(0)
  await page.locator('[data-weather-scene]').screenshot({ path: 'test-results/weather-native-desktop.png' })
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect.poll(async () => (await state(page)).outside).toBe(true)
  const frames = (await state(page)).rendered
  await page.waitForTimeout(350)
  expect((await state(page)).rendered).toBe(frames)
  await page.locator('#theme-toggle').click()
  await expect(page.locator('[data-weather-scene]')).toHaveClass(/dark/)
  await page.locator('[data-weather-scene]').scrollIntoViewIfNeeded()
  await expect.poll(async () => (await state(page)).rendered).toBeGreaterThan(frames)
  await page.locator('[data-weather-scene]').screenshot({ path: 'test-results/weather-native-dark.png' })
})

test('Astro navigation disposes native GPU scenes and remounts once on return', async ({ page }) => {
  test.setTimeout(90000)
  await page.route('**/api/weather', r => r.fulfill({ json: { available: false } }))
  await nativeReady(page)
  await page.evaluate(() => {
    const host = document.querySelector('[data-weather-scene]') as any
    ;(window as any).oldBottle = host
    ;(window as any).navigationMarker = true
  })
  await page.locator('a[hreflang]').click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  expect(await page.evaluate(() => (window as any).navigationMarker)).toBe(true)
  expect(await page.evaluate(() => (window as any).oldBottle.__weatherBottle.snapshot().disposed)).toBe(true)
  expect(await page.evaluate(() => (window as any).oldBottle.querySelectorAll('canvas').length)).toBe(0)
  const frames = await page.evaluate(() => (window as any).oldBottle.__weatherBottle.snapshot().rendered)
  await page.locator('[data-weather-scene]').scrollIntoViewIfNeeded()
  await expect(page.locator('[data-weather-scene]')).toHaveAttribute('data-state', 'ready', { timeout: 30000 })
  await expect(page.locator('[data-weather-scene] h2')).toHaveText('A bottle of weather')
  await page.evaluate(() => {
    for (let i = 0; i < 4; i++)
      document.dispatchEvent(new Event('astro:page-load'))
  })
  await expect(page.locator('[data-bottle-part=stage] canvas')).toHaveCount(1)
  expect(await page.evaluate(() => (window as any).oldBottle.__weatherBottle.snapshot().rendered)).toBe(frames)
  await page.goBack()
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')
  await page.locator('[data-weather-scene]').scrollIntoViewIfNeeded()
  await expect(page.locator('[data-weather-scene]')).toHaveAttribute('data-state', 'ready', { timeout: 30000 })
  await expect(page.locator('[data-bottle-part=stage] canvas')).toHaveCount(1)
  await page.locator('[data-weather=storm]').click()
  expect((await state(page)).weather).toBe('storm')
})

test('pending CDN load cannot initialize a scene after Astro navigation', async ({ page }) => {
  test.setTimeout(60000)
  let release: () => void = () => {}
  const waiting = new Promise<void>(resolve => release = resolve)
  await page.route(sourcePattern, async (r) => {
    await waiting
    await r.fulfill({ body: three, contentType: 'text/javascript' }).catch(() => {})
  })
  await page.route('**/api/weather', r => r.fulfill({ json: { available: false } }))
  await page.goto('/?debug=1')
  await page.locator('[data-weather-scene]').scrollIntoViewIfNeeded()
  await expect(page.locator('[data-weather-scene]')).toHaveAttribute('data-state', 'loading')
  await page.evaluate(() => {
    (window as any).oldBottle = document.querySelector('[data-weather-scene]')
  })
  await page.locator('a[hreflang]').click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  release()
  await page.locator('[data-weather-scene]').scrollIntoViewIfNeeded()
  await expect(page.locator('[data-weather-scene]')).toHaveAttribute('data-state', 'ready', { timeout: 30000 })
  expect(await page.evaluate(() => (window as any).oldBottle.dataset.state)).toBe('disposed')
  expect(await page.evaluate(() => (window as any).oldBottle.querySelectorAll('canvas').length)).toBe(0)
  await expect(page.locator('[data-bottle-part=stage] canvas')).toHaveCount(1)
})

test('native local weather and CDN retry stay in the page', async ({ page }) => {
  test.setTimeout(60000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route(sourcePattern, r => r.abort())
  await page.goto('/?debug=1')
  await page.evaluate(() => {
    (window as any).navigationMarker = true
  })
  await page.locator('[data-weather-scene]').scrollIntoViewIfNeeded()
  await expect(page.locator('[data-weather-scene]')).toHaveAttribute('data-state', 'error')
  await page.unroute(sourcePattern)
  await page.route(sourcePattern, r => r.fulfill({ body: three, contentType: 'text/javascript' }))
  await page.route('**/api/weather', r => r.fulfill({ json: { available: true, temperature: 21, humidity: 65, code: 0, observedAt: Date.now(), fetchedAt: Date.now(), place: 'Test city', country: 'CN' } }))
  await page.locator('[data-bottle-part=retry]').click()
  await expect(page.locator('[data-weather-scene]')).toHaveAttribute('data-state', 'ready', { timeout: 30000 })
  await expect(page.locator('[data-bottle-part=weather-data]')).toContainText('21°C')
  expect((await state(page)).weather).toBe('clear')
  expect(await page.evaluate(() => (window as any).navigationMarker)).toBe(true)
  await page.locator('[data-weather=snow]').click()
  expect((await state(page)).liveMode).toBe(false)
  await expect(page.locator('[data-bottle-part=weather-data]')).toContainText('演示场景')
  await page.locator('[data-bottle-part=live]').click()
  expect((await state(page)).liveMode).toBe(true)
})

test('native mobile gestures allow scrolling, observing and isolated wiping at 320px', async ({ browser }) => {
  test.setTimeout(60000)
  const context = await browser.newContext({ viewport: { width: 320, height: 700 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.route(sourcePattern, r => r.fulfill({ body: three, contentType: 'text/javascript' }))
  await page.route('**/api/weather', r => r.fulfill({ json: { available: false } }))
  await nativeReady(page)
  const stage = page.locator('[data-bottle-part=stage]')
  await stage.scrollIntoViewIfNeeded()
  let box = (await stage.boundingBox())!
  const cdp = await context.newCDPSession(page)
  async function swipe(x: number, y: number, dx: number, dy: number) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
    for (let i = 1; i <= 6; i++)
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + dx * i / 6, y: y + dy * i / 6 }] })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  }
  const before = await state(page)
  await swipe(160, box.y + box.height * 0.55, 60, 2)
  await expect.poll(async () => (await state(page)).yaw).not.toBe(before.yaw)
  const scroll = await page.evaluate(() => scrollY)
  await swipe(160, box.y + box.height * 0.7, 0, -100)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(scroll + 20)
  await page.locator('[data-mode=wipe]').tap()
  box = (await stage.boundingBox())!
  const rotation = (await state(page)).yaw
  const wipeScroll = await page.evaluate(() => scrollY)
  await swipe(160, box.y + box.height * 0.5, 12, 35)
  expect((await state(page)).wipeCount).toBeGreaterThan(1)
  expect((await state(page)).yaw).toBe(rotation)
  expect(await page.evaluate(() => scrollY)).toBe(wipeScroll)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320)
  // The wipe hint can wrap to a new line; read both rectangles in the same layout.
  await expect.poll(() => page.evaluate(() => {
    const stage = document.querySelector('[data-bottle-part=stage]')!.getBoundingClientRect()
    const controls = document.querySelector('.weather-scene .controls')!.getBoundingClientRect()
    return controls.top - stage.bottom
  })).toBeGreaterThanOrEqual(10)
  await page.locator('[data-weather-scene]').screenshot({ path: 'test-results/weather-native-mobile.png' })
  await page.setViewportSize({ width: 700, height: 700 })
  await expect.poll(async () => (await state(page)).width).toBeGreaterThan(500)
  expect((await state(page)).boat.outside).toBe(0)
  await context.close()
})
