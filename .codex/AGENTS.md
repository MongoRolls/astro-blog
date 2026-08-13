# Astro Blog AI 协作指引

本文件是仓库内 AI 协作规则的唯一真相源。根目录 `AGENTS.md`、`.cursor/AGENTS.md` 只保留指针；`.claude/CLAUDE.md` 通过符号链接复用根指针。修改协作规则时只改本文件。

## 基本原则

- 全程使用中文；代码标识符、命令和必要的技术名词保留原文。
- 先读取相关代码、配置和 `git status`，再提出或实施修改；以当前工作树为准，不以旧文档猜测事实。
- 将未提交改动视为用户工作。不得覆盖、回退、顺手格式化或提交任务范围外的变更。
- 修改保持小而聚焦，沿用现有 Astro、TypeScript、Tailwind CSS 和内容集合约定；未经要求不要引入框架、依赖或新的抽象层。
- 不得臆造脚本、路由、内容字段、环境变量、设计令牌或部署约定。无法由仓库验证的内容要明确标注不确定性。
- UI 变更先查根目录 [`UI-THEME.md`](../UI-THEME.md)，并以实际源码为最终依据。
- 技能正文只维护在 `.agents/skills/`，该目录及 `.codex/skills`、`.claude/skills` 已列入 `.gitignore`，不进入版本库。本地仍须保持后两者为指向 `.agents/skills/` 的相对符号链接。

## 仓库事实

- 项目是静态内容博客：Astro `7.2.0`、TypeScript 严格模式、MD/MDX 内容集合、Tailwind CSS `4.3.3`、Pagefind 搜索。
- 包管理器为 `pnpm@10.13.1`；`package.json` 要求 Node.js `>=22.12.0`，`.nvmrc` 当前为 `22.20.0`。
- Astro 配置位于 `astro.config.mjs`，启用 MDX、Sitemap、自定义 Remark 处理和可选的 Rollup visualizer。
- ESLint 使用 `@antfu/eslint-config`，支持 Astro 与 TypeScript；不要假设存在 Prettier 脚本或独立测试框架。
- 网站语言为 `zh-CN`；站点元数据、导航、分页与友链数据集中在 `src/data/site-config.ts`。

## 目录与职责

```text
src/
├── components/       Astro 组件；css/ 下是文章演示组件
├── config/           环境和图片源配置
├── content/          blog 与 pages 的 Markdown/MDX 内容
├── data/             站点配置和展示数据
├── icons/            Astro 图标组件
├── layouts/          页面骨架
├── pages/            文件路由、RSS 与搜索索引端点
├── styles/           全局样式和主题变量
├── types/            共享类型
└── utils/            内容、图片和 Remark 工具
public/               原样发布的静态资源
scripts/              清理、OSS 同步与构建产物冒烟检查
```

- 页面骨架由 `src/layouts/BaseLayout.astro` 提供；全局元数据、字体和全局 CSS 从 `src/components/BaseHead.astro` 引入。
- 页面路由以 `src/pages/` 为准。动态文章页为 `/blog/[id]`，文章归档、标签、关于页等均由对应 `.astro` 文件生成。
- 构建期内容处理入口必须同时检查 `astro.config.mjs` 和 `src/utils/remark-*`，不能仅凭运行时引用判断代码是否无用。

## 内容契约

内容集合的唯一契约是 `src/content.config.ts`：

- `blog` 读取 `src/content/blog/**/*.{md,mdx}`。必填字段为 `title`、`publishDate`；可选字段为 `excerpt`、`updatedDate`、`keywords`、`seo`；`author`、`draft`、`isFeatured`、`tags` 有默认值。
- `pages` 读取 `src/content/pages/**/*.{md,mdx}`。必填字段为 `title`；`draft` 有默认值，`seo` 可选。
- `seo.pageType` 只接受 `website` 或 `article`。修改 frontmatter 前先核对 schema，不要沿用旧文档中已不存在的集合或字段。
- 新文章默认放入 `src/content/blog/`；草稿发布逻辑须沿现有数据工具和页面查询核实。

## 图片与环境

- 唯一受支持的图片源环境变量是 `ASTRO_IMAGE_SOURCE`，值为 `local` 或 `oss`。
- 未显式设置时，开发环境使用本地资源，生产环境使用 OSS；具体判断见 `src/config/env.ts`。
- 封面、Hero 和 OSS 拼接必须走 `src/config/image.ts` 的 `ossAsset()`，不要在新调用点复制 CDN 域名或 `/img/` 旧路径。
- 本站在 Bucket `mongorolls-images`（`oss-cn-shenzhen`）下使用独立前缀 `blog/`，对象路径为 `blog/{文章 id 或分类}/{文件名}`。分类约定：

