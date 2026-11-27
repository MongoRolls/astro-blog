import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { EventEmitter } from 'node:events'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import https from 'node:https'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { Readable } from 'node:stream'
// eslint-disable-next-line test/no-import-node-test -- 复用 Node 内置测试运行器，无需额外依赖。
import { test } from 'node:test'
import { pathToFileURL } from 'node:url'
import sharp from 'sharp'
import { automaticLinkImage } from '../src/utils/automatic-link-image.mjs'

test('未预置的新外链自动取图、跟随公开 CDN、跨语言复用并在无图时回退', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'article-link-image-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const cacheDir = pathToFileURL(`${root}/cache/`)
  const outDir = pathToFileURL(`${root}/dist/`)
  const options = { cacheDir, outDir, dev: false }
  const png = await sharp({ create: { width: 32, height: 16, channels: 3, background: 'blue' } }).png().toBuffer()
  const page = 'https://article.example/post'
  const cdn = 'https://media.example/card.png'
  const fetched = []
  t.mock.method(https, 'get', (url, request, send) => {
    fetched.push(url.href)
    assert.ok(request.agent)
    const reply = url.href === page
      ? { status: 200, body: '<head><meta content="/share.png" property="og:image"></head>' }
      : url.href === 'https://article.example/share.png'
        ? { status: 302, location: cdn }
        : url.href === cdn ? { status: 200, body: png } : { status: 200, body: '<head></head>' }
    const response = Object.assign(Readable.from([Buffer.from(reply.body ?? '')]), {
      headers: { location: reply.location },
      statusCode: reply.status,
    })
    queueMicrotask(() => send(response))
    return new EventEmitter()
  })

  const [image, fragment] = await Promise.all([page, `${page}#details`].map(href => automaticLinkImage(href, options)))
  assert.equal(image, fragment)
  assert.match(image, /^\/link-previews\/[a-f\d]+\.webp$/)
  const asset = await readFile(new URL(image.slice(1), outDir))
  assert.equal((await sharp(asset).metadata()).format, 'webp')
  assert.deepEqual(fetched, [page, 'https://article.example/share.png', cdn])

  const nextBuild = pathToFileURL(`${root}/next/`)
  assert.equal(await automaticLinkImage(page, { ...options, outDir: nextBuild }), image)
  assert.deepEqual(await readFile(new URL(image.slice(1), nextBuild)), asset)
  assert.equal(fetched.length, 3)
  assert.equal(await automaticLinkImage('https://article.example/no-image', options), undefined)
  assert.equal(await automaticLinkImage('mailto:editor@example.org', options), undefined)
  assert.equal(fetched.length, 4)
})
