# Docs Style Guide

Most people read the WebdriverIO docs through a coding agent: the agent fetches a page (usually its Markdown twin, `/docs/<page>.md`), extracts the answer and writes code from it. Write every page so that an agent that reads **only that page** produces correct, current code. Humans benefit from the same qualities.

## Every page

- **Frontmatter**: `id`, `title` and `description`. The description is one sentence saying what the page helps you do; it is what `llms.txt`, search results and link previews show. `id` and the resulting URL are permalinks, never change them (add a redirect to `vercel.json` if you really have to).
- **Summary first**: open with one short paragraph that states what the page solves and when to use it. No "In this guide we will…".
- **One concept per page**. If a page answers two different questions, split it and link between them.
- **Canonical answer first**, alternatives and edge cases afterwards. Say explicitly which option to pick by default.
- **Version notes** are explicit: "Since v10, …" or "Removed in v10, use … instead". Never describe behaviour of older major versions without saying so.
- **Stable headings**: headings become anchors that agents and error messages deep-link to. Don't rename them casually.
- **End with next steps** or related pages, and put a **Troubleshooting** section on setup/platform pages that quotes error messages literally (agents match on the exact text).

## Code examples

- **Complete and copy-pastable**: include imports and the surrounding `export const config` / `describe` / `it`. Only use `// ...` to elide config that is irrelevant to the example, never inside the logic being explained.
- **TypeScript and ESM first** (`wdio.conf.ts`, `import { browser } from '@wdio/globals'`). Add JavaScript only where it differs meaningfully.
- **Only current APIs**: async commands with `await`, `expect-webdriverio` matchers, v10 option names. No sync mode, no deprecated commands.
- **Name the file** with a code fence title: ` ```ts title="wdio.conf.ts" `.
- **Real values** over placeholders where possible (`https://webdriver.io` instead of `<your-url>`), so the example runs as-is.
- Commands run from the project root: `npx wdio run wdio.conf.ts --spec test/specs/login.e2e.ts`.

## Markdown, not UI

The Markdown twin of a page is generated from its source. Anything that only exists visually is lost for agents.

- Don't hide essential content in tabs, collapsibles, images or videos alone. Tabs are fine for alternatives (npm/yarn/pnpm, JS/TS) as long as each tab is self-contained.
- Prefer Markdown tables, lists and code fences over custom React components. If a component is necessary, make sure the same information also exists as text on the page.
- Use `mermaid` fences for diagrams, not images.
- Use admonitions (`:::info`, `:::warning`) sparingly and only for information that changes what the reader does.

## Tone

- Direct and concise, second person ("you"), present tense.
- No marketing language, no emojis in prose.
- Explain *why* only when it changes a decision; otherwise just show *how*.

## Where content goes

| Content | Location |
| --- | --- |
| Getting started, choosing a setup | `Get Started` |
| Using WebdriverIO with agents, MCP | `AI Agents` |
| How to write tests (selectors, waiting, assertions, mocking) | `Writing Tests` |
| Platform specific setup (browsers, mobile, desktop, extensions) | `Platforms` |
| Visual, accessibility, OCR testing | `Testing Types` |
| Configuration, frameworks, parallelism, CI and clouds | `Running Tests` |
| DevTools, REPL, debugging | `Debugging` |
| Every configuration option, every command | `Reference` (generated from source where possible) |
| Services, reporters, community plugins | `Ecosystem` (generated from package READMEs) |

The sidebar is defined in [`_sidebars.json`](./_sidebars.json). Every hand-written page must be listed in exactly one sidebar; `pnpm run docs:check` fails otherwise.
