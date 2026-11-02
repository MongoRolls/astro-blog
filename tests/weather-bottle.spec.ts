import type { Page } from '@playwright/test'
import type { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import process from 'node:process'
import { expect, test } from '@playwright/test'

// Exercise the actual pinned Three.js, WebGL and geometry, with simulated weather only.
let three: Buffer
const source = 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js'
const sourcePattern = `${source}*`
const sha256 = 'ce1fa418de16a19495a9f72495580e3015d7745c296d3ce0485897f902ddedfb'
const standalone = '/widgets/weather-bottle/index.html?debug=1'
const host = '[data-weather-scene]'
const stage = '[data-bottle-part=stage]'

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
  await page.route(sourcePattern, r => r.fulfill({ body: three, contentType: 'text/javascript' }))
  await page.route('https://unpkg.com/**', r => r.abort())
  await page.route('**/api/weather', r => r.fulfill({ json: { available: false } }))
})

async function ready(page: Page, url = standalone) {
  await page.goto(url)
  await page.locator(host).scrollIntoViewIfNeeded()
  await expect(page.locator(host)).toHaveAttribute('data-state', 'ready', { timeout: 30000 })
}

async function state(page: Page) {
  return page.evaluate(() => (document.querySelector('[data-weather-scene]') as any).__weatherBottle.snapshot())
}

async function advance(page: Page, seconds: number) {
  const target = (await state(page)).time + seconds
  await expect.poll(async () => (await state(page)).time, { timeout: 60000, intervals: [200] }).toBeGreaterThan(target)
}

async function weather(page: Page, code: number, url = `${standalone}&live=1`) {
  await page.unroute('**/api/weather')
  await page.route('**/api/weather', r => r.fulfill({ json: { available: true, temperature: 21, humidity: 65, code, observedAt: Date.now(), fetchedAt: Date.now(), place: 'Test city', country: 'CN' } }))
  await ready(page, url)
  await expect.poll(async () => (await state(page)).liveMode).toBe(true)
}

async function shake(page: Page) {
  const box = (await page.locator(stage).boundingBox())!
  const x = box.x + box.width / 2
  const y = box.y + box.height * 0.53
  await page.mouse.move(x, y)
  await page.mouse.down()
  // A fast real pointer sequence, independent of software GPU frame timing.
  await page.locator(stage).evaluate((el, { x, y }) => {
    for (const dx of [55, -40, 65, -45, 50])
      el.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientX: x + dx, clientY: y, bubbles: true }))
  }, { x, y })
  await page.mouse.up()
}

test('sunlight is the quiet default, with no visual controls and real canvas alpha', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await ready(page)
  expect((await state(page)).weather).toBe('clear')
  expect((await state(page)).clearMix).toBe(1)
  await expect(page.locator(`${host} button, ${host} header, ${host} .controls, ${host} .local-weather`)).toHaveCount(0)
  await expect(page.locator('[data-bottle-part=message]')).toBeHidden()
  const alpha = await page.evaluate(() => (document.querySelector('[data-weather-scene]') as any).__weatherBottle.transparency())
  expect(alpha.cornerAlphas).toEqual([0, 0, 0, 0])
  // The taller standalone view frames the bottle more tightly than the homepage.
  expect(alpha.clearRatio).toBeGreaterThan(0.45)
  expect(alpha.solidRatio).toBeLessThan(0.1)
  expect(alpha.translucentRatio).toBeGreaterThan(0.03)
  expect(alpha.solidRatio).toBeGreaterThan(0.005)
  expect(alpha.glassAirAlpha).toBeGreaterThan(0)
  expect(alpha.glassAirAlpha).toBeLessThan(100)
  await expect(page.locator(stage)).toHaveAttribute('aria-describedby', /weather-bottle-hint/)
})

