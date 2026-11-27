class ArticleLinkPreviews extends HTMLElement {
  private events?: AbortController

  connectedCallback() {
    const card = this.querySelector<HTMLElement>('[role="tooltip"]')!
    if (typeof card.showPopover !== 'function')
      return

    const body = this.querySelector('.article-prose')!
    const title = card.querySelector<HTMLElement>('.preview-title')!
    const summary = card.querySelector<HTMLElement>('.preview-summary')!
    const source = card.querySelector<HTMLElement>('.preview-source span')!
    const arrow = card.querySelector<HTMLElement>('.preview-source b')!
    const covers = card.querySelectorAll<HTMLImageElement>('[data-cover]')
    const previews: Record<string, { title?: string, summary?: string }> = JSON.parse(card.dataset.previews!)
    const site = new URL(this.dataset.site!)
    const { signal } = this.events = new AbortController()
    const canHover = matchMedia('(any-hover: hover)')
    let active: HTMLAnchorElement | undefined
    let timer: number | undefined

    function close() {
      clearTimeout(timer)
      if (active) {
        const ids = active.getAttribute('aria-describedby')?.split(/\s+/).filter(id => id !== card.id)
        if (ids?.length)
          active.setAttribute('aria-describedby', ids.join(' '))
        else
          active.removeAttribute('aria-describedby')
        active = undefined
        if (card.matches(':popover-open'))
          card.hidePopover()
      }
    }

    function position() {
      if (!active)
        return
      const rect = active.getBoundingClientRect()
      const width = document.documentElement.clientWidth
      const height = document.documentElement.clientHeight
      const margin = 12
      const gap = 6
      if (rect.bottom < 0 || rect.top > height || rect.right < 0 || rect.left > width) {
        close()
        return
      }
      const left = rect.left + (rect.width - card.offsetWidth) / 2
      const above = rect.top - gap - card.offsetHeight
      const below = rect.bottom + gap
      const moreRoomAbove = rect.top > height - rect.bottom
      const useAbove = above >= margin || (below + card.offsetHeight > height - margin && moreRoomAbove)
      const top = useAbove ? above : below
      card.style.left = `${Math.max(margin, Math.min(left, width - margin - card.offsetWidth))}px`
      card.style.top = `${Math.max(margin, Math.min(top, height - margin - card.offsetHeight))}px`
    }

    function show(link: HTMLAnchorElement) {
      clearTimeout(timer)
      if (active === link)
        return
      close()
      const url = new URL(link.href)
      const internal = url.origin === location.origin || url.origin === site.origin
      const key = internal ? url.pathname.replace(/\/?$/, '/') : url.href
      const preview = previews[key]
      title.textContent = preview?.title || link.textContent?.trim() || url.hostname
      summary.textContent = preview?.summary || link.dataset.previewDescription || ''
      summary.hidden = !summary.textContent
      source.textContent = (internal ? site.host : url.host) + url.pathname.replace(/\/$/, '')
      arrow.hidden = internal
      for (const image of covers)
        image.hidden = image.dataset.cover !== key || (image.complete && image.naturalWidth === 0)
      active = link
      const description = link.getAttribute('aria-describedby')
      link.setAttribute('aria-describedby', description ? `${description} ${card.id}` : card.id)
      card.showPopover()
      position()
    }

    function leave() {
      clearTimeout(timer)
      timer = window.setTimeout(() => {
        if (!active?.matches(':hover, :focus-visible') && !card.matches(':hover'))
          close()
      }, 140)
    }

    for (const link of body.querySelectorAll<HTMLAnchorElement>('a[href]')) {
      const href = link.getAttribute('href')?.trim()
      if (!href || href.startsWith('#') || !/^https?:$/.test(link.protocol)
        || link.closest('nav, header, footer, button, pre, code, h1, h2, h3, h4, h5, h6, .not-prose')
        || link.matches('[download], [role="button"], .inline-flex, .heading-anchor, .footnote-backref, [data-footnote-ref], [data-footnote-backref]')
        || link.querySelector('img:not(.link__icon), button, svg')) {
        continue
      }
      link.dataset.previewLink = ''
      if (link.title) {
        link.dataset.previewDescription ||= link.title
        link.removeAttribute('title')
      }
      link.addEventListener('pointerenter', (event) => {
        if (event.pointerType !== 'touch' && canHover.matches) {
          clearTimeout(timer)
          timer = window.setTimeout(show, 130, link)
        }
      }, { signal })
      link.addEventListener('pointerleave', leave, { signal })
      link.addEventListener('focus', () => {
        if (link.matches(':focus-visible'))
          show(link)
      }, { signal })
      link.addEventListener('blur', leave, { signal })
    }

    card.addEventListener('pointerenter', () => clearTimeout(timer), { signal })
    card.addEventListener('pointerleave', leave, { signal })
    for (const image of covers) {
      image.addEventListener('error', () => {
        image.hidden = true
        position()
      }, { signal })
    }
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape')
        close()
    }, { signal })
    window.addEventListener('resize', position, { signal })
    window.addEventListener('scroll', position, { capture: true, passive: true, signal })
    signal.addEventListener('abort', close, { once: true })
  }

  disconnectedCallback() {
    this.events?.abort()
  }
}

customElements.define('article-link-previews', ArticleLinkPreviews)
