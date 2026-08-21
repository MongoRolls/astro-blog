<h2 align="center">
MongoRolls的个人博客
</h2>

<p align="center">
<a href="https://mongorolls.cn">🖥 Online Preview</a>
<br /><br />
<a href="https://vercel.com/new/clone?repository-url=https://github.com/mongoRolls/astro-blog/tree/main&project-name=astro-blog&repo-name=astro-blog" rel="nofollow"><img src="https://vercel.com/button" alt="Deploy with Vercel" /></a>
<a href="https://app.netlify.com/start/deploy?repository=https://github.com/mongoRolls/astro-blog" rel="nofollow"><img src="https://www.netlify.com/img/deploy/button.svg" alt="Deploy to Netlify" /></a>
<a href="https://stackblitz.com/github/mongoRolls/astro-blog" rel="nofollow"><img src="https://developer.stackblitz.com/img/open_in_stackblitz.svg" alt="Open in StackBlitz" /></a>
</p>

## 👋 Introduction

如果你想要搭建一个类似的站点，可直接 [Fork](https://github.com/mongoRolls/astro-blog/fork) 本仓库使用，或者通过 [Vercel](https://vercel.com/new/clone?repository-url=https://github.com/mongoRolls/astro-blog/tree/main&project-name=blog&repo-name=blog) 一键部署。

比起 docusaurus, 我更喜欢 astro 的轻量, 不用纠结选择哪个 blog 主题，自己 diy 随便改。

## 特性

- ✨ 极简设计风格
- 🎨 深色模式支持
- 📱 响应式布局
- 🚀 快速加载
- 📝 Markdown/MDX 支持
- 🔍 SEO 优化
- 📰 RSS 订阅
- 🎯 代码高亮
- 🌈 自定义主题色
- 🔄 平滑页面转换
- 🌐 中文与英文双语路由、搜索和 RSS

## 技术栈

- [Astro](https://astro.build) - 静态站点生成器
- [TailwindCSS](https://tailwindcss.com) - 样式框架
- [TypeScript](https://www.typescriptlang.org/) - 类型安全
- [MDX](https://mdxjs.com/) - Markdown 增强

## 快速开始

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build

# 预览
pnpm preview
```

## 项目结构

```bash
.
├── public/
├── src/
│   ├── components/      # 组件
│   ├── content/         # 博客内容
│   ├── data/           # 配置数据
│   ├── layouts/        # 布局模板
│   ├── pages/          # 页面
│   └── styles/         # 样式
├── astro.config.mjs    # Astro 配置
└── package.json
```

## 双语内容

中文保留现有根路径，英文页面使用 `/en/` 前缀。英文文章和独立页面分别放在：

```text
src/content/blog/en/
src/content/pages/en/
```

英文内容需在 frontmatter 中设置 `lang: en`。使用相同的 `translationKey` 关联中英文版本；当英文文件名需要与中文文件名区分时，用 `route` 保持对外 URL 一致，例如：

```yaml
lang: en
route: example-post
translationKey: example-post
```

## License

GPL-3.0 License © 2025 MongoRolls

# 环境变量配置

## 图片资源配置

项目支持通过环境变量控制图片资源加载策略：

### ASTRO_IMAGE_SOURCE

控制图片资源来源，可选值：

- `local`: 使用本地 public 文件夹中的图片
- `oss`: 使用阿里云 OSS CDN 图片

**默认行为：**

- 开发环境 (`npm run dev`): 自动使用 `local`
- 生产环境 (`npm run build`): 自动使用 `oss`

**手动设置：**

```bash
# 强制使用本地图片
ASTRO_IMAGE_SOURCE=local npm run dev

# 强制使用 OSS 图片
ASTRO_IMAGE_SOURCE=oss npm run dev
```

### 图片目录结构

```
public/
├── cover-images/          # 博客封面图片
├── tech/                  # 技术栈图标
├── friends/               # 友链头像
└── ...                   # 其他静态资源
```

## 构建说明

封面图需手动维护在 `public/cover-images/` 目录。OSS 路径、密钥和同步命令见 [`.codex/AGENTS.md`](.codex/AGENTS.md) 的「图片与环境」。