test('water, boat and snow remain bounded during extreme tilt and rapid shaking', async ({ page }) => {
  test.setTimeout(120000)
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  await weather(page, 75)
  await advance(page, 3)
  let s = await state(page)
  expect(s.snowHits).toBeGreaterThan(0)
  expect(s.snowCover).toBeGreaterThan(0)
  expect(s.melted).toBeGreaterThan(0)
  await page.locator(stage).focus()
  for (let i = 0; i < 9; i++)
    await page.keyboard.press('ArrowDown')
  for (let i = 0; i < 12; i++)
    await page.keyboard.press('ArrowRight')
  await shake(page)
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
  expect(errors).toEqual([])
})

test('actual rain generates ripples and thunder illuminates the scene within the rendering budget', async ({ page }) => {
  test.setTimeout(90000)
  await weather(page, 63)
  await advance(page, 3)
  expect((await state(page)).rainMix).toBeGreaterThan(0.98)
  expect((await state(page)).rippleHits).toBeGreaterThan(0)
  await weather(page, 95)
  await advance(page, 4)
  const s = await state(page)
  expect(s.flashCount).toBeGreaterThan(0)
  expect(s.drawCalls).toBeLessThan(90)
  expect(s.triangles).toBeLessThan(40000)
  expect(s.boat.outside).toBe(0)
})

test('hover wipes the actual glass continuously while dragging exclusively observes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await ready(page)
  const box = (await page.locator(stage).boundingBox())!
  const x = box.x + box.width / 2
  const y = box.y + box.height * 0.53
  const before = await state(page)
  await page.mouse.move(x - 18, y - 25)
  await page.mouse.move(x + 18, y + 25, { steps: 12 })
  const wiped = await state(page)
  expect(wiped.fogMean).toBeLessThan(before.fogMean - 0.5)
  expect(wiped.wipeCount).toBeGreaterThan(6)
  expect(wiped.yaw).toBe(before.yaw)
  await page.mouse.down()
  await page.mouse.move(x + 65, y + 35, { steps: 8 })
  expect((await state(page)).wipeCount).toBe(wiped.wipeCount)
  await expect.poll(async () => (await state(page)).yaw).not.toBe(before.yaw)
  await page.mouse.up()
  const hits = (await state(page)).wipeCount
  await page.mouse.move(box.x + 2, box.y + 5)
  await page.mouse.move(box.x + 5, box.y + 10)
  expect((await state(page)).wipeCount).toBe(hits)
  await page.locator(stage).focus()
  await page.keyboard.press('Home')
  await expect.poll(async () => (await state(page)).yaw).toBe(0.12)
  await page.keyboard.press('Space')
  expect((await state(page)).paused).toBe(false)
})

test('local codes drive all weather states automatically and expose data only as accessible text', async ({ page }) => {
  test.setTimeout(120000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(() => {
    navigator.geolocation.getCurrentPosition = () => {
      throw new Error('must not request precise location')
    }
  })
  for (const [code, expected] of [[0, 'clear'], [3, 'cloud'], [45, 'fog'], [63, 'rain'], [75, 'snow'], [95, 'storm']] as const) {
    await weather(page, code, '/?debug=1')
    expect((await state(page)).weather).toBe(expected)
    await expect(page.locator('[data-bottle-part=weather-data]')).toContainText('21°C')
    await expect(page.locator('[data-bottle-part=weather-data]')).toContainText('65%')
    await expect(page.locator('[data-bottle-part=weather-source]')).toContainText('Open-Meteo')
    expect(await page.locator('[data-bottle-part=weather-data]').evaluate(el => getComputedStyle(el).clipPath)).toBe('inset(50%)')
    await expect(page.locator(`${host} button, .bottle-links`)).toHaveCount(0)
  }
})

test('missing or failed weather keeps labelled default sunlight without fabricated data', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('**/api/weather', r => r.fulfill({ status: 503, body: 'unavailable' }))
  await ready(page, '/en/?debug=1')
  await expect(page.locator('[data-bottle-part=weather-data]')).toHaveText('Default sunlight scene · Demo weather')
  await expect(page.locator('[data-bottle-part=weather-data]')).not.toContainText('°C')
  expect((await state(page)).weather).toBe('clear')
  expect((await state(page)).liveMode).toBe(false)
})

