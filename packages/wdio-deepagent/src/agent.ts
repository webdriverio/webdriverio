import path from 'node:path'
import logger from '@wdio/logger'
import { createDeepAgent, FilesystemBackend } from 'deepagents'
import type { DeepAgent, FilesystemPermission } from 'deepagents'
import { MemorySaver } from '@langchain/langgraph-checkpoint'
import { todoListMiddleware, type InterruptOnConfig, type ToolCallRequest } from 'langchain'
import micromatch from 'micromatch'
import { ChatAnthropic } from '@langchain/anthropic'
import type { DynamicStructuredTool } from '@langchain/core/tools'
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { parseModelConfig } from './model/index.js'
import type { DeepAgentModelConfig } from './model/index.js'
import { resolveChatModel, RequestChatModel } from './model/index.js'
import { DEFAULT_MCP_CONFIG, DEFAULT_TRACE_DIR, type HealMode } from './config/index.js'
import type { McpServerConfig } from './mcp/index.js'
import { WdioMcpClient } from './mcp/index.js'
import { createTraceTools } from './trace/tools.js'
import { createKnowledgeBaseTools } from './knowledge-base/tools.js'
import { createRunSpecTool } from './run-spec.js'
import { createLoopGuardMiddleware, TOOL_ERROR_PREFIX } from './loop-guard.js'
import { readInstructionsFile, readAppendedInstructions } from './prompts.js'
import { extractAgentReply } from './commands/turn.js'

const log = logger('@wdio/deepagent')

/** `mcp: null` disables the browser surface; `undefined` means the default config. */
const resolveMcpConfig = (mcp: McpServerConfig | null | undefined): McpServerConfig | undefined =>
    mcp === null ? undefined : (mcp ?? DEFAULT_MCP_CONFIG)

/**
 * Heuristic: does the model id look like a small-parameter model (≤7B)?
 * Small models usually ship small context windows, and the MCP traversal
 * surface costs ~8-10k tokens of tool schemas before the first turn —
 * a 4B/8k-ctx model cannot fit both. Parsing param counts out of model
 * ids is inherently fragile across providers; the warning is advisory,
 * `mcp: null` stays the user's explicit opt-out.
 */
export function isSmallModelForMcp(modelId: string): boolean {
    const match = /(\d+(?:\.\d+)?)\s*b\b/i.exec(modelId)
    return Boolean(match && Number(match[1]) <= 7)
}

export interface DeepAgentHarnessOptions {
    /** BYOK model config (validated through the zod schema). */
    model: DeepAgentModelConfig
    /** Healing policy that drives filesystem permissions + interrupts. */
    heal?: HealMode
    /** @wdio/mcp spawn config; `null` disables the browser tool surface entirely. */
    mcp?: McpServerConfig | null
    /** Where devtools trace artifacts land. */
    traceDir?: string
    /** Project root: roots the filesystem backend (virtual mode) and permission scoping. */
    projectRoot?: string
    /** Path to the project's wdio.conf (enables reproduce_spec). */
    configPath?: string
    /** AGENTS.md memory files loaded into the system prompt. */
    memoryFiles?: string[]
    /** Inject instructions from a file instead of the default. */
    instructionsPath?: string
    /** Inline instructions appended after the base instructions. */
    appendInstructions?: string
    /** File whose contents are appended after the base instructions. */
    appendInstructionsFile?: string
    /** Test/advanced escape hatch: use this model instead of resolving from config. */
    modelOverride?: BaseChatModel
}

export interface DeepAgentHarness {
    agent: DeepAgent
    /** Resolved chat model — exposed so callers can fire preload probes (REPL warmup). */
    model: BaseChatModel
    mcpClient: WdioMcpClient | null
    tools: DynamicStructuredTool[]
    /** Shuts down the MCP server process. */
    close(): Promise<void>
}

