# UI 主题规范

本文是当前博客 UI 的维护参考，内容从 `src/styles/global.css`、`tailwind.config.cjs`、`src/layouts/BaseLayout.astro`、`src/components/` 与页面样式提炼。源码仍是最终事实来源；当实现改变时，应同步更新本文。

## 1. 视觉方向

整体是偏编辑出版物的极简博客：正文使用清晰的无衬线字体，标题和导航使用衬线字体；大面积使用主背景与文字对比，通过细边框、轻阴影、下划线和少量蓝紫渐变表达层级。文章卡片是视觉表现最强的区域，包含切角、封面遮罩和悬停强调。

界面同时支持浅色和深色。不得仅反转颜色；应复用已有语义变量，使文字、背景、边框、卡片和链接分别适配。

## 2. 来源与优先级

出现冲突时按以下顺序判断：

1. 组件或页面中实际生效的局部样式。
2. `src/styles/global.css` 的语义 CSS 变量与基础规则。
3. `tailwind.config.cjs` 的主题映射和 Typography 配置。
4. 本文档。

当前实现存在多套蓝色表达，不应将它们误认为一个令牌：站点品牌/浏览器主题色使用 `#425bc5`，Tailwind `primary` 色阶是 Sky，暗色 CSS 主色变量为 `92 124 255`。

## 3. 颜色

### 3.1 全局语义令牌

令牌定义于 `src/styles/global.css`。RGB 三元组按源码原值记录。

| 语义 | 浅色 | 深色 |
| --- | --- | --- |
| `--color-text-main` | `23 23 23`（`#171717`） | `244 246 255` |
| `--color-text-p` | `32 35 40`（`#202328`） | `214 218 236` |
| `--color-text-muted` | `107 114 128` | `148 153 176` |
| `--color-bg-main` | `255 255 255`（`#FFFFFF`） | `15 15 16` |
| `--color-bg-muted` | `240 240 240`（`#F0F0F0`） | `30 41 59`（`#1e293b`） |
| `--color-bg-card` | `255 255 255` | `31 31 34` |
| `--color-border-main` | `23 23 23` | `48 48 52` |
| `--color-border-card` | `209 213 219` | `62 66 76` |
| `--color-primary` | `14, 165, 233` | `92 124 255` |
| `--color-primary-dark` | `56, 189, 248` | `76 105 220` |
| `--color-primary-glow` | 未定义 | `140 170 255` |

浅色还定义 `--color-secondary: 236, 72, 153`。它目前没有对应的深色覆盖；使用前要检查实际对比度。

### 3.2 链接令牌

| 令牌 | 浅色 | 深色 |
| --- | --- | --- |
| `--link-fg` | `rgba(23, 23, 23, 0.92)` | `rgba(230, 230, 227, 0.95)` |
| `--link-bg-hover` | `rgba(55, 53, 47, 0.08)` | `rgba(255, 255, 255, 0.12)` |
| `--link-bg-active` | `rgba(55, 53, 47, 0.12)` | `rgba(255, 255, 255, 0.18)` |

正文链接由 Typography 配置控制：默认主文字 `0.86` 透明度、`1.35px` 下划线、`0.2em` 偏移；悬停提升文字和下划线对比，并使用 muted 背景。`Link.astro` 则采用无下划线的圆角底色反馈。

### 3.3 品牌色与局部强调

- `src/data/site-config.ts` 的 `themeColor`、文章标题和导航签名使用 `#425bc5`。
- 首页、文章列表与关于页的强调渐变使用 `#60a5fa → #e879f9`。
- 标签页另有 `#425bc5 → #60a5fa` 渐变。
- Tailwind 扩展的 `primary-50` 至 `primary-950` 对应标准 Sky 色阶，基准 `primary-500` 为 `#0ea5e9`。
- 搜索结果、目录激活态、代码复制成功/失败等局部状态仍使用 Tailwind 蓝色、绿色、红色或组件硬编码色。维护既有组件时沿用其状态语义；新通用组件优先采用全局变量。

## 4. 字体与排版

