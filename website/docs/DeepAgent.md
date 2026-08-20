---
id: deepagent
title: DeepAgent (LangChain agent harness)
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
        llm: {
            provider: 'openrouter',               // openrouter | openai | anthropic | ollama | llama-cpp | lm-studio
            model: 'moonshotai/kimi-k3',
        },
        heal: 'ask',                              // ask | propose | auto
        appendInstructions: 'Use data-testid selectors and the project page-object layer.', // appended to the built-in instructions
        // instructionsPath: 'agent-instructions.md', // REPLACES the built-in instructions entirely (cwd-relative)
        // appendInstructionsFile: 'notes/agent.md',  // file contents appended (cwd-relative)
        // maxHealAttempts: 2,                        // fix attempts before giving up (default 2, min 1)
    },
}
```

All three instruction options are optional. `appendInstructions` and `appendInstructionsFile` teach the agent your project's conventions — selector style, page-object patterns, house idioms — on top of the built-in instructions. `instructionsPath` instead *replaces* the built-in instructions entirely with your file: a power-user escape hatch that forks the agent's behavior, but leaves you maintaining a stale copy on every harness upgrade — most users want the append options. When several are set, the final prompt assembles as: built-in instructions (or your `instructionsPath` replacement) → a pointer to your wdio config → `appendInstructionsFile` contents → `appendInstructions` inline.

```sh
export OPENROUTER_API_KEY=sk-…   # or OPENAI_API_KEY / ANTHROPIC_API_KEY; ollama needs no key
```

llama-cpp and lm-studio need no API key — point `baseURL` at the local server (if omitted it silently defaults to the standard OpenAI endpoint, which local servers don't serve).

Or skip the file entirely — env vars work too:

```sh
export DEEPAGENT_MODEL=openrouter:moonshotai/kimi-k3
export DEEPAGENT_HEAL=ask
```

## Commands

```sh
npx wdio config                    # config setup — select the @wdio/deepagent plugin
wdio-deepagent repl                # interactive agent session
wdio-deepagent repl --no-mcp       # run without the @wdio/mcp browser tool surface
wdio-deepagent run "<prompt>"      # one-shot mission (CI-able)
wdio-deepagent diagnose <trace.zip> [--spec <path>] [--heal mode]
wdio-deepagent mcp                 # serve the agent/tools as an MCP server
```

wdio-deepagent is a standalone binary: install it in any project (`npm i -D @wdio/deepagent`) or run it via `npx wdio-deepagent repl`. It reads the project's `deepagent` config block, so the same config drives both.

## How it works

- **Traversal** — the agent loads the `@wdio/mcp` full tool surface as an **MCP client**: sessions, navigation, elements, selectors, screenshots, cookies, mobile gestures, script execution. WebdriverIO executes underneath.
- **Trace** — `diagnose` ingests a devtools `trace.zip` (action NDJSON, network, `transcript.md`, a11y snapshots, screenshots), reproduces the failing spec under a trace-mode overlay, diffs old vs new runs, and heals the spec.
- **Heal modes**
  - `ask` (default): the agent proposes fixes and **every write is gated by human approval** (`interrupt_on`).
  - `propose`: the filesystem is **read-only**; the agent emits diffs only.
  - `auto`: unattended CI healing of specs/page objects — never config or secrets.
  - `maxHealAttempts` (default 2, minimum 1): how many times the agent may attempt a fix. After each attempt the spec is re-run to verify; if it still fails and attempts remain, the agent gets the new error and tries again — each extra attempt costs one real spec re-run (measured 11-20s). A retry only happens when a spec is available to re-run (i.e. `--spec` was passed / reproduction is on), and the reported `verification.healed` plus `healAttempts` reflect the final attempt.
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
| RAG over docs/site (embeddings) | later phase |