/**
 * Filesystem rules per heal mode. With `virtualMode: true` every tool-visible
 * path is `/`-prefixed and confined to projectRoot by the backend's
 * `resolvePath`, so these rules only carve out sensitive paths: the denies
 * come first (first match wins) so the allow rule cannot shadow them, and
 * there is no trailing catch-all deny — dead under virtual mode since `/**`
 * matches every valid tool path. each sensitive name is denied via two globs —
 * root form and nested form — because a micromatch globstar directly after the
 * leading slash never matches zero directory levels
 * (secrets, npmrc, key material, nested node_modules). wdio.conf stays
 * readable — it is the agent's main source of project structure (framework,
 * spec patterns, services) — but is write-denied with the rest of the infra
 * so a heal cannot rewrite its own harness config and escalate heal/mcp.
 * `auto` additionally write-denies CI config, manifests,
 * lockfiles and git hooks while reads stay allowed — an unrestricted auto
 * heal could otherwise rewrite `.github/workflows/*.yml`, `package.json` or
 * the lockfile and break the build. `ask` additionally gates every write via
 * interrupts (`interruptsForHeal`); `propose` is read-only and denies writes
 * everywhere; `auto` is scoped by the rules alone.
 *
 * `FilesystemBackend` exposes no `execute` tool, so there is no shell-command
 * hole that these permissions cannot cover.
 */
const WRITE_DENY_GLOBS = [
    '/wdio.conf*', '/**/wdio.conf*',
    '/.github/**', '/**/.github/**',
    '/package.json', '/**/package.json',
    '/package-lock.json', '/**/package-lock.json',
    '/pnpm-lock.yaml', '/**/pnpm-lock.yaml',
    '/yarn.lock', '/**/yarn.lock',
    '/.husky/**', '/**/.husky/**',
]

/** All write-denying globs across every rule permissionsForHeal emits — single source of truth for the gate. */
function writeDeniedGlobs(heal: HealMode): string[] {
    return permissionsForHeal(heal).flatMap((rule) =>
        rule.mode === 'deny' && rule.operations.includes('write') ? rule.paths : []
    )
}

const SENSITIVE_DENY_GLOBS = [
    '/.env*', '/**/.env*',
    '/.git/**', '/**/.git/**',
    '/node_modules/**', '/**/node_modules/**',
    '/.npmrc', '/**/.npmrc',
    '/*.pem', '/**/*.pem',
    '/*.key', '/**/*.key',
]

function isWriteDenied(globs: string[], filePath: unknown): boolean {
    if (typeof filePath !== 'string' || filePath.length === 0) {
        return false
    }
    // tool args can arrive relative ("wdio.conf.ts"); the deny globs are '/'-anchored
    const normalized = filePath.startsWith('/') ? filePath : `/${filePath}`
    return micromatch.isMatch(normalized, globs, { dot: true })
}

export function permissionsForHeal(heal: HealMode): FilesystemPermission[] {
    if (heal === 'propose') {
        return [
            { operations: ['read'], paths: ['/**'], mode: 'allow' },
            { operations: ['read', 'write'], paths: ['/**'], mode: 'deny' },
        ]
    }
    return [
        { operations: ['read', 'write'], paths: SENSITIVE_DENY_GLOBS, mode: 'deny' },
        {
            operations: ['write'],
            paths: WRITE_DENY_GLOBS,
            mode: 'deny',
        },
        { operations: ['read', 'write'], paths: ['/**'], mode: 'allow' },
    ]
}

/**
 * interrupt_on mapping per heal mode: `ask` gates every mutating filesystem
 * tool behind human approval — deepagents exposes only `write_file` and
 * `edit_file` as mutating tools (no `delete_file`).
 */
export function interruptsForHeal(heal: HealMode): Record<string, boolean | InterruptOnConfig> {
    if (heal === 'ask') {
        // The HITL gate fires before the filesystem permission check inside
        // the tool, so write-denied paths must be filtered here — otherwise
        // the human is asked to approve a write that cannot succeed. Globs
        // derived from permissionsForHeal so the gate can never drift from
        // the deny rules it mirrors.
        const denied = writeDeniedGlobs(heal)
        const gate: InterruptOnConfig = {
            allowedDecisions: ['approve', 'reject'],
            when: (req: ToolCallRequest) => !isWriteDenied(denied, req.toolCall.args?.file_path),
            description: (_toolCall, state) => extractAgentReply(state.messages),
        }
        return { write_file: gate, edit_file: gate }
    }
    return {}
}

/**
 * Tool failures otherwise propagate through deepagents as a hard turn
 * failure — a dead browser session (REPL `close session`, crashed Chrome)
 * would kill the mission before the model could react. Wrap every harness
 * tool so any thrown error becomes tool content: the model sees the failure
 * in-context and recovers (retry, start_session, different approach)
 * instead of the whole turn dying.
 *
 * `imagesAsText` additionally rewrites screenshot content blocks to text
 * placeholders: OpenAI-compatible providers reject non-text tool content
 * with a 400 (Anthropic accepts images in tool results, so the option
 * stays off for it).
 */