字体在 `BaseHead.astro` 中本地引入：Inter Variable、Newsreader Variable，以及 Fira Code 的 `400/500/600` 字重。

| 用途 | 字体栈 |
| --- | --- |
| 正文 / UI | `Inter`, `Noto Sans SC`, `PingFang SC`, `Microsoft YaHei`, `sans-serif`，再回退到 Tailwind 默认 sans |
| 标题 / 编辑感元素 | `Newsreader`, `Source Han Serif SC`, `Noto Serif SC`, `Georgia`, `serif`，再回退到默认 serif |
| 代码 | `Fira Code`, `JetBrains Mono`，再回退到默认 mono |

基础约定：

- `body` 使用 sans，字距 `0.01em`。
- `h1`、`h2`、`h3` 使用 serif，字距 `-0.02em`。
- Markdown 正文的 `p/li/span` 为 `1.02rem / 1.5rem`，字重 `400`，上下外边距 `0.85em`。
- Markdown 标题：`h1 2.35rem/700`、`h2 1.85rem/650`、`h3 1.45rem/650`，行高均为 `1.25`。
- 行内代码使用 Fira Code、`0.92em/500`；代码块内代码为 `0.95em/500`。
- 衬线体可配合 italic 用于目录标题、列表日期、章节引导等编辑性元素，但正文交互控件仍应优先保证清晰度。

## 5. 布局与响应式

- 页面外框最大宽度 `1012px`；中间正文列最大宽度 `674px`。
- `lg` 起显示左右各 `w-40` 的占位列，右侧承载文章目录；正文仍居中。
- 小于 `md` 时主区域使用 `20px` 水平内边距（`max-md:px-5`）；导航内部小屏使用 `16px`。
- 导航吸顶，`z-index: 9999`，背景为浅色 `gray-300/30`、深色 `gray-800/30`，并使用 `10px` backdrop blur。
- 桌面正文目录在 `top: 6rem` 附近吸顶，最大高度 `70vh`；标题锚点也预留 `6rem` 滚动偏移。
- 文章卡片在 `768px` 以上采用文字/图片横排，图片占 `45%` 且最小宽度 `300px`；移动端改为图片在上。

新增页面应优先复用 `BaseLayout.astro` 的宽度体系，不自行创建接近但不同的容器宽度。

## 6. 形状、边框与阴影

- 全局图片默认 `rounded-lg`。
- 基础按钮和图标按钮使用 `rounded-full`、主背景、主文字与主边框；悬停切换到 muted 背景。
- 常规面板多使用 `rounded-lg`，技术栈容器使用 `rounded-xl`。
- 文章卡片边框为 `2px`、半径强制 `10px`，外形使用左下切角；移动端切角比例更大。
- 浅色卡片阴影：`0 4px 15px rgba(0,0,0,.06)`；悬停：`0 10px 25px rgba(0,0,0,.12)`。
- 深色卡片使用两层蓝黑阴影：默认 `0 18px 35px rgba(8,10,20,.55), 0 6px 14px rgba(25,31,55,.35)`；悬停使用更深、更大的两层阴影。
- 边框通常通过 `--color-border-main` 或 `--color-border-card` 加透明度表达，不新增接近的灰色时应先复用现有语义。

## 7. 组件模式

### 导航与主题

- 桌面导航为横向菜单；移动端菜单从导航下方展开，使用虚线主边框。
- 当前路由由 `NavLink.astro` 用细下划线标记。
- 主题切换按钮为 `32×32px` 容器内的圆形按钮，太阳/月亮图标为 `24×24px`；悬停缩放到 `1.05`，按下缩放到 `0.95`。
- 主题选择写入 `localStorage.theme`；没有用户选择时跟随 `prefers-color-scheme`。不要改成另一套 `data-theme` 机制而不同时迁移现有 `html.dark` 规则。
- 阅读进度条固定在视口顶部，高度 `2px`，`z-index: 10000`（高于吸顶导航），使用 `--color-primary` 并以 `scaleX` 表示进度。
- 回到顶部按钮复用 `IconButton.astro`，固定在右下角 `z-index: 40`，滚动超过约 `480px` 后显示；必须提供 `aria-label`，并在隐藏时设置 `aria-hidden` 与 `tabindex="-1"`。
- 进度条与回到顶部需在 `astro:page-load` / `astro:before-swap` 中绑定和清理，并遵守 `prefers-reduced-motion`。

