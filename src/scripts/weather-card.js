const conditions = [
  [[0], '晴', 'Clear', '☀︎'],
  [[1], '大部晴朗', 'Mostly clear', '☀︎'],
  [[2], '局部多云', 'Partly cloudy', '☁︎'],
  [[3], '阴', 'Overcast', '☁︎'],
  [[45, 48], '雾', 'Fog', '≋'],
  [[51, 53, 55, 56, 57], '毛毛雨', 'Drizzle', '☂︎'],
  [[61, 63, 65, 66, 67], '雨', 'Rain', '☂︎'],
  [[80, 81, 82], '阵雨', 'Rain showers', '☂︎'],
  [[71, 73, 75, 77, 85, 86], '雪', 'Snow', '❄︎'],
  [[95, 96, 99], '雷暴', 'Thunderstorm', 'ϟ'],
]

function mount(card) {
  const standalone = card.hasAttribute('data-standalone')
  const params = new URLSearchParams(location.search)
  const en = standalone ? params.get('lang') === 'en' : card.lang === 'en'
  const label = en ? 'Local weather' : '本地天气'
  const place = card.querySelector('[data-place]')
  const temperature = card.querySelector('[data-temperature]')
  const condition = card.querySelector('[data-condition]')
  const detail = card.querySelector('[data-detail]')
  const symbol = card.querySelector('.weather-symbol')
  const credit = card.querySelector('.weather-credit')
  card.lang = en ? 'en' : 'zh-CN'
  card.setAttribute('aria-label', label)
  if (standalone) {
    document.documentElement.lang = card.lang
    document.title = label
    const theme = params.get('theme')
    document.documentElement.classList.toggle('dark', theme ? theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches)
  }

  function showUnavailable() {
    place.textContent = label
    condition.textContent = en ? 'Weather unavailable' : '天气暂不可用'
    temperature.textContent = detail.textContent = ''
    temperature.hidden = detail.hidden = credit.hidden = true
    symbol.textContent = ''
    card.removeAttribute('data-night')
  }

  showUnavailable()
  if (standalone && (params.get('live') !== '1' || !/^https?:$/.test(location.protocol)))
    return

  const lifetime = new AbortController()
  const interval = 15 * 60 * 1000
  let lastAttempt = -Infinity
  let near = false
  let timer

  async function refresh() {
    clearTimeout(timer)
    if (!near || document.hidden || lifetime.signal.aborted)
      return
    const dueIn = lastAttempt + interval - Date.now()
    if (dueIn > 0) {
      timer = setTimeout(refresh, dueIn)
      return
    }
    lastAttempt = Date.now()
    timer = setTimeout(refresh, interval)
    try {
      const response = await fetch('/api/weather', { signal: AbortSignal.any([lifetime.signal, AbortSignal.timeout(10000)]) })
      if (!response.ok)
        throw new Error('Weather unavailable')
      const data = await response.json()
      if (lifetime.signal.aborted)
        return
      const summary = conditions.find(([codes]) => codes.includes(data.code))
      if (!data.available || !summary || !Number.isFinite(data.temperature) || !Number.isFinite(data.humidity)
        || !Number.isFinite(data.observedAt) || Math.abs(Date.now() - data.observedAt) > 2 * 60 * 60 * 1000) {
        showUnavailable()
        return
      }
      place.textContent = [data.place, data.country].filter(Boolean).join(' · ') || label
      temperature.textContent = `${data.temperature.toLocaleString(card.lang, { maximumFractionDigits: 1 })}°C`
      condition.textContent = summary[en ? 2 : 1]
      const time = new Date(data.observedAt).toLocaleTimeString(card.lang, { hour: '2-digit', minute: '2-digit' })
      detail.textContent = en ? `Humidity ${data.humidity}% · Updated ${time}` : `湿度 ${data.humidity}% · ${time} 更新`
      symbol.textContent = data.isDay === false && data.code <= 1 ? '☾' : summary[3]
      card.toggleAttribute('data-night', data.isDay === false)
      temperature.hidden = detail.hidden = credit.hidden = false
    }
    catch {
      if (!lifetime.signal.aborted)
        showUnavailable()
    }
  }

  const observer = new IntersectionObserver(([entry]) => {
    near = entry.isIntersecting
    void refresh()
  }, { rootMargin: '240px' })
  observer.observe(card)
  document.addEventListener('visibilitychange', refresh, { signal: lifetime.signal })
  return () => {
    lifetime.abort()
    observer.disconnect()
    clearTimeout(timer)
  }
}

if (!customElements.get('blog-weather')) {
  customElements.define('blog-weather', class extends HTMLElement {
    connectedCallback() {
      this.dispose = mount(this)
    }

    disconnectedCallback() {
      this.dispose?.()
    }
  })
}
