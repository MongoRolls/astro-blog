// Optional Vercel endpoint. The static HTML works without it (default/demo weather).
// Only the hosting platform's approximate city coordinates leave this server;
// visitor IPs, cookies, user agents and request headers are never forwarded.
import process from 'node:process'

const cache = new Map()
const pending = new Map()
const TTL = 15 * 60 * 1000
const validCodes = new Set([0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99])

async function fetchForecast(latitude, longitude) {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,relative_humidity_2m,weather_code,is_day',
    timezone: 'GMT',
    timeformat: 'unixtime',
    forecast_days: '1',
  }).toString()
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) })
  if (!response.ok)
    return null

  const { current } = await response.json()
  if (!current)
    return null
  const { temperature_2m: temperature, relative_humidity_2m: humidity, weather_code: code, is_day: isDay, time } = current
  const observedAt = time * 1000
  const fetchedAt = Date.now()
  if (!Number.isFinite(temperature) || temperature < -100 || temperature > 70
    || !Number.isFinite(humidity) || humidity < 0 || humidity > 100
    || !validCodes.has(code) || !Number.isFinite(time) || Math.abs(fetchedAt - observedAt) > 2 * 60 * 60 * 1000) {
    return null
  }

  return { temperature, humidity, code, isDay: isDay === 1, observedAt, fetchedAt }
}

async function getForecast(latitude, longitude) {
  const key = `${latitude},${longitude}`
  const cached = cache.get(key)
  if (cached && Date.now() - cached.fetchedAt < TTL)
    return cached

  const active = pending.get(key)
  if (active)
    return active

  const lookup = fetchForecast(latitude, longitude)
  pending.set(key, lookup)
  try {
    const forecast = await lookup
    if (forecast) {
      cache.delete(key)
      if (cache.size >= 200)
        cache.delete(cache.keys().next().value)
      cache.set(key, forecast)
    }
    return forecast
  }
  finally {
    pending.delete(key)
  }
}

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
  let place = ''
  try {
    place = decodeURIComponent(String(req.headers['x-vercel-ip-city'] || '')).split('').filter(char => char.charCodeAt(0) >= 32 && char.charCodeAt(0) !== 127).join('').slice(0, 80)
  }
  catch { /* A city label is optional. */ }
  const country = String(req.headers['x-vercel-ip-country'] || '').replace(/[^A-Z]/g, '').slice(0, 2)
  try {
    const forecast = await getForecast(latitude, longitude)
    if (forecast)
      return res.status(200).json({ available: true, ...forecast, place, country })
  }
  catch { /* Upstream failures use the default scene. */ }
  return unavailable()
}
