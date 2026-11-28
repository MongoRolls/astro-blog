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
  rules: {
    // @antfu/eslint-config v10 新增规则，避免把 Astro 模板里简短的双语三元表达式强行拆行
    'antfu/reasonable-newline': 'off',
  },
})
