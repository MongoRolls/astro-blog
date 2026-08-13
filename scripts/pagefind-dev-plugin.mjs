import { createReadStream, existsSync } from 'node:fs'
import { stat } from 'node:fs/promises'
import path from 'node:path'

const pagefindRoot = path.resolve('dist/pagefind')
const mimeTypes = new Map([
  ['.css', 'text/css'],
  ['.js', 'text/javascript'],
  ['.json', 'application/json'],
  ['.svg', 'image/svg+xml'],
  ['.wasm', 'application/wasm'],
])

function contentType(filePath) {
  return mimeTypes.get(path.extname(filePath)) ?? 'application/octet-stream'
}

export function pagefindDevPlugin() {
  return {
    name: 'pagefind-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD')
          return next()

        const requestUrl = req.url ?? ''
        if (!requestUrl.startsWith('/pagefind/'))
          return next()

        const relativePath = decodeURIComponent(requestUrl.slice('/pagefind/'.length).split('?')[0])
        const filePath = path.resolve(pagefindRoot, relativePath)
        const isInsideBundle = filePath === pagefindRoot || filePath.startsWith(`${pagefindRoot}${path.sep}`)
        if (!isInsideBundle || !existsSync(filePath))
          return next()

        try {
          const fileStat = await stat(filePath)
          if (!fileStat.isFile())
            return next()

          res.setHeader('Content-Type', contentType(filePath))
          res.setHeader('Cache-Control', 'no-store')
          if (req.method === 'HEAD') {
            res.statusCode = 200
            res.end()
            return
          }

          createReadStream(filePath).pipe(res)
        }
        catch {
          next()
        }
      })
    },
  }
}