test('CDN failure retries in place through the scene, and unsupported WebGL has a clear error', async ({ page }) => {
  test.setTimeout(60000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route(sourcePattern, r => r.abort())
  await page.goto('/?debug=1')
  await page.evaluate(() => {
    (window as any).navigationMarker = true
  })
  await page.locator(host).scrollIntoViewIfNeeded()
  await expect(page.locator(host)).toHaveAttribute('data-state', 'error')
  await expect(page.locator('[data-bottle-part=message-text]')).toContainText('重试')
  await expect(page.locator(`${host} button`)).toHaveCount(0)
  await page.unroute(sourcePattern)
  await page.route(sourcePattern, r => r.fulfill({ body: three, contentType: 'text/javascript' }))
  await page.locator(stage).focus()
  await page.keyboard.press('Enter')
  await expect(page.locator(host)).toHaveAttribute('data-state', 'ready', { timeout: 30000 })
  expect(await page.evaluate(() => (window as any).navigationMarker)).toBe(true)
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string, ...args: any[]) {
      if (kind === 'webgl2')
        return null
      return getContext.call(this, kind as any, ...args)
    } as typeof getContext
  })
  await page.goto(standalone)
  await expect(page.locator(host)).toHaveAttribute('data-state', 'error')
  await expect(page.locator('[data-bottle-part=message-text]')).toContainText('WebGL 2')
})

