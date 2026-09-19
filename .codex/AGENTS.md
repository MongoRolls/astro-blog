# Astro Blog AI 协作指引

本文件是仓库内 AI 协作规则的唯一真相源；根目录 `AGENTS.md`、`CLAUDE.md` 与 Cursor 入口只保留指针。

## 协作与完成标准

- 全程使用中文，代码标识符、命令和必要的技术名词保留原文。
- 修改前查看 `git status --short`，以当前工作树为准；保留用户已有改动，不覆盖、回退或提交任务范围外的变更。
- 沿用现有 Astro、TypeScript、Tailwind CSS 和内容集合约定，修改保持聚焦；未经要求不引入框架、依赖或新的抽象层。
- 对实现或修复请求，持续完成相关修改、必要验证和本次引入问题的修复，再交付结果；常规本地编辑与检查无需逐步确认。仅在缺少影响结果的关键信息或超出授权范围时询问。
- 代码审查默认只报告问题；代码瘦身先给候选清单，由用户选择范围。已明确授权的实现或删减直接执行。
- 除非用户明确要求，不创建提交、不推送。提交采用简洁的中文 Conventional Commits，按独立意图拆分，不添加 `Co-Authored-By`。
- 交付说明实际变化、验证结果和未解决的阻碍；不要把尚未运行的检查报告为通过。

## 按任务查阅

项目是 Astro 静态内容博客，使用 MD/MDX、TypeScript、Tailwind CSS 和 Pagefind。只读取与当前任务相关的入口及依赖；版本、命令和契约以以下文件为准，不在指令中维护副本。

| 任务 | 事实来源与注意事项 |
| --- | --- |
| 依赖、运行环境与命令 | `package.json`、`pnpm-lock.yaml`、`.nvmrc`；使用 pnpm，不用 npm/yarn 改写锁文件 |
| 内容与 frontmatter | `src/content.config.ts`；发布、草稿和语言行为同时核对 `src/utils/data-utils.ts` 与相关页面查询 |
| 路由、语言和站点数据 | `src/pages/`、`src/data/site-config.ts`；不要从旧文档推断路由或内容字段 |
| UI、主题与交互 | `UI-THEME.md`、`src/styles/global.css`、`tailwind.config.cjs` 及相关组件；以源码为最终依据 |
| 页面骨架和元数据 | `src/layouts/BaseLayout.astro`、`src/components/BaseHead.astro` |
| 构建期内容处理 | `astro.config.mjs`、`src/utils/remark-*`；不能仅凭运行时引用判断代码是否无用 |
| 图片与 OSS | `src/config/env.ts`、`src/config/image.ts`、`scripts/oss-sync.mjs` 及下方约束 |

UI 变更复用现有基础组件和主题变量，保留键盘操作、焦点恢复、`aria-*`、减少动态效果偏好及 Astro 页面切换时的事件清理。新增设计令牌时同步更新 `UI-THEME.md`；布局变更检查桌面目录栏和移动端边距。

## 图片与环境

- 图片源由 `ASTRO_IMAGE_SOURCE=local|oss` 控制，默认开发用本地、生产用 OSS；实现以 `src/config/env.ts` 为准。
- 封面、Hero 和 OSS 拼接复用 `src/config/image.ts`，新调用点不复制 CDN 域名或旧 `/img/` 路径。
- Bucket 为 `mongorolls-images`（`oss-cn-shenzhen`），本站独占前缀 `blog/`。文章图片放 `blog/{content-id}/`；公共分类为 `cover-images/`、`friends/`、`tech/`、`site/`，均在 `blog/` 下。旧 `/img/` 对象保留兼容，不删除。
- 文章配图以 OSS 为真相源；MDX 使用 `ossAsset()` 或完整 OSS URL，不使用 `../../../public/blog/...`。`public/blog/` 仅作不入库的粘贴暂存，确认上传成功并改好引用后删除对应本地副本。
- 站点级本地文件仍放 `public/cover-images/`、`public/friends/`、`public/tech/`、`public/logo.png`，以站点根路径引用。
- AccessKey 仅写已忽略的根目录 `.env`，不写 `.env.example` 或提交。使用仅 OpenAPI 的 RAM 用户并授权 OSS，不用主账号密钥。
- 同步使用 `pnpm oss:sync:dry` 预览、`pnpm oss:sync` 上传缺失文件并 HEAD 校验；上传会写远端，只在任务包含图片上传或同步时执行。

## 验证

按改动风险选择足够的检查，通过后即可交付；出现新改动或失败时重跑受影响的检查。

- 仅文档或协作配置：检查差异、引用路径和入口一致性，无需完整构建。
- 源码：按影响选择 `pnpm lint`、`pnpm check`；涉及页面输出、内容处理或构建配置时运行 `pnpm build` 和 `pnpm test:smoke`。`test:smoke` 检查 `dist`，应使用本次构建产物。
- 跨模块改动或需要完整回归时使用 `pnpm verify`；其中已包含 lint、check、build、smoke，无需重复执行已通过且未受后续修改影响的检查。

## 本地技能

技能正文仅维护在 `.agents/skills/`，不随仓库分发；使用本地技能时，`.codex/skills`、`.claude/skills` 应为指向它的相对符号链接，这三个路径均已忽略。

技能存在且任务匹配时才读取；提交工作可使用 `.agents/skills/commit/SKILL.md`。技能缺失时按本文件的约定完成任务，不把未安装的技能当作前置条件。