export function withErrorRecovery(
    tool: DynamicStructuredTool,
    options: { imagesAsText?: boolean } = {},
): DynamicStructuredTool {
    // `_call` passes (input, runManager, parentConfig) — parentConfig carries
    // signal/timeout, which mcp-adapters' func reads; forwarding all args
    // keeps abort + per-call timeouts working through the wrapper
    const exec = tool.func as (input: unknown, ...rest: unknown[]) => Promise<unknown>
    // content_and_artifact tools (mcp-adapters) require a [content, artifact]
    // tuple; a bare string fails tool.call's output validation
    const tuple = (tool as { responseFormat?: string }).responseFormat === 'content_and_artifact'
    tool.func = (async (input: unknown, ...rest: unknown[]) => {
        try {
            const output = await exec(input, ...rest)
            if (options.imagesAsText && tuple && Array.isArray(output) && Array.isArray(output[0])) {
                output[0] = output[0].map((block: unknown) => {
                    if (typeof block !== 'object' || block === null || !('type' in block)) {
                        return block
                    }
                    const { type } = block as { type?: unknown }
                    if (type !== 'image_url' && type !== 'image') {
                        return block
                    }
                    return { type: 'text', text: imagePlaceholder(block) }
                })
            }
            return output
        } catch (err) {
            const message = `${TOOL_ERROR_PREFIX}${err instanceof Error ? err.message : String(err)}`
            return tuple ? [message, undefined] : message
        }
    }) as unknown as DynamicStructuredTool['func']
    return tool
}

/** Derives mime + approximate size from an image content block for the placeholder text. */
function imagePlaceholder(block: object): string {
    let mime: unknown
    let base64 = ''
    if ('image_url' in block) {
        const url = (block as { image_url?: { url?: string } }).image_url?.url ?? ''
        const match = /^data:([^;,]+)?;base64,(.*)$/.exec(url)
        mime = match?.[1] ?? 'image'
        base64 = match?.[2] ?? ''
    } else {
        mime = (block as { mimeType?: unknown; mime_type?: unknown }).mimeType
            ?? (block as { mimeType?: unknown; mime_type?: unknown }).mime_type
            ?? 'image'
        base64 = typeof (block as { data?: unknown }).data === 'string' ? (block as { data: string }).data : ''
    }
    const kb = Math.round((base64.length * 3) / 4 / 1024)
    return `[Image capture (${String(mime)}, ~${kb} KB) omitted: this model cannot view images in tool results — inspect page state with get_accessibility_tree or get_elements instead.]`
}

// re-exported for streamedTurn — defined in loop-guard.ts to avoid the
// agent.ts -> loop-guard.ts -> agent.ts import cycle
export { isErrorOutput, TOOL_ERROR_PREFIX } from './loop-guard.js'

export interface DeepAgentToolSurface {
    mcpClient: WdioMcpClient | null
    tools: DynamicStructuredTool[]
    close(): Promise<void>
}

/**
 * Builds the tool surface shared by the harness and the `mcp` command:
 * traversal tools from the @wdio/mcp server + trace tools + site KB,
 * each wrapped with error recovery. Model-independent — the `mcp` CLI
 * command serves this surface without needing a model.
 */
export async function createToolSurface(options: { mcp?: McpServerConfig | null; traceDir?: string; configPath?: string; imagesAsText?: boolean }): Promise<DeepAgentToolSurface> {
    const mcpConfig = resolveMcpConfig(options.mcp)
    const mcpClient = mcpConfig ? new WdioMcpClient(mcpConfig) : null
    const traceDir = options.traceDir ?? DEFAULT_TRACE_DIR

    const traversalTools = mcpClient ? await mcpClient.getTools() : []
    const traceTools = createTraceTools({ configPath: options.configPath, traceDir })
    const knowledgeBaseTools = createKnowledgeBaseTools()
    // MCP tools are DynamicStructuredTool; harness tools are too.
    const tools: DynamicStructuredTool[] = [...traversalTools, createRunSpecTool({ configPath: options.configPath }), ...traceTools, ...knowledgeBaseTools].map((tool) => withErrorRecovery(tool, { imagesAsText: options.imagesAsText }))

    return {
        mcpClient,
        tools,
        close: async () => {
            await mcpClient?.close()
        },
    }
}