### 按钮与链接

- 有文字的通用操作使用 `Button.astro`：横向内边距 `20px`、纵向 `8px`、衬线斜体、胶囊形。
- 纯图标操作使用 `IconButton.astro`：`8px` 内边距、圆形边框，并必须提供可读的 `aria-label`。
- 正文富链接使用 `Link.astro`：危险协议降级为纯文本，外链默认新窗口打开并添加 `noopener noreferrer`。

### 文章卡片

- 卡片内容顺序为标题、日期、摘要与行动提示，封面图使用 `1200×630` 固有尺寸。
- 悬停上移 `4px`，触摸按下上移 `2px`；图片悬停放大到 `1.05`。
- 顶边主色强调从 `0` 扩展到 `100%`，左下角有主色三角装饰；这些属于文章卡片特征，不应无差别复制到普通面板。

### 内容排版

- Markdown 容器使用 `prose dark:prose-invert max-w-none`，定制规则集中在 `tailwind.config.cjs`。
- `pre` 使用 muted 背景、`0.6rem` 圆角、`1rem` 内边距、最大高度 `75vh`。
- 引用块使用衬线斜体、`3px` 左边框和 muted 半透明背景。
- 表格使用细分隔线、交替行背景与行悬停反馈；标题行权重 `700`。
- 代码块复制按钮固定在右上角，具备默认、成功和失败三种状态及清晰焦点轮廓。

## 8. 动效与状态

- 全局主题颜色过渡为 `300ms`。
- 普通链接背景过渡 `150ms`；目录链接 `200ms`；文章卡片多为 `300–500ms`。
- 卡片主过渡曲线为 `0.3s cubic-bezier(0.165, 0.84, 0.44, 1)`。
- 移动菜单使用 `cubic-bezier(0.4, 0, 0.2, 1)` 分阶段完成图标和面板变化。
- 技术栈跑马灯为 `20s linear infinite`，悬停暂停。
- 全局 `prefers-reduced-motion: reduce` 将动画和过渡压缩到 `0.01ms`；技术栈和代码复制按钮还有组件级降级。新增动效必须提供等价降级。

## 9. 可访问性与交互底线

- 图标按钮必须有 `aria-label`；装饰 SVG 使用 `aria-hidden="true"`。
- 移动菜单维护 `aria-expanded`、`aria-controls`，支持 `Escape` 关闭并恢复焦点。
- 搜索弹层支持 `Cmd/Ctrl + K`、`Escape`、Tab 焦点环、遮罩关闭与关闭后的焦点恢复；结果区使用 `aria-live` / `aria-busy`。
- 可交互元素不得只依赖颜色表达状态；保留下划线、位移、轮廓、文本或形状中的至少一种额外信号。
- 新增键盘交互或全局监听时，沿用 `AbortController` 和 `astro:before-swap` 清理模式，避免 View Transitions 后重复绑定。

## 10. 维护规则

- 优先写语义变量或复用已有组件，不在新组件中复制近似色值、宽度和阴影。
- 若新增通用令牌，同时补齐浅色与深色值，并在 Tailwind 映射需要时同步 `tailwind.config.cjs`。
- 修改 Typography 时检查文章页、普通静态页、表格、引用、行内代码与代码块。
- 修改主容器宽度时同时检查导航、页脚、正文、文章目录和搜索弹层。
- 修改主题初始化时验证首次加载无闪烁、系统主题变化、手动选择持久化和 Astro 页面切换。
- 视觉改动至少运行 `pnpm lint` 与 `pnpm check`；影响构建期样式、内容或页面输出时再运行 `pnpm build` 或完整 `pnpm verify`。
