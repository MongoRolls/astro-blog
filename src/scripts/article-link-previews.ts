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
    const covers = new Map(Array.from(card.querySelectorAll<HTMLImageElement>('[data-cover]'), image => [image.dataset.cover, image]))
    const previews: Record<string, { title?: string, summary?: string }> = JSON.parse(card.dataset.previews!)
    const site = new URL(this.dataset.site!)
    const { signal } = this.events = new AbortController()
    const canHover = matchMedia('(any-hover: hover)')
    let active: HTMLAnchorElement | undefined
    let timer: number | undefined

    let activeCover: HTMLImageElement | undefined
    let coverWait: AbortController | undefined

    function clearCover() {
      coverWait?.abort()
      coverWait = undefined
      if (activeCover)
        activeCover.hidden = true
      activeCover = undefined
      card.removeAttribute('aria-busy')
    }

    function revealCover(image: HTMLImageElement) {
      activeCover = image
      if (image.dataset.src && !image.hasAttribute('src'))
        image.src = image.dataset.src
      if (image.complete) {
        image.hidden = !image.naturalWidth
        return
      }

      card.setAttribute('aria-busy', 'true')
      const wait = new AbortController()
      coverWait = wait
      function finish(ready: boolean) {
        if (wait.signal.aborted)
          return
        wait.abort()
        card.removeAttribute('aria-busy')
        image.hidden = !ready
        position()
      }
      const timeout = window.setTimeout(finish, 5000, false)
      wait.signal.addEventListener('abort', () => clearTimeout(timeout), { once: true })
      image.addEventListener('load', () => finish(image.naturalWidth > 0), { signal: wait.signal })
      image.addEventListener('error', () => finish(false), { signal: wait.signal })
    }

    function close() {
      clearTimeout(timer)
      clearCover()
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
      active = link
      const image = covers.get(key)
      if (image)
        revealCover(image)
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