/**
 * Builds the Deep Agent harness: model (BYOK) + traversal tools from the
 * @wdio/mcp server + trace tools + site knowledge base + filesystem
 * permissions and human-in-the-loop interrupts per heal mode.
 */
export async function createDeepAgentHarness(
    options: DeepAgentHarnessOptions,
): Promise<DeepAgentHarness> {
    const modelConfig = parseModelConfig(options.model)
    const heal = options.heal ?? 'ask'
    const mcpConfig = resolveMcpConfig(options.mcp)
    const traceDir = options.traceDir ?? DEFAULT_TRACE_DIR
    const projectRoot = options.projectRoot ?? process.cwd()

    const chatModel = options.modelOverride ?? resolveChatModel(modelConfig)

    if (mcpConfig && isSmallModelForMcp(modelConfig.model)) {
        log.warn(
            `Model "${modelConfig.model}" looks like a small model (≤7B) — the MCP traversal ` +
            'surface adds ~8-10k tokens of tool schemas. Set `deepagent.mcp: null` if your ' +
            'model cannot fit both (small context windows will error mid-mission).'
        )
    }

    if (chatModel instanceof RequestChatModel) {
        throw new Error(
            'The `request` override model is text-only and cannot call tools. ' +
            'Configure a real provider (openrouter | openai | anthropic | ollama) for the deepagent agent modes.'
        )
    }

    const surface = await createToolSurface({ mcp: options.mcp === null ? null : mcpConfig, traceDir, configPath: options.configPath, imagesAsText: !(chatModel instanceof ChatAnthropic) })
    const instructions = await readInstructionsFile(options.instructionsPath)
    const { tools, mcpClient } = surface

    // Point the model at the project's wdio config instead of inlining it —
    // zero tokens until the agent reads it, and never stale mid-session.
    let systemPrompt = instructions
    if (options.configPath) {
        const rel = path.relative(projectRoot, path.resolve(options.configPath))
        if (!rel.startsWith('..') && !path.isAbsolute(rel)) {
            // virtual-mode backend roots '/' at projectRoot — host-absolute would double-root
            const virtualConfigPath = '/' + rel.split(path.sep).join('/')
            systemPrompt = `${instructions}\n\n- The project's wdio config: \`${virtualConfigPath}\` — read it with \`read_file\` before spec or config work.`
        }
    }
    systemPrompt += await readAppendedInstructions(options)

    const agent = createDeepAgent({
        name: '@wdio/deepagent',
        model: chatModel,
        tools,
        systemPrompt,
        middleware: [todoListMiddleware(), createLoopGuardMiddleware()],
        // In-memory checkpointer. Required for two things:
        // 1. `ask`-mode human-in-the-loop interrupts (humanInTheLoopMiddleware
        //    calls langgraph's `interrupt()`, which throws MISSING_CHECKPOINTER
        //    without one) — every gated write pauses for approval.
        // 2. Multi-turn memory: conversation + todo state persist across
        //    `agent.invoke` calls (repl sessions, repeated missions).
        checkpointer: new MemorySaver(),
        // Real host filesystem mounted at project root in virtual mode:
        // `ls /` lists the project, tool paths are project-relative
        // `/`-prefixed, and `resolvePath` confines every operation to
        // projectRoot — the containment boundary; permission rules carve
        // out sensitive paths only. VirtualMode semantics verified against
        // deepagents 1.12.2 — re-verify on dependency upgrade (package.json
        // has `^1.12.2`).
        backend: new FilesystemBackend({ rootDir: projectRoot, virtualMode: true }),
        ...(options.memoryFiles?.length ? { memory: options.memoryFiles } : {}),
        permissions: permissionsForHeal(heal),
        interruptOn: interruptsForHeal(heal),
    }).withConfig({
        // The in-memory checkpointer needs a stable thread id so every
        // invoke (repl turns, interrupt resumes, repeated missions) writes
        // to the same conversation thread.
        configurable: { thread_id: 'default' },
    }) as unknown as DeepAgent

    return {
        agent,
        model: chatModel,
        mcpClient,
        tools,
        close: surface.close,
    }
}
