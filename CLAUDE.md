# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于 Astro 构建的个人博客系统，使用 TailwindCSS 作为样式框架，支持 MDX 格式的博客文章，并集成了 Pagefind 进行全文搜索。

## 常用命令

### 开发与构建
```bash
# 开发模式 - 启动本地开发服务器
pnpm dev

# 构建 - 构建生产环境并生成搜索索引
pnpm build

# 预览 - 预览构建后的生产版本
pnpm preview

# 代码检查
pnpm lint

# 自动修复代码问题
pnpm lint:fix
```

### 环境变量配置
项目支持通过 `ASTRO_IMAGE_SOURCE` 环境变量控制图片加载策略：
- `local`: 使用本地 public 目录的图片（开发环境默认）
- `oss`: 使用阿里云 OSS CDN 图片（生产环境默认）

```bash
# 强制使用本地图片
ASTRO_IMAGE_SOURCE=local pnpm dev

# 强制使用 OSS 图片
ASTRO_IMAGE_SOURCE=oss pnpm dev
```

## 架构与代码结构

### 内容集合系统 (Content Collections)
项目使用 Astro 的内容集合功能管理内容，定义在 [src/content.config.ts](src/content.config.ts)：

- **blog**: 博客文章（支持 MD/MDX），包含标题、发布日期、标签、SEO 等字段
- **pages**: 静态页面（如关于页面、联系页面等）
- **projects**: 项目展示页面

所有内容文件存储在 `src/content/` 目录下。

### 图片资源管理
项目实现了一个环境感知的图片配置系统（[src/config/image.ts](src/config/image.ts)），根据环境自动切换图片源：
- 开发环境使用本地图片（`/cover-images/`）
- 生产环境可选使用 OSS CDN 加速

相关工具函数：
- `getImageBaseUrl()`: 获取图片基础 URL
- `getCoverPathPrefix()`: 获取封面图片路径前缀
- `getLocalPublicPath()`: 获取本地 public 路径

### Remark 插件
项目使用多个自定义 Remark 插件处理 Markdown 内容：

1. **remarkReadingTime** ([src/utils/remark-reading-time.mjs](src/utils/remark-reading-time.mjs))
   - 自动计算文章阅读时间
   - 结果存储在 frontmatter 的 `minutesRead` 字段

2. **remarkAlert** (第三方)
   - 支持 GitHub 风格的提示块语法

3. **remarkReplaceLinks** ([src/utils/remark-replace-links.js](src/utils/remark-replace-links.js))
   - 替换和转换链接

### 数据工具函数
[src/utils/data-utils.ts](src/utils/data-utils.ts) 提供了常用的数据处理函数：
- `sortItemsByDateDesc()`: 按日期降序排序文章/项目
- `getAllTags()`: 获取所有标签并去重
- `getPostsByTag()`: 根据标签过滤文章

### 页面路由结构
- `/` - 首页（[src/pages/index.astro](src/pages/index.astro)）
- `/post` - 文章列表（[src/pages/post/index.astro](src/pages/post/index.astro)）
- `/blog` - 博客文章列表（带分页，[src/pages/blog/[...page].astro](src/pages/blog/[...page].astro)）
- `/blog/[id]` - 单篇博客文章（[src/pages/blog/[id].astro](src/pages/blog/[id].astro)）
- `/tags` - 标签列表（[src/pages/tags/index.astro](src/pages/tags/index.astro)）
- `/tags/[id]` - 特定标签的文章列表（[src/pages/tags/[id]/[...page].astro](src/pages/tags/[id]/[...page].astro)）
- `/about` - 关于页面（[src/pages/about/index.astro](src/pages/about/index.astro)）
- `/friends` - 友链页面（[src/pages/friends/index.astro](src/pages/friends/index.astro)）

### 站点配置
全局站点配置位于 [src/data/site-config.ts](src/data/site-config.ts)，包含：
- 站点基本信息（标题、描述、作者等）
- 导航链接配置 (`headerNavLinks`)
- 社交链接配置 (`socialLinks`)
- 分页设置（`postsPerPage`, `projectsPerPage`）
- 友链列表 (`friends`)
- OSS 配置 (`ossWebsite`)

### 组件系统
主要组件位于 `src/components/` 目录：
- **BaseHead.astro**: SEO 和 meta 标签管理
- **Header.astro**: 网站头部
- **Footer.astro**: 网站底部
- **ThemeToggle.astro**: 深色模式切换
- **Pagination.astro**: 分页组件
- **PostPreview.astro**: 文章预览卡片
- **TableOfContents.astro**: 目录导航
- **Search.astro**: Pagefind 搜索集成

CSS 动画组件存储在 `src/components/css/` 目录。

### 样式系统
项目使用 TailwindCSS 进行样式管理：
- 配置文件: [tailwind.config.cjs](tailwind.config.cjs)
- 自定义字体: Inter, Noto Sans SC, Fira Code
- 支持深色模式（通过 `class` 策略）
- Typography 插件用于 Markdown 内容样式
- CSS 变量用于主题色管理（`--color-text-main`, `--color-bg-main` 等）

全局样式位于 `src/styles/` 目录。

### 构建优化
- 使用 rollup-plugin-visualizer 分析打包体积（生成 `stats.html`）
- Pagefind 在构建后自动生成搜索索引
- 支持 RSS 订阅和 Sitemap 生成

## 代码规范

项目使用 [@antfu/eslint-config](https://github.com/antfu/eslint-config) 作为 ESLint 配置：
- 支持 TypeScript 和 Astro 文件
- 配置文件: [eslint.config.js](eslint.config.js)

## 开发工作流

### 添加新博客文章
1. 在 `src/content/blog/` 创建 `.mdx` 文件
2. 添加必需的 frontmatter 字段：
   ```yaml
   ---
   title: 文章标题
   publishDate: 2024-01-01
   excerpt: 文章摘要（可选）
   tags: [标签1, 标签2]
   ---
   ```
3. 文章会自动获得阅读时间估算（通过 remarkReadingTime 插件）

### 修改站点配置
编辑 [src/data/site-config.ts](src/data/site-config.ts) 来更新站点信息、导航链接、社交链接和友链列表。

### 添加自定义组件
在 `src/components/` 目录创建 `.astro` 文件。组件可以在 MDX 文章中直接使用。

### 图片资源
- 封面图片: `public/cover-images/`
- 博客相关图片: `public/blog/`
- 静态资源: `public/`

生产环境可通过配置 OSS 实现 CDN 加速。

## Cursor Rules 集成

项目包含 Cursor AI 编程助手规则（[.cursor/rules/code.mdc](.cursor/rules/code.mdc)），定义了 RIPER-5 工作模式系统：
- **RESEARCH**: 信息收集模式，只读取和理解代码
- **INNOVATE**: 头脑风暴模式，讨论可能的实现方案
- **PLAN**: 制定详细技术规范，创建实施清单
- **EXECUTE**: 严格按照计划实施代码
- **REVIEW**: 验证实施是否与计划一致

开发时请遵循这些模式以保持代码质量和一致性。

## 技术栈
- **框架**: Astro 5.x
- **样式**: TailwindCSS 3.x + @tailwindcss/typography
- **内容**: MDX (Markdown + JSX)
- **搜索**: Pagefind
- **代码规范**: ESLint + @antfu/eslint-config
- **包管理器**: pnpm
- **部署**: 支持 Vercel, Netlify, StackBlitz 等平台