```text
blog/{content-id}/     文章封面与正文配图，content-id 与 src/content/blog 文件名一致
blog/cover-images/     默认占位封面
blog/friends/          友链头像
blog/tech/             技术栈图标
blog/site/             logo、favicon、Hero、站点级静态图
```

- 新图片禁止再写入扁平的 `/img/` 或 Bucket 根目录。旧 `/img/` 对象保留作兼容，不要删除。
- 文章配图以 OSS 为真相源，MDX 直接写 `ossAsset()` 或完整 `https://mongorolls-images.oss-cn-shenzhen.aliyuncs.com/blog/{content-id}/{file}`。不要用 `../../../public/blog/...`。
- `public/blog/` 只作粘贴暂存，不同步进 git；上传并改完引用后删除本地副本。站点级本地文件仍放 `public/cover-images/`、`public/friends/`、`public/tech/`、`public/logo.png`。
- AccessKey 只写根目录 `.env`（已 gitignore），不要写入 `.env.example` 或提交。个人主账号从 https://account.aliyun.com/login/login.htm 登录后打开 https://ram.console.aliyun.com/users，创建仅 OpenAPI 的 RAM 用户并授权 OSS，不要用主账号密钥。
- 同步命令：`pnpm oss:sync:dry` 预览，`pnpm oss:sync` 上传本地缺文件并用 HEAD 校验。实现见 `scripts/oss-sync.mjs`。
- `public/` 中仍保留的站点文件以站点根路径引用；生产封面/Hero 的 OSS 行为以 `src/config/image.ts` 为准。

## UI 与交互约束

- 主题通过 `html.dark` 类切换；首屏初始化位于 `BaseLayout.astro` 的内联脚本，用户选择存入 `localStorage.theme`。
- 全局颜色、阴影和链接状态优先复用 `src/styles/global.css` 中的 CSS 变量；Tailwind 映射和文章排版在 `tailwind.config.cjs`。
- 正文容器基准宽度为 `674px`，页面三栏外框最大宽度为 `1012px`。修改布局前检查桌面目录栏及移动端边距。
- 使用现有 `Button.astro`、`IconButton.astro`、`Link.astro`、`NavLink.astro` 等基础组件，除非其语义或能力不满足需求。
- 保留键盘操作、`aria-*`、焦点恢复、`prefers-reduced-motion` 和 Astro 页面切换时的事件清理逻辑。
- 新增颜色或交互状态前先确认现有令牌能否表达；若必须新增，同步更新 `UI-THEME.md`。

## 常用命令

```bash
pnpm install          # 安装依赖
pnpm dev              # 启动开发服务器
pnpm lint             # ESLint 检查
pnpm lint:fix         # 自动修复可修复的 lint 问题
pnpm check            # Astro/TypeScript 检查
pnpm build            # Astro 构建并生成 Pagefind 索引
pnpm test:smoke       # 检查 dist 构建产物
pnpm verify           # 依次运行 lint、check、build、smoke
pnpm preview          # 预览生产构建
pnpm oss:sync:dry     # 预览将上传到 OSS 的 blog/{id|分类}/{file}
pnpm oss:sync         # 上传本地缺文件并 HEAD 校验
ANALYZE=true pnpm build # 构建并生成 stats.html
```

不要用 `npm` 或 `yarn` 改写锁文件。只修改文档或协作配置时，可运行针对性结构检查；改动源码时至少运行与风险匹配的 `lint`、`check`、构建或冒烟检查。完整交付优先运行 `pnpm verify`。

## 工作方式

1. 查看 `git status --short`，明确用户已有改动和本次范围。
2. 读取入口、直接依赖、类型/内容契约及相关配置，确认真实调用链。
3. 实施最小修改，不处理无关告警，不删除看似未使用但尚未验证的构建期或动态入口。
4. 运行最窄且足够的验证；失败时区分本次引入的问题与既有问题。
5. 汇报修改文件、行为影响、验证结果和残余风险。除非用户明确要求，不创建提交、不推送。

## 文档与提交

- 文档必须描述当前仓库，而不是愿景；路径、命令、版本、色值和示例均需能从源码或配置核实。
- 提交时使用本地技能 `.agents/skills/commit/SKILL.md` 的流程：按独立意图拆分，使用简洁的中文 Conventional Commits，不添加 `Co-Authored-By`，且不自动推送。技能本身不随仓库分发。
- 代码审查默认只报告问题，不直接修改；代码瘦身先给候选清单，获得用户选择后再实施。
