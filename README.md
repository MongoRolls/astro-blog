<h2 align="center">
MongoRolls的个人博客
</h2>

<p align="center">
<a href="https://mongorolls.cn">🖥 Online Preview</a>
<br /><br />
<a href="https://vercel.com/new/clone?repository-url=https://github.com/mongoRolls/astro-blog/tree/main&project-name=astro-blog&repo-name=astro-blog" rel="nofollow"><img src="https://vercel.com/button" /></a>
<a href="https://app.netlify.com/start/deploy?repository=https://github.com/mongoRolls/astro-blog" rel="nofollow"><img src="https://www.netlify.com/img/deploy/button.svg" /></a>
<a href="https://stackblitz.com/github/mongoRolls/astro-blog" rel="nofollow"><img src="https://developer.stackblitz.com/img/open_in_stackblitz.svg" /></a>
</p>

## 👋 Introduction

如果你想要搭建一个类似的站点，可直接 [Fork](https://github.com/mongoRolls/astro-blog/fork) 本仓库使用，或者通过 [Vercel](https://vercel.com/new/clone?repository-url=https://github.com/mongoRolls/astro-blog/tree/main&project-name=blog&repo-name=blog) 一键部署。

比起 docusaurus, 我更喜欢 astro的轻量, 不用纠结选择哪个blog主题，自己diy随便改。

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

构建时会自动下载 Unsplash 图片到本地 `public/cover-images/` 目录，但生产环境默认使用 OSS 加速访问。
