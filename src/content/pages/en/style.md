---
title: Markdown Style Guide
lang: en
route: style
translationKey: style
seo:
  title: Markdown Style Guide
  description: A compact preview of the Markdown styles used on MongoRolls.
---

This page previews the Markdown elements used throughout the blog.

## Headings

Headings from level two through level six share the site’s serif typography and spacing.

### A level-three heading

#### A level-four heading

## Code and syntax highlighting

Inline code looks like `const greeting = 'Hello'`.

```js
function greet(name) {
  return `Hello, ${name}!`
}

console.log(greet('reader'))
```

## GitHub-style alerts

> [!NOTE]
> Notes highlight useful context that is worth noticing while skimming.

> [!TIP]
> Tips suggest a practical way to make a task easier.

> [!WARNING]
> Warnings call attention to behavior that may have unwanted consequences.

## Emphasis

Text can be _italic_, **bold**, or **_both_**. Strikethrough is also supported with ~~two tildes~~.

## Links

[Astro](https://astro.build/) is the framework used to build this site.

## Lists

1. First ordered item
2. Second ordered item
3. Third ordered item

- An unordered item
- Another unordered item
- One more unordered item

## Blockquote

> Good tools disappear into the work and leave the idea in focus.

## Table

| Feature | Supported | Example |
| --- | --- | --- |
| Emphasis | Yes | **Bold text** |
| Inline code | Yes | `pnpm build` |
| Links | Yes | [Home](/en/) |
