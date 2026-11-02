// Optional Vercel endpoint. The static HTML works without it (default/demo weather).
// Only the hosting platform's approximate city coordinates leave this server;
// visitor IPs, cookies, user agents and request headers are never forwarded.
import process from 'node:process'

const cache = new Map()
const TTL = 15 * 60 * 1000
const validCodes = new Set([0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99])

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store')
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ available: false })
  }
  const unavailable = () => res.status(200).json({ available: false })
  // Never trust client-supplied geographic headers outside Vercel.
  if (process.env.VERCEL !== '1')
    return unavailable()
  const rawLat = req.headers['x-vercel-ip-latitude']
  const rawLon = req.headers['x-vercel-ip-longitude']
  if (typeof rawLat !== 'string' || !rawLat.trim() || typeof rawLon !== 'string' || !rawLon.trim())
    return unavailable()
  const lat = Number(rawLat)
  const lon = Number(rawLon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180)
    return unavailable()
  // A ~10 km grid is enough for this illustration. Do not store precise coordinates.
  const latitude = Math.round(lat * 10) / 10
  const longitude = Math.round(lon * 10) / 10
  const key = `${latitude},${longitude}`
  let place = ''
  try {
    place = decodeURIComponent(String(req.headers['x-vercel-ip-city'] || '')).split('').filter(char => char.charCodeAt(0) >= 32 && char.charCodeAt(0) !== 127).join('').slice(0, 80)
  }
  catch { /* A city label is optional. */ }
  const country = String(req.headers['x-vercel-ip-country'] || '').replace(/[^A-Z]/g, '').slice(0, 2)
  const send = data => res.status(200).json({ available: true, ...data, place, country })
  const cached = cache.get(key)
  if (cached && Date.now() - cached.fetchedAt < TTL)
    return send(cached)
  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast')
    url.search = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude), current: 'temperature_2m,relative_humidity_2m,weather_code,is_day', timezone: 'GMT', timeformat: 'unixtime', forecast_days: '1' }).toString()
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!response.ok)
      return unavailable()
    const { current } = await response.json()
    if (!current || typeof current.temperature_2m !== 'number' || !Number.isFinite(current.temperature_2m) || current.temperature_2m < -100 || current.temperature_2m > 70 || typeof current.relative_humidity_2m !== 'number' || current.relative_humidity_2m < 0 || current.relative_humidity_2m > 100 || !validCodes.has(current.weather_code) || !Number.isFinite(current.time) || Math.abs(Date.now() - current.time * 1000) > 2 * 60 * 60 * 1000)
      return unavailable()
    const data = { temperature: current.temperature_2m, humidity: current.relative_humidity_2m, code: current.weather_code, isDay: current.is_day === 1, observedAt: current.time * 1000, fetchedAt: Date.now() }
    if (cache.size >= 200)
      cache.delete(cache.keys().next().value)
    cache.set(key, data)
    return send(data)
  }
  catch {
    return unavailable()
  }
}
