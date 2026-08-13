// eslint.config.js
import antfu from '@antfu/eslint-config'

export default antfu({
  astro: true,
  typescript: true,
  ignores: [
    '.astro/**',
    '.claude/**',
    'dist/**',
  ],
})
