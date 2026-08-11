---
id: deepagent
title: DeepAgent (BYOK agent harness)
---

WebdriverIO DeepAgent is a **bring-your-own-key** agent harness built on LangChain's [Deep Agents](https://docs.langchain.com/oss/javascript/deepagents/overview). It bundles `@wdio/mcp` (the traversal layer over the app under test) and works with `@wdio/devtools-service` trace artifacts (captured by the service running in your project) for reproducible, healable runs.

## Install

```sh
npm install @wdio/deepagent
```

## Configure (BYOK)

Add a `deepagent` block to your `wdio.conf.ts` (typed once you import `@wdio/deepagent`) and set your provider key in the environment:

```ts
// wdio.conf.ts
export const config = {
    // ...framework/services as usual...
    deepagent: {
        model: {
            provider: 'openrouter',               // openrouter | openai | anthropic | ollama | llama-cpp | lm-studio
            model: 'moonshotai/kimi-k3',
        },
        heal: 'ask',                              // ask | propose | auto
    },
}
```

```sh
export OPENROUTER_API_KEY=sk-…   # or OPENAI_API_KEY / ANTHROPIC_API_KEY; ollama needs no key
```

llama-cpp and lm-studio need no API key but require a `baseURL` pointing at the local server.

Or skip the file entirely — env vars work too:

```sh
export DEEPAGENT_MODEL=openrouter:moonshotai/kimi-k3
export DEEPAGENT_HEAL=ask
```

## Commands

```sh
wdio-deepagent repl                # interactive agent session
wdio-deepagent run "<prompt>"      # one-shot mission (CI-able)
npx wdio config                    # config setup — select the @wdio/deepagent plugin
wdio-deepagent diagnose <trace.zip> [--spec <path>] [--heal mode]
wdio-deepagent mcp                 # serve the agent/tools as an MCP server
```

The same harness is available as `wdio deepagent …` (lazily loaded so the core CLI stays lean).

## How it works

- **Traversal** — the agent loads the `@wdio/mcp` 31-tool surface as an **MCP client**: sessions, navigation, elements, selectors, screenshots, cookies, mobile gestures, script execution. WebdriverIO executes underneath.
- **Trace** — `diagnose` ingests a devtools `trace.zip` (action NDJSON, network, `transcript.md`, a11y snapshots, screenshots), reproduces the failing spec under a trace-mode overlay, diffs old vs new runs, and heals the spec.
- **Heal modes**
  - `ask` (default): the agent proposes fixes and **every write is gated by human approval** (`interrupt_on`).
  - `propose`: the filesystem is **read-only**; the agent emits diffs only.
  - `auto`: unattended CI healing of specs/page objects — never config or secrets.
- **Site knowledge base** — the agent accumulates per-page a11y snapshots/element maps while browsing (context-injection; no embeddings in v1).

## Model config

One schema, one resolver — no per-provider HTTP code (the wdio-agent-service pattern):

```ts
{
    provider: 'openrouter' | 'openai' | 'anthropic' | 'ollama' | 'llama-cpp' | 'lm-studio',
    model: string,
    baseURL?: string,       // OpenAI-compatible endpoint / Ollama server
    apiKey?: string,        // falls back to the provider env var
    temperature?: number,   // default 0.1
    maxTokens?: number,     // default 8192
    request?: (input: { system?: string, user?: string }) => string | Promise<string>, // escape hatch (text-only)
}
```

## Roadmap status

| Area | Status |
|------|--------|
| Model/config layer (schema + resolver + config loading) | implemented |
| MCP client (traversal tools) | implemented |
| Trace reader + reproduce runner | implemented |
| Agent core (`createDeepAgent` harness) | implemented |
| `repl` / `run` / `diagnose` / `mcp` CLI | implemented |
| Heal engine (ask / propose / auto) | implemented |
| `wdio deepagent` CLI hook | implemented |
| RAG over docs/site (embeddings) | later phase |
