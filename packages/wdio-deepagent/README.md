# @wdio/deepagent

**LangChain Deep Agent harness for WebdriverIO** — an interactive *bring-your-own-key* agent REPL/CLI that traverses the app under test through `@wdio/mcp`, makes runs reproducible and healable with `@wdio/devtools-service` traces.

Built on the OSS [Deep Agents](https://docs.langchain.com/oss/javascript/deepagents/overview) harness (`deepagents` → `createDeepAgent`). You bring your own model key (OpenRouter / OpenAI / Anthropic / Ollama) — nothing runs on a managed backend. It bundles `@wdio/mcp` as the traversal layer and works with `@wdio/devtools-service` trace artifacts (the service runs in your project, not here).

> Docs: [webdriver.io/docs/deepagent](https://webdriver.io/docs/deepagent) ·

## Install

```sh
npm install @wdio/deepagent
```

## Quick start

```sh
# 1. set your model key
export OPENROUTER_API_KEY=sk-…

# 2. generate a framework-correct wdio.conf.ts (with the deepagent block)
npx wdio config   # select the @wdio/deepagent plugin → LLM provider question;
                  # the devtools service is added automatically for diagnose traces

# 3. chat with the agent
wdio-deepagent repl
```

Or drive it one-shot / from CI:

```sh
wdio-deepagent run "Verify the login flow on Chrome and report failures"
wdio-deepagent diagnose test-results/trace-<session>.zip --spec test/specs/login.e2e.js
wdio-deepagent mcp        # serve the agent/tools as an MCP server
```

The same commands are available as `wdio-deepagent <command>` (install via `npm i -D @wdio/deepagent`); init was folded into the `wdio config` wizard.

## Configuration

```ts
// wdio.conf.ts
export const config = {
    // ...framework/services as usual...
    deepagent: {
        llm: { provider: 'openrouter', model: 'moonshotai/kimi-k3' },
        heal: 'ask', // 'ask' (human-approve writes) | 'propose' (read-only diffs) | 'auto' (CI healing)
        appendInstructions: 'Use data-testid selectors.', // appended to the built-in instructions
        // appendInstructionsFile: 'agent-notes.md', // file contents appended (cwd-relative)
        // instructionsPath: 'agent-instructions.md', // REPLACES the built-in instructions entirely
        // maxHealAttempts: 2, // fix attempts per diagnose run (default 2, min 1)
    },
}
```

Env vars: `OPENROUTER_API_KEY` / `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` (ollama needs none), or `DEEPAGENT_MODEL=provider:model` and `DEEPAGENT_HEAL=ask|propose|auto` to skip the config block entirely.

Local providers (ollama, llama-cpp, lm-studio) need no API key; llama-cpp and lm-studio need a `baseURL` pointing at the local server. The block the `wdio config` wizard emits omits `heal` — it defaults to `'ask'`.

## Platform notes

- **Linux / macOS** — fully supported.
- **Windows** — known limitation: the default MCP spawn (`npx`) needs a `.cmd` shim / `shell: true` that the stdio transport does not use. Set `deepagent.mcp.command` to the full `node` path + server script (or a `.cmd` wrapper) when running on Windows hosts.
- The harness runs the locally installed `@wdio/mcp` binary (the exact version pinned in `package.json`) when available, falling back to `npx -y @wdio/mcp` otherwise.

## How it works

- **Traversal** — the agent loads the `@wdio/mcp` 29-tool surface as an MCP client (sessions, navigation, elements, selectors, screenshots, cookies, mobile gestures); WebdriverIO executes underneath.
- **Trace** — `diagnose` ingests a devtools `trace.zip`, reproduces the failing spec under a trace-mode overlay, diffs old vs new runs, and heals the spec (spec/page objects only, never config or secrets).
- **Site knowledge base** — per-page a11y snapshots/element maps are accumulated while browsing (context-injection, no embeddings in v1).
- **Model config** — one zod schema + resolver (the wdio-agent-service pattern): `{ provider, model, baseURL?, apiKey?, temperature?, maxTokens?, request? `. A `request` override is a text-only escape hatch and cannot call tools.

## Roadmap

- Inject Agent Skills (SKILL.md bundles, via deepagents `skills` option) — deferred while the system prompt's `## Running tests` section covers the essential guidance; skills would replace it once progressive-disclosure knowledge grows beyond prompt-sized.
- Searchable official docs (`search_wdio_docs` tool over the webdriverio `llms-full.txt` corpus, gated by a `docsUrl` config field) — planned, not wired; the corpus is ~2.9 MB so it needs a runtime-fetched search tool, never inlining.

## License

MIT
