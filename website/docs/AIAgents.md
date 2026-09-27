---
id: ai-agents
title: WebdriverIO for Coding Agents
description: Set up Cursor, Claude Code, Copilot or any other coding agent to write, run and debug WebdriverIO tests using the machine-readable docs, the WebdriverIO MCP server and DevTools traces.
---

Most WebdriverIO tests today are written together with a coding agent. This page shows how to give an agent the three things it needs to do that well: **current documentation** (so it writes v10 code instead of guessing), **a way to drive the app under test** (so it can explore the UI and verify selectors), and **debuggable test runs** (so it can fix failing tests on its own).

## 1. Give your agent the documentation

Every page on this site is available as clean Markdown, without navigation, scripts or styling:

| Resource | URL | Use it for |
| --- | --- | --- |
| Documentation index | [`https://webdriver.io/llms.txt`](https://webdriver.io/llms.txt) | A curated map of all pages with one-line summaries. Start here. |
| Full documentation | [`https://webdriver.io/llms-full.txt`](https://webdriver.io/llms-full.txt) | The complete docs in a single file, for agents with large context windows. |
| Any single page | Append `.md` to the URL, e.g. [`/docs/api/browser/url.md`](https://webdriver.io/docs/api/browser/url.md) | Loading exactly the page the agent needs. |
| Content negotiation | Request any `/docs/*` URL with `Accept: text/markdown` | Agents and tools that fetch URLs as-is. |

Each doc page also has a **Copy page** menu with options to copy the page as Markdown or open it directly in ChatGPT, Claude or Cursor.

### Docs MCP server

The documentation is also available as a remote MCP server at `https://webdriver.io/mcp`. It gives an agent three tools: `search_docs` to find the right page, `get_page` to read it as Markdown, and `list_sections` to load a whole section at once. Add it next to the WebdriverIO MCP server described below:

```json title=".mcp.json"
{
    "mcpServers": {
        "webdriverio-docs": {
            "url": "https://webdriver.io/mcp"
        }
    }
}
```

For Claude Code, run `claude mcp add --transport http webdriverio-docs https://webdriver.io/mcp`.

### Add the docs to your agent

To make the docs available in every chat, add the index to your agent:

- **Cursor**: add `https://webdriver.io/llms.txt` as a custom doc in the Cursor settings (_Indexing & Docs_), then reference it in chat with `@` and the name you gave it.
- **Claude Code / Codex / other CLI agents**: add the link to your project's `AGENTS.md` or `CLAUDE.md` (see [project rules](#3-add-project-rules) below). The agents fetch the pages they need on demand.

## 2. Let your agent drive the browser or app

The [WebdriverIO MCP server](/docs/mcp) (`@wdio/mcp`) lets an agent open browsers (Chrome, Firefox, Edge, Safari), native and hybrid mobile apps (via Appium) and cloud devices, inspect the accessibility tree, click, type and take screenshots. Agents use it to explore a page before writing a test, to find robust selectors, and to reproduce a failure step by step.

Add it to your MCP client configuration (for example `.mcp.json` or `.cursor/mcp.json` in your project):

```json title=".mcp.json"
{
    "mcpServers": {
        "wdio-mcp": {
            "command": "npx",
            "args": ["-y", "@wdio/mcp"]
        }
    }
}
```

For Claude Code, register it from the command line:

```sh
claude mcp add --transport stdio wdio-mcp -- npx -y @wdio/mcp
```

See the [MCP configuration](/docs/mcp/configuration) for session options, and [Cloud Providers](/docs/mcp/cloud-providers) to run on BrowserStack, Sauce Labs, TestMu AI or TestingBot.

## 3. Add project rules

Agents follow the conventions of a project much more reliably when they are written down. Add a section like the following to the `AGENTS.md` (or `CLAUDE.md`, `.cursor/rules`) of your test project and adjust the paths and commands:

````md title="AGENTS.md"
## End-to-end tests (WebdriverIO v10)

- Docs: https://webdriver.io/llms.txt - fetch the relevant page as Markdown (append `.md`) before using an API you are not sure about. Do not use APIs from WebdriverIO v8 or older.
- Config: `wdio.conf.ts`. Specs: `test/specs/**/*.e2e.ts`. Page objects: `test/pageobjects/`.
- Run all tests: `npx wdio run wdio.conf.ts`
- Run a single spec: `npx wdio run wdio.conf.ts --spec test/specs/login.e2e.ts`
- Tests are async: always `await` commands, e.g. `await $('button').click()`. Never use the removed sync mode.
- Prefer user-facing selectors: accessibility name or text (`$('aria/Submit')`, `$('button=Submit')`), then `data-testid`. Avoid XPath and generated CSS classes.
- Rely on auto-waiting and `expect-webdriverio` matchers (`await expect($('h1')).toHaveText('Welcome')`) instead of `browser.pause()`.
- To explore the app or verify a selector, use the `wdio-mcp` MCP server.
- When a test fails, read the DevTools trace in `test-results/` (see `transcript.md`) before changing code.
````

The rules above reflect the recommendations in [Best Practices](/docs/bestpractices), [Selectors](/docs/selectors) and [Auto-waiting](/docs/autowait).

## 4. Let the agent debug failing tests

The [WebdriverIO DevTools](/docs/devtools) service can record a **trace** of every run: a portable artifact with a step-by-step Markdown transcript, screenshots, accessibility-tree snapshots and network logs for each action. This gives an agent the same information a human gets from watching the test, without needing a browser window.

Install the service and enable trace mode:

```sh
npm install @wdio/devtools-service --save-dev
```

```ts title="wdio.conf.ts"
export const config: WebdriverIO.Config = {
    // ...
    services: [
        ['devtools', {
            mode: 'trace',
            // one trace per test makes it easy to hand a single failure to an agent
            traceGranularity: 'test',
            // plain files instead of a zip, so agents can read them directly
            traceFormat: 'ndjson-directory'
        }]
    ]
}
```

After a run, traces are written to `test-results/`. Point your agent at the folder of the failing test and ask it to read `transcript.md` first. See [Trace Mode](/docs/devtools/wdio/trace-mode) for all options, including granularity and retention.

## Recommended workflow

1. Ask the agent to explore the feature under test with the MCP server and propose selectors.
2. Let it write the spec and page object following your project rules, fetching WebdriverIO docs pages as needed.
3. Have it run the single spec with `--spec` and iterate until it passes.
4. If a test fails in CI, give the agent the trace of that test and let it fix the test or report the bug.

## Next steps

- [Getting Started](/docs/gettingstarted) - create a project with `npm init wdio@latest`
- [WebdriverIO MCP](/docs/mcp) - all tools the MCP server provides
- [DevTools](/docs/devtools) - live mode and trace mode
- [Best Practices](/docs/bestpractices) - what good WebdriverIO tests look like
