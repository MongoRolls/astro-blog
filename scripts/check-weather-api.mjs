import assert from 'node:assert/strict'
import process from 'node:process'
import { test } from 'node:test'
import handler from '../api/weather.js'

function request(headers = {}, method = 'GET') {
  let status = 200
  const output = { headers: {}, status: 200, body: null }
  const res = {
    setHeader(name, value) { output.headers[name] = value },
    status(code) {
      status = code
      return this
    },
    json(body) {
      Object.assign(output, { status, body })
      return output
    },
  }
  return handler({ method, headers }, res)
}

const geo = { 'x-vercel-ip-latitude': '39.9042', 'x-vercel-ip-longitude': '116.4074', 'x-vercel-ip-city': 'Beijing', 'x-vercel-ip-country': 'CN', 'x-forwarded-for': '203.0.113.1', 'cookie': 'private=1' }

test('optional weather endpoint validates, minimizes location, caches by coarse area and fails closed', async () => {
  const originalFetch = globalThis.fetch
  const originalVercel = process.env.VERCEL
  let calls = 0
  const current = { temperature_2m: 12.4, relative_humidity_2m: 63, weather_code: 61, is_day: 1, time: Math.floor(Date.now() / 1000) }
  try {
    delete process.env.VERCEL
    globalThis.fetch = async () => {
      throw new Error('must not fetch')
    }
    assert.equal((await request(geo)).body.available, false)
    process.env.VERCEL = '1'
    assert.equal((await request()).body.available, false)
    assert.equal((await request({ ...geo, 'x-vercel-ip-latitude': '' })).body.available, false)
    assert.equal((await request({ ...geo, 'x-vercel-ip-latitude': 'NaN' })).body.available, false)
    assert.equal((await request({ ...geo, 'x-vercel-ip-latitude': '95' })).body.available, false)
    assert.equal((await request(geo, 'POST')).status, 405)
    globalThis.fetch = async (url, options) => {
      calls++
      assert.equal(url.origin, 'https://api.open-meteo.com')
      assert.equal(url.searchParams.get('latitude'), '39.9')
      assert.equal(url.searchParams.get('longitude'), '116.4')
      assert.equal(options.headers, undefined)
      assert.ok(options.signal)
      assert.ok(!url.href.includes('203.0.113.1'))
      return Response.json({ current })
    }
    const result = await request(geo)
    assert.equal(result.body.available, true)
    assert.equal(result.body.temperature, 12.4)
    assert.equal(result.body.humidity, 63)
    assert.equal(result.body.code, 61)
    assert.equal(result.headers['Cache-Control'], 'private, no-store')
    assert.equal(result.headers['Vercel-CDN-Cache-Control'], 'no-store')
    assert.equal(result.body.latitude, undefined)
    const cached = await request({ ...geo, 'x-vercel-ip-latitude': '39.9011', 'x-vercel-ip-city': '%E5%8C%97%E4%BA%AC' })
    assert.equal(cached.body.place, '北京')
    assert.equal(calls, 1)
    globalThis.fetch = async () => Response.json({ current: { ...current, time: 1 } })
    assert.equal((await request({ ...geo, 'x-vercel-ip-latitude': '40.1' })).body.available, false)
    globalThis.fetch = async () => Response.json({ current: { ...current, relative_humidity_2m: null } })
    assert.equal((await request({ ...geo, 'x-vercel-ip-latitude': '40.2' })).body.available, false)
    globalThis.fetch = async () => new Response('rate limited', { status: 429 })
    assert.equal((await request({ ...geo, 'x-vercel-ip-latitude': '40.3' })).body.available, false)
    globalThis.fetch = async () => {
      throw new Error('timeout')
    }
    assert.equal((await request({ ...geo, 'x-vercel-ip-latitude': '40.4' })).body.available, false)
  }
  finally {
    globalThis.fetch = originalFetch
    if (originalVercel === undefined)
      delete process.env.VERCEL
    else
      process.env.VERCEL = originalVercel
  }
})