test('native bottle blends into both page themes, loads near the viewport and pauses offscreen', async ({ page }) => {
  test.setTimeout(60000)
  await page.setViewportSize({ width: 1100, height: 800 })
  let libraryLoads = 0
  page.on('request', (request) => {
    if (request.url().startsWith(source))
      libraryLoads++
  })
  await page.goto('/?debug=1')
  await expect(page.locator(host)).toHaveAttribute('data-state', 'waiting')
  expect(libraryLoads).toBe(0)
  await page.locator(host).scrollIntoViewIfNeeded()
  await expect(page.locator(host)).toHaveAttribute('data-state', 'ready', { timeout: 30000 })
  expect(page.frames()).toHaveLength(1)
  await expect(page.locator(`${stage} canvas`)).toHaveCount(1)
  const layout = await page.locator('.weather-bottle').evaluate((el) => {
    const wrapper = getComputedStyle(el)
    return { background: wrapper.backgroundColor, border: wrapper.borderTopWidth, backgrounds: [...el.querySelectorAll('.weather-scene, .app, canvas')].map(e => getComputedStyle(e).backgroundColor) }
  })
  expect(layout).toEqual({ background: 'rgba(0, 0, 0, 0)', border: '0px', backgrounds: ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0)'] })
  // A compact accent: about half of the 674px content column, at 4:3.
  const size = await page.locator('.weather-bottle').evaluate(el => ({ content: el.clientWidth, ...el.querySelector('[data-bottle-part=stage]')!.getBoundingClientRect().toJSON() }))
  expect(size.content).toBe(674)
  expect(size.width / size.content).toBeCloseTo(0.5, 1)
  expect(size.height).toBeCloseTo(size.width * 0.75, 0)
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect.poll(async () => (await state(page)).outside).toBe(true)
  const frames = (await state(page)).rendered
  await page.waitForTimeout(350)
  expect((await state(page)).rendered).toBe(frames)
  await page.locator('#theme-toggle').click()
  await expect(page.locator(host)).toHaveClass(/dark/)
  await page.locator(host).scrollIntoViewIfNeeded()
  await expect.poll(async () => (await state(page)).rendered).toBeGreaterThan(frames)
  const alpha = await page.evaluate(() => (document.querySelector('[data-weather-scene]') as any).__weatherBottle.transparency())
  expect(alpha.cornerAlphas).toEqual([0, 0, 0, 0])
  expect(alpha.glassAirAlpha).toBeLessThan(100)
})

test('Astro navigation releases native resources and remounts once on returning to the home page', async ({ page }) => {
  test.setTimeout(90000)
  await ready(page, '/?debug=1')
  await page.evaluate(() => {
    (window as any).oldBottle = document.querySelector('[data-weather-scene]')
    ;(window as any).navigationMarker = true
  })
  await page.locator('a[hreflang]').click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  expect(await page.evaluate(() => (window as any).navigationMarker)).toBe(true)
  expect(await page.evaluate(() => (window as any).oldBottle.__weatherBottle.snapshot().disposed)).toBe(true)
  expect(await page.evaluate(() => (window as any).oldBottle.querySelectorAll('canvas').length)).toBe(0)
  const frames = await page.evaluate(() => (window as any).oldBottle.__weatherBottle.snapshot().rendered)
  await page.locator(host).scrollIntoViewIfNeeded()
  await expect(page.locator(host)).toHaveAttribute('data-state', 'ready', { timeout: 30000 })
  await expect(page.locator(stage)).toHaveAttribute('aria-label', 'A bottle of weather')
  await page.evaluate(() => {
    for (let i = 0; i < 4; i++)
      document.dispatchEvent(new Event('astro:page-load'))
  })
  await expect(page.locator(`${stage} canvas`)).toHaveCount(1)
  expect(await page.evaluate(() => (window as any).oldBottle.__weatherBottle.snapshot().rendered)).toBe(frames)
  await page.locator('.menu-toggle').click()
  await page.locator('#menu-items a[href="/en/projects/"]').click()
  await expect(page.locator(host)).toHaveCount(0)
  await page.goBack()
  await page.locator(host).scrollIntoViewIfNeeded()
  await expect(page.locator(host)).toHaveAttribute('data-state', 'ready', { timeout: 30000 })
  await expect(page.locator(`${stage} canvas`)).toHaveCount(1)
  await page.locator(stage).focus()
  await page.keyboard.press('ArrowRight')
  expect(await page.evaluate(() => (window as any).navigationMarker)).toBe(true)
})

test('pending CDN and weather requests cannot resurrect a detached scene', async ({ page }) => {
  test.setTimeout(60000)
  let release: () => void = () => {}
  const waiting = new Promise<void>(resolve => release = resolve)
  await page.route(sourcePattern, async (r) => {
    await waiting
    await r.fulfill({ body: three, contentType: 'text/javascript' }).catch(() => {})
  })
  await page.goto('/?debug=1')
  await page.locator(host).scrollIntoViewIfNeeded()
  await expect(page.locator(host)).toHaveAttribute('data-state', 'loading')
  await page.evaluate(() => {
    (window as any).oldBottle = document.querySelector('[data-weather-scene]')
  })
  await page.locator('a[hreflang]').click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  release()
  await page.locator(host).scrollIntoViewIfNeeded()
  await expect(page.locator(host)).toHaveAttribute('data-state', 'ready', { timeout: 30000 })
  expect(await page.evaluate(() => (window as any).oldBottle.dataset.state)).toBe('disposed')
  expect(await page.evaluate(() => (window as any).oldBottle.querySelectorAll('canvas').length)).toBe(0)
  // Now hold a weather response during a second navigation.
  let releaseWeather: () => void = () => {}
  const weatherWaiting = new Promise<void>(resolve => releaseWeather = resolve)
  await page.route('**/api/weather', async (r) => {
    await weatherWaiting
    await r.fulfill({ json: { available: true, code: 95, temperature: 10, humidity: 90, observedAt: Date.now(), fetchedAt: Date.now() } }).catch(() => {})
  })
  await page.goBack()
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')
  await page.locator(host).scrollIntoViewIfNeeded()
  await expect(page.locator(host)).toHaveAttribute('data-state', 'ready', { timeout: 30000 })
  await page.evaluate(() => {
    (window as any).oldBottle = document.querySelector('[data-weather-scene]')
  })
  await page.locator('a[hreflang]').click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  releaseWeather()
  expect(await page.evaluate(() => (window as any).oldBottle.__weatherBottle.snapshot().disposed)).toBe(true)
  expect(await page.evaluate(() => (window as any).oldBottle.__weatherBottle.snapshot().liveMode)).toBe(false)
})

test('320px touch observes horizontally, wipes on tap, scrolls vertically and resizes without overflow', async ({ browser }) => {
  test.setTimeout(60000)
  const context = await browser.newContext({ viewport: { width: 320, height: 700 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.route(sourcePattern, r => r.fulfill({ body: three, contentType: 'text/javascript' }))
  await page.route('**/api/weather', r => r.fulfill({ json: { available: false } }))
  await ready(page, '/?debug=1')
  const cdp = await context.newCDPSession(page)
  async function swipe(x: number, y: number, dx: number, dy: number) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
    for (let i = 1; i <= 6; i++)
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + dx * i / 6, y: y + dy * i / 6 }] })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  }
  let box = (await page.locator(stage).boundingBox())!
  const before = await state(page)
  expect(before.paused).toBe(true)
  expect(before.particles).toBe(280)
  await swipe(160, box.y + box.height * 0.53, 48, 2)
  await expect.poll(async () => (await state(page)).yaw).not.toBe(before.yaw)
  expect((await state(page)).wipeCount).toBe(0)
  const turned = await state(page)
  const scroll = await page.evaluate(() => scrollY)
  await swipe(160, box.y + box.height * 0.6, 0, -70)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(scroll + 20)
  expect((await state(page)).yaw).toBe(turned.yaw)
  expect((await state(page)).tiltX).toBe(turned.tiltX)
  expect((await state(page)).wipeCount).toBe(0)
  box = (await page.locator(stage).boundingBox())!
  await page.touchscreen.tap(160, box.y + box.height * 0.52)
  expect((await state(page)).wipeCount).toBeGreaterThan(0)
  expect((await state(page)).yaw).toBe(turned.yaw)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320)
  await expect(page.locator(`${host} button, .bottle-links`)).toHaveCount(0)
  expect((await state(page)).width).toBe(240)
  await page.setViewportSize({ width: 700, height: 700 })
  const content = await page.locator('.weather-bottle').evaluate(el => el.clientWidth)
  await expect.poll(async () => (await state(page)).width / content).toBeCloseTo(0.5, 1)
  expect((await state(page)).boat.outside).toBe(0)
  await context.close()
})

