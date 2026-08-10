# `@wdio/deepagent` — BYOK Deep Agent harness for WebdriverIO

> Design plan for a new monorepo package that turns WebdriverIO into a
> LangChain **Deep Agents** harness: an interactive, bring-your-own-key
> agent REPL/CLI that traverses the app under test through `@wdio/mcp`,
> makes runs reproducible and healable with `@wdio/devtools-service`
> traces, and helps the user generate a correct `wdio.conf` for their
> framework.

---

## 1. What this is

`@wdio/deepagent` is a **BYOK agent harness** built on the OSS
[Deep Agents](https://docs.langchain.com/oss/javascript/deepagents/overview)
(`deepagents` → `createDeepAgent`). The user brings their own model key
(OpenRouter / OpenAI / Anthropic / Ollama); nothing runs on LangSmith or a
managed backend. The harness bundles:

- **`@wdio/mcp`** — the agent's *traversal layer* over the app under test.
  The agent loads the MCP server's 29 tools as an **MCP client** and
  drives browser/mobile sessions through them (wdio executes underneath).
- **`@wdio/devtools-service`** — the *observability layer*. Trace mode
  produces portable `trace.zip` artifacts (action NDJSON, network,
  `transcript.md`, accessibility snapshots, screenshots) that make a run
  **reproducible** and **healable**.

Design inspiration (layout only — `agent.ts` + `instructions.md`, skills,
connectors) comes from
[webdriverio/brain](https://github.com/webdriverio/brain)'s Managed Deep
Agents; the runtime here is the self-hosted OSS harness, not LangSmith MDA.

## 2. Goals & non-goals

### Goals (v1)

- `wdio-deepagent repl` — interactive chat loop; agent drives the browser
  step-by-step with streamed tool calls, messages, and screenshots.
- `wdio-deepagent run "<prompt>"` — one-shot, streamed, CI-able mission.
- `wdio-deepagent init` — agent interviews the user (framework, TS,
  services, cloud, dirs) and writes a **correct `wdio.conf.ts`** for their
  framework, including a `deepagent` config block.
- `wdio-deepagent diagnose <trace.zip>` — ingest a devtools trace,
  reproduce the run, diff old/new artifacts, and **heal** the failing spec
  in one of three modes (`ask` / `propose` / `auto`).
- `wdio-deepagent mcp` — export the same agent/tools as an MCP server for
  Claude Desktop / Claude Code.
- Schema-driven BYOK model config (zod + resolver + `request` override),
  no per-provider HTTP code.
- Everything testable with a mock model; secrets only via env vars.

### Non-goals (v1)

- No LangSmith / Managed Deep Agents deployment path.
- No embeddings / vector store (RAG is context-injection only — see §10).
- No one-LangChain-tool-per-wdio-command generation (the tool surface is
  the MCP 29-tool set + harness built-ins + trace tools, §6).
- No cloud device-farm orchestration beyond what `@wdio/mcp` already
  provides.
- The existing `wdio-repl` command REPL is untouched; this REPL is an
  agent chat loop, a different interaction model.

## 3. Interview record (locked decisions)

Decisions gathered during planning; kept verbatim for traceability.

| # | Topic | Decision |
|---|-------|----------|
| 1 | Harness basis | OSS `deepagents` (`createDeepAgent`), local BYOK — **not** LangSmith MDA; brain repo is layout inspiration only |
| 2 | Deliverable home | New package `packages/wdio-deepagent` → `@wdio/deepagent` in this monorepo; this doc at repo root |
| 3 | CLI surfaces | All four: `repl`, `run`, `init`, `diagnose` (+ `mcp` export) |
| 4 | MCP role | Traversal tools loaded **as an MCP client** from `@wdio/mcp`; wdio executes underneath |
| 5 | devtools role | Trace makes the spec **reproducible** (re-run + compare) and **healable** (fix + verify) |
| 6 | Heal scope | All three modes viable → `heal: 'ask' \| 'propose' \| 'auto'` |
| 7 | Model config | zod schema + resolver + `request` override (wdio-agent-service pattern); keys via env |
| 8 | agent-service | No correlation — hobby project; only schema/request-override pattern borrowed |
| 9 | RAG (defaulted) | Hybrid context-injection in v1: live site knowledge base + project fs; no embeddings; wdio-docs RAG later (§10) |
| 10 | MCP mechanics | MCP client — load traversal tools from `@wdio/mcp` (deepagents supports MCP tools natively) |

## 4. Architecture

```
┌──────────────────────────── user ────────────────────────────┐
│  wdio-deepagent repl | run | init | diagnose | mcp           │
│  wdio deepagent …            (lazy alias in wdio-cli)        │
└───────────────────────────────┬──────────────────────────────┘
                                │
                     ┌──────────▼──────────┐
                     │  CLI (yargs)        │
                     │  repl/run/init/…    │
                     └──────────┬──────────┘
                                │
        ┌───────────────────────▼───────────────────────┐
        │  agent.ts  createDeepAgent({                  │
        │    model:   resolveChatModel(modelConfig)     │
        │    tools:   [...mcpTraversalTools,            │
        │              ...traceTools,                   │
        │              ...harnessBuiltins]              │
        │    systemPrompt: instructions.md              │
        │    memory:   AGENTS.md (project)              │
        │    interrupt_on: <per heal mode>              │
        │  })                                           │
        └───────┬────────────────────┬──────────────────┘
                │ MCP client         │ direct calls
      ┌─────────▼─────────┐  ┌───────▼──────────────┐
      │ @wdio/mcp (stdio) │  │ devtools trace       │
      │ 29 tools          │  │ reader + reproduce   │
      │ (session, browser,│  │ runner (wdio run +   │
      │  mobile, selectors│  │ trace-mode overlay)  │
      │  script, cookies) │  └───────┬──────────────┘
      └─────────┬─────────┘          │
                │ (executes)   ┌─────▼──────┐
                │              │ wdio.conf  │  deepagent block
                ▼              └────────────┘  (model, heal, dirs)
        browser / device under test
```

Components:

1. **CLI** (`src/commands/*.ts`) — yargs commands; own bin
   `wdio-deepagent` plus a lazy `wdio deepagent` alias registered in
   `wdio-cli` via a guarded dynamic import (keeps the core CLI free of
   langchain deps).
2. **Config** (`src/config/`) — `deepagent` block inside `wdio.conf.ts`,
   resolved with `@wdio/config` and merged with env vars and CLI flags;
   `@wdio/types` augmentation for typing.
3. **Model** (`src/model/`) — zod `DeepAgentModelConfig` schema and
   `resolveChatModel()` → LangChain `ChatModel` (§5).
4. **Agent** (`src/agent.ts` + `instructions.md`) — `createDeepAgent`
   wiring (§7).
5. **MCP client** (`src/mcp/`) — spawn `@wdio/mcp`, load tools, lifecycle
   (§6, §8).
6. **Trace pipeline** (`src/trace/`) — reader (parse `trace.zip`) +
   reproduce runner (spawn `wdio run` with `mode: 'trace'` overlay) (§8).
7. **Site knowledge base** (`src/kb/`) — live accumulation of a11y
   snapshots / element maps as the agent browses (§10).

## 5. Model config (schema + resolver)

One zod schema, one resolver — the wdio-agent-service pattern, minus the
hand-rolled HTTP.

```ts
// src/model/schema.ts
const DeepAgentModelConfig = z.object({
    provider: z.enum(['openrouter', 'openai', 'anthropic', 'ollama']),
    model: z.string(),
    baseURL: z.string().url().optional(),       // OpenAI-compatible / Ollama
    apiKey: z.string().optional(),              // falls back to env
    temperature: z.number().min(0).max(2).default(0.1),
    maxTokens: z.number().int().positive().default(1024),
    /** Escape hatch: fully custom LLM request — mirrors wdio-agent-service's `request` override. */
    request: z.function().optional(),
})
export type DeepAgentModelConfig = z.infer<typeof DeepAgentModelConfig>
```

`resolveChatModel(config)`:

| provider | LangChain integration | apiKey env | baseURL env |
|----------|----------------------|------------|-------------|
| `openrouter` | `ChatOpenRouter` (`@langchain/openrouter`) | `OPENROUTER_API_KEY` | — |
| `openai` | `ChatOpenAI` (`@langchain/openai`) | `OPENAI_API_KEY` | `OPENAI_BASE_URL` |
| `anthropic` | `ChatAnthropic` (`@langchain/anthropic`) | `ANTHROPIC_API_KEY` | `ANTHROPIC_BASE_URL` |
| `ollama` | `ChatOllama` (`@langchain/ollama`) | — | `OLLAMA_BASE_URL` (default `http://localhost:11434`) |

Rules:

- `request` override wins; other fields are still validated but unused
  (logs a warning, mirroring agent-service).
- A missing key (config or env) throws a clear BYOK error: *"set
  OPENROUTER_API_KEY or add apiKey to the deepagent model config"*.
- Tool calls: OpenRouter/OpenAI/Anthropic models get
  `withStructuredOutput`/tool-calling for free via LangChain; the `request`
  override is a plain-text fallback (agent still works, tools unavailable).

## 6. Tool surface

The agent's tools are **not** one-per-command auto-generated. Inventory:

| Group | Source | Tools |
|-------|--------|-------|
| **Traversal** | `@wdio/mcp` via MCP client | the 29 MCP tools: `start_session`, navigate/interact/selectors, screenshots, cookies, mobile gestures, hybrid context switch, script execution, cloud providers |
| **Filesystem** | deepagents built-ins | `ls`, `read_file`, `write_file`, `edit_file`, `glob`, `grep` (project-scoped via `permissions=`) |
| **Task/subagents** | deepagents built-ins | `task` (subagents), optional `write_todos` (TodoListMiddleware) |
| **Trace** | `@wdio/devtools-service` | `ingest_trace` (parse a trace.zip), `reproduce` (re-run spec w/ trace), `diff_traces` (old vs new) |
| **Site KB** | in-process | `remember_snapshot` / `query_snapshot` (a11y element maps accumulated while browsing) |

"Every wdio functionality bundled" is delivered as: MCP traversal surface
(which itself covers browser + mobile + selectors + cookies + scripts) +
deepagents fs/task tools + trace tools. Assertions/spec writing are done
by the agent writing files (init/heal), not by dedicated expect tools.

## 7. Agent wiring (`agent.ts`)

```ts
export async function createDeepAgentHarness(cfg: ResolvedDeepAgentConfig) {
    const model = resolveChatModel(cfg.model)
    const mcpTools = await loadMcpTools()           // spawn @wdio/mcp, MCP client
    return createDeepAgent({
        model,
        tools: [...mcpTools, ...traceTools, ...kbTools],
        systemPrompt: await readInstructions(),     // instructions.md
        memory: cfg.projectAgentsMd ? [cfg.projectAgentsMd] : undefined,
        middleware: [todoListMiddleware()],         // task planning
        permissions: permissionsFor(cfg.heal),      // §8
        interruptOn: interruptsFor(cfg.heal),       // §8
    })
}
```

- **`instructions.md`** — system prompt: wdio patterns, MCP tool usage
  rules, config knowledge (frameworks/services), healing policy, site-KB
  etiquette.
- **Memory** — the project's `AGENTS.md` if present (deepagents memory
  param).
- **Skills** — optional `skills/*/SKILL.md` (e.g. "wdio-config-authoring",
  "selector-healing") loaded progressively; not required in v1.
- **Model default** — `openrouter:moonshotai/kimi-k3` (matches
  webdriverio/brain) when `DEEPAGENT_MODEL` is set; otherwise the config's
  `provider:model`.

## 8. MCP client, trace pipeline, heal engine

### MCP client (`src/mcp/`)

- Spawn `npx -y @wdio/mcp` (or the locally-installed bin) over **stdio**;
  connect with the LangChain MCP client (`createMcpServer`/`loadMcpTools`).
- Lifecycle: lazy start on first tool use; `start_session`/`close` managed
  by the agent; graceful shutdown on REPL exit / `run` completion.
- Tool-call errors are surfaced with MCP server stderr captured for
  debugging.
- Trade-off (documented): per-call IPC round-trip. In-process direct wdio
  tools are a possible later optimization; the MCP-client route keeps tool
  code shared with the standalone MCP server (zero duplication).

### Trace reader (`src/trace/reader.ts`)

Parse a devtools `trace.zip` into structured context for the agent:

- `trace.trace` (NDJSON action events) → ordered action timeline with
  timing/selectors
- `trace.network` → HAR-style entries (status, url, timing)
- `transcript.md` → LLM-friendly summary
- `resources/*-elements.json` + `*-snapshot.txt` → per-action interactable
  elements + accessibility tree
- `resources/*.jpeg` → screenshots (multimodal-capable)

### Reproduce runner (`src/trace/reproduce.ts`)

- Spawn `wdio run <config>` in a child process with a **trace-mode config
  overlay** (devtools service `{ mode: 'trace' }`, spec filter).
- Capture the fresh `trace.zip` + exit status; returns `{ artifact,
  exitCode, duration }`.

### Heal engine (`src/heal/`)

Pipeline: `ingest_trace(old)` → `reproduce(spec)` → `diff_traces(old,new)`
→ agent proposes root cause → applies fix per heal mode:

| mode | filesystem | writes | interrupt |
|------|-----------|--------|-----------|
| `ask` (default) | read + write allowed | every `edit_file`/`write_file` gated by human approval | `interrupt_on: { edit_file: true, write_file: true }` |
| `propose` | **read-only** (`permissions`: allow read, deny write) | agent emits diff/patch text only | none needed |
| `auto` | read + write | unattended (CI); spec + page objects only, config untouched | none |

Mode enforcement is config (`heal` in the `deepagent` block) and is
enforced by permissions + interrupt mapping — never by prompting alone.

## 9. Configuration & CLI reference

```ts
// wdio.conf.ts
export const config = {
    // ...framework/services as usual...
    deepagent: {
        model: { provider: 'openrouter', model: 'moonshotai/kimi-k3' },
        heal: 'ask',                                  // 'ask' | 'propose' | 'auto'
        mcp: { command: 'npx', args: ['-y', '@wdio/mcp'] },
        traceDir: 'test-results',
        permissions: { projectRoot: '.' },            // fs scope
    },
}
```

Secrets never in the file: `OPENROUTER_API_KEY`, `OPENAI_API_KEY`,
`ANTHROPIC_API_KEY`, `OLLAMA_BASE_URL`, `DEEPAGENT_MODEL`.

CLI:

```
wdio-deepagent repl                interactive agent session
wdio-deepagent run "<prompt>"      one-shot mission (CI-able), exit code
wdio-deepagent init                framework interview → write wdio.conf.ts
wdio-deepagent diagnose <trace.zip> [--heal ask|propose|auto]
wdio-deepagent mcp                 serve agent/tools as MCP server
wdio deepagent …                   lazy alias registered in wdio-cli
```

Config precedence: CLI flags > env vars > `wdio.conf.ts` `deepagent`
block > defaults. The `deepagent` block is typed via a `@wdio/types`
augmentation so config authors get autocompletion.

## 10. Open decisions

**RAG (defaulted, revisit later).** v1 uses context-injection, no
embeddings/vector store:

- *Live site KB* — the agent accumulates a11y snapshots/element maps per
  page while browsing (`remember_snapshot`/`query_snapshot`), grounding
  later traversal and healing in what it actually saw.
- *Project context* — deepagents fs tools read page objects, existing
  specs, and the config on demand.

Later phases (if metrics justify): embeddings over the site KB, RAG over
webdriver.io docs/API (reduces hallucinated configs), and retrieval over
historical trace artifacts.

## 11. Known trade-offs

1. **MCP-client traversal costs IPC per tool call** — fine for v1; an
   in-process tool layer can be added without changing the agent contract.
2. **Tool surface is the MCP 29-tool set, not one tool per wdio command** —
   "every wdio functionality" via MCP + harness built-ins, kept in sync by
   depending on `@wdio/mcp` directly.
3. **`request` override = text-only** — custom requests can't do tool
   calls; documented, matches wdio-agent-service semantics.
4. **`auto` heal is unattended** — limited to spec/page-object writes,
   never config; still gated by file-scoped permissions.
5. **Heavy deps** (`deepagents`, `langchain`, `@langchain/*`) — only the
   deepagent package pulls them; the wdio-cli hook stays a lazy dynamic
   import.

## 12. Phased roadmap

1. **Author this plan** (`deepagent_repl_plan.md`) — ✅ done.
2. **Scaffold package + model/config layer** — skeleton, zod schema +
   resolver, config loading, `@wdio/types` augmentation; unit tests — ✅ done.
3. **Traversal + observability infra** — MCP client, trace reader,
   reproduce runner; tests — ✅ done.
4. **Agent core + CLI** — `agent.ts`, `repl`, `run`, safety interrupts;
   tests with mock model + mock MCP — ✅ done.
5. **init/diagnose/heal + mcp export + docs** — wizard, heal engine,
   MCP export, wdio-cli alias, website docs; full green suite — ✅ done.

## 12b. Implementation status (delivered deviations)

Everything shipped in `packages/wdio-deepagent` (`@wdio/deepagent`), with
three deliberate deviations from the original plan:

1. **`instructions.md` → `src/prompts.ts`** — the default system prompt is
   a `DEFAULT_INSTRUCTIONS` constant (no asset-copy step in the esbuild
   build). A custom instructions file is still supported via
   `createDeepAgentHarness({ instructionsPath })`.
2. **`init` template is self-contained** — create-wdio's `wdio.conf.tpl.ejs`
   is ejs-source-coupled and not importable at runtime, so the wizard asks
   the same question set (framework, TS, services, cloud, dirs) and renders
   a complete config locally; the result is validated through the wdio
   config loader + `parseDeepAgentConfig` in tests.
3. **`diagnose` reproduction needs `--spec`** — the devtools trace does not
   embed the spec path, so reproducing requires `wdio-deepagent diagnose
   <trace.zip> --spec <path>` (or skips reproduction and reports the ingest
   diagnosis only).

Everything else matches the plan: zod model schema + resolver + `request`
override (agent-service pattern), MCP-client traversal over `@wdio/mcp`
(stdio, full env passthrough), trace reader/reproduce/diff, heal modes
enforced via `permissions=` + `interrupt_on`, `repl`/`run`/`init`/
`diagnose`/`mcp` CLI, lazy `wdio deepagent` registration in wdio-cli, and
the hybrid no-embeddings RAG default (§10).

## 13. Verification strategy

- **Unit** (vitest): schema validation, resolver provider mapping + env
  fallback + `request` override precedence, config merge precedence, trace
  parser on a fixture `trace.zip`, permissions/interrupt mapping per heal
  mode.
- **Agent smoke**: `createDeepAgent` construction with a mocked
  `ChatModel` (fake tool-calling) + a mock MCP server (in-process
  `StdioServerTransport` loopback or a stub tool provider); assert the
  agent issues traversal tool calls and respects `interrupt_on`.
- **CLI**: `run` happy path with mock model exits 0 and streams events;
  `diagnose` mode enforcement (read-only fs in `propose`).
- **Static**: eslint on all new files; esbuild build via infra/compiler.
- **Manual smoke** (post-build): `init` in a scratch dir writes a
  config-loadable `wdio.conf.ts`; `repl` starts, streams, and shuts down.
