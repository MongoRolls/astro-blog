import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

// Resolve the same transitive modules used by ESLint's Markdown processor.
const require = createRequire(import.meta.url)
const antfu = createRequire(require.resolve('@antfu/eslint-config'))
const markdown = createRequire(antfu.resolve('@eslint/markdown'))
const mathPath = markdown.resolve('micromark-extension-math')
const mathRequire = createRequire(mathPath)
const katex = mathRequire('katex')
const { math, mathHtml } = await import(mathPath)
const mdast = createRequire(markdown.resolve('mdast-util-from-markdown'))
const { micromark } = await import(mdast.resolve('micromark'))

const html = micromark('$x^2$\n\n$$\nx+1\n$$', {
  extensions: [math()],
  htmlExtensions: [mathHtml()],
})
assert.match(html, /katex-display/)
assert.match(html, /math-inline/)
assert.match(katex.renderToString('\\href{https://example.com}{x}', { trust: true }), /href=/)

// GHSA-238p-pmpm-9mq7: inherited trust must not enable trusted commands.
const previous = Object.getOwnPropertyDescriptor(Object.prototype, 'trust')
try {
  // eslint-disable-next-line no-extend-native -- Reproduce the advisory in this isolated test process.
  Object.defineProperty(Object.prototype, 'trust', { value: true, configurable: true, writable: true })
  assert.doesNotMatch(katex.renderToString('\\href{https://example.com}{x}'), /href=/)
}
finally {
  if (previous)
    // eslint-disable-next-line no-extend-native -- Restore the exact previous descriptor.
    Object.defineProperty(Object.prototype, 'trust', previous)
  else
    Reflect.deleteProperty(Object.prototype, 'trust')
}

console.log('Markdown math rendering and inherited-trust regression checks passed.')