test('automatic weather recovers after a failed lookup without controls or repeated announcements', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  let requests = 0
  await page.route('**/api/weather', r => r.fulfill({ json: ++requests === 1 ? { available: false } : { available: true, temperature: 18, humidity: 70, code: 3, observedAt: Date.now(), fetchedAt: Date.now(), place: 'Test city' } }))
  await ready(page, '/?debug=1')
  await expect.poll(() => requests).toBe(1)
  expect((await state(page)).weather).toBe('clear')
  await page.evaluate(() => {
    const now = Date.now()
    Date.now = () => now + 16 * 60 * 1000
    window.scrollTo(0, 0)
  })
  await expect.poll(async () => (await state(page)).outside).toBe(true)
  await page.locator(host).scrollIntoViewIfNeeded()
  await expect.poll(async () => (await state(page)).weather).toBe('cloud')
  expect(requests).toBe(2)
  await expect(page.locator('[data-bottle-part=weather-data]')).toContainText('18°C')
  await page.evaluate(() => {
    (window as any).statusUpdates = 0
    new MutationObserver(() => (window as any).statusUpdates++)
      .observe(document.querySelector('[data-bottle-part=status]')!, { childList: true, subtree: true, characterData: true })
  })
  await page.locator(stage).focus()
  await page.keyboard.press('Space')
  await advance(page, 1.2)
  expect(await page.evaluate(() => (window as any).statusUpdates)).toBe(1)
})
