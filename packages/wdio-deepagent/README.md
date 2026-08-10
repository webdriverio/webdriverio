# @wdio/deepagent

**BYOK LangChain Deep Agent harness for WebdriverIO** — an interactive
agent REPL/CLI that traverses the app under test through `@wdio/mcp`,
makes runs reproducible and healable with `@wdio/devtools-service`
traces, and helps you set up a correct `wdio.conf` for your framework.

Built on the OSS [Deep Agents](https://docs.langchain.com/oss/javascript/deepagents/overview)
harness (`deepagents` → `createDeepAgent`). You bring your own model key
(OpenRouter / OpenAI / Anthropic / Ollama) — nothing runs on a managed
backend. It bundles `@wdio/mcp` as the traversal layer and works with
`@wdio/devtools-service` trace artifacts (the service runs in your
project, not here).

> Design plan: [`deepagent_repl_plan.md`](../../deepagent_repl_plan.md) ·
> Docs: [webdriver.io/docs/deepagent](https://webdriver.io/docs/deepagent) ·
> Definition of usable: [`docs/USABILITY.md`](docs/USABILITY.md)

## Install

```sh
npm install @wdio/deepagent
```

## Quick start

```sh
# 1. set your model key
export OPENROUTER_API_KEY=sk-…

# 2. generate a framework-correct wdio.conf.ts (with the deepagent block)
wdio-deepagent init

# 3. chat with the agent
wdio-deepagent repl
```

Or drive it one-shot / from CI:

```sh
wdio-deepagent run "Verify the login flow on Chrome and report failures"
wdio-deepagent diagnose test-results/trace-<session>.zip --spec test/specs/login.e2e.js
wdio-deepagent mcp        # serve the agent/tools as an MCP server
```

The same commands are available as `wdio deepagent …`.

## Configuration

```ts
// wdio.conf.ts
export const config = {
    // ...framework/services as usual...
    deepagent: {
        model: { provider: 'openrouter', model: 'moonshotai/kimi-k3' },
        heal: 'ask', // 'ask' (human-approve writes) | 'propose' (read-only diffs) | 'auto' (CI healing)
    },
}
```

Env vars: `OPENROUTER_API_KEY` / `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`
(ollama needs none), or `DEEPAGENT_MODEL=provider:model` and
`DEEPAGENT_HEAL=ask|propose|auto` to skip the config block entirely.

## Platform notes

- **Linux / macOS** — fully supported.
- **Windows** — known limitation: the default MCP spawn (`npx`) needs a
  `.cmd` shim / `shell: true` that the stdio transport does not use. Set
  `deepagent.mcp.command` to the full `node` path + server script (or a
  `.cmd` wrapper) when running on Windows hosts.
- The harness runs the locally installed `@wdio/mcp` binary (the exact
  version pinned in `package.json`) when available, falling back to
  `npx -y @wdio/mcp` otherwise.

## How it works- **Traversal** — the agent loads the `@wdio/mcp` 29-tool surface as an
  MCP client (sessions, navigation, elements, selectors, screenshots,
  cookies, mobile gestures); WebdriverIO executes underneath.
- **Trace** — `diagnose` ingests a devtools `trace.zip`, reproduces the
  failing spec under a trace-mode overlay, diffs old vs new runs, and
  heals the spec (spec/page objects only, never config or secrets).
- **Site knowledge base** — per-page a11y snapshots/element maps are
  accumulated while browsing (context-injection, no embeddings in v1).
- **Model config** — one zod schema + resolver (the wdio-agent-service
  pattern): `{ provider, model, baseURL?, apiKey?, temperature?,
  maxTokens?, request? }`. A `request` override is a text-only escape
  hatch and cannot call tools.

## License

MIT
