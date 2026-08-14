import path from 'node:path'
import logger from '@wdio/logger'
import { createDeepAgent, FilesystemBackend } from 'deepagents'
import type { DeepAgent, FilesystemPermission } from 'deepagents'
import { MemorySaver } from '@langchain/langgraph-checkpoint'
import { createMiddleware, todoListMiddleware } from 'langchain'
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
import { readInstructionsFile } from './prompts.js'

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
    /** Project root for filesystem permission scoping. */
    projectRoot?: string
    /** Path to the project's wdio.conf (enables reproduce_spec). */
    configPath?: string
    /** AGENTS.md memory files loaded into the system prompt. */
    memoryFiles?: string[]
    /** Inject instructions from a file instead of the default. */
    instructionsPath?: string
    /** Test/advanced escape hatch: use this model instead of resolving from config. */
    modelOverride?: BaseChatModel
}

export interface DeepAgentHarness {
    agent: DeepAgent
    mcpClient: WdioMcpClient | null
    tools: DynamicStructuredTool[]
    /** Shuts down the MCP server process. */
    close(): Promise<void>
}

/**
 * Converts a resolved absolute path into the `/`-prefixed, forward-slash
 * glob form deepagents requires (Windows drive paths become `/C:/...`).
 * Collapsing `//`→`/` is deliberate — UNC roots would break anyway since
 * deepagents only understands `/`-prefixed forms.
 */
export function normalizePermissionRoot(resolvedRoot: string): string {
    return ('/' + resolvedRoot.replace(/\\/g, '/')).replace(/\/{2,}/g, '/').replace(/\/+$/, '') || '/'
}

/** Matches deepagents' Windows virtual form `/C:/...` (or `/C:\...`). */
const WINDOWS_DRIVE_VIRTUAL = /^\/[A-Za-z]:[\\/]/

/**
 * Native Windows drive path → the `/`-prefixed virtual path deepagents
 * requires (`C:\...` → `/C:/...`). Identity for relative, POSIX-absolute,
 * and already-virtual input — those stay untouched so deepagents' own
 * `path must be absolute` validation keeps firing for relative paths
 * instead of silently resolving them against the process cwd.
 */
export function toVirtualPath(nativePath: string): string {
    if (WINDOWS_DRIVE_VIRTUAL.test(nativePath) || !/^[A-Za-z]:[\\/]/.test(nativePath)) {
        return nativePath
    }
    return '/' + nativePath.replace(/\\/g, '/')
}

/**
 * deepagents virtual path → native path. Reverses `toVirtualPath` for the
 * Windows drive form (`/C:/...` → `C:/...`); identity otherwise. Pure string
 * transform so the backend resolves `/C:/...` to the real file on Windows.
 */
export function fromVirtualPath(virtualPath: string): string {
    const drive = /^\/([A-Za-z]):(\/.*)$/.exec(virtualPath)
    return drive ? `${drive[1]}:${drive[2]}` : virtualPath
}

/**
 * Filesystem rules per heal mode. Every mode confines the agent to
 * `projectRoot`. deepagents evaluates rules in declaration order with a
 * permissive default (first match wins), so ask/auto deny the sensitive
 * paths (wdio.conf*, .env*, .git, node_modules) before the allow rule can
 * shadow them, and a catch-all deny comes last. `ask` additionally gates
 * every write via interrupts (`interruptsForHeal`); `propose` is read-only
 * inside the project and denies writes everywhere; `auto` is scoped by the
 * rules alone.
 *
 * The harness backend is a real `FilesystemBackend` (see
 * `createDeepAgentHarness`), so these rules are the only boundary between
 * the agent and the host filesystem. `FilesystemBackend` exposes no
 * `execute` tool, so there is no shell-command hole that permissions
 * cannot cover.
 */
export function permissionsForHeal(heal: HealMode, projectRoot: string): FilesystemPermission[] {
    // deepagents requires absolute glob paths (start with `/`, no `~`/`..`),
    // so resolve relative roots against the cwd and drop trailing slashes.
    // A project root of `/` means "full scope" — keep it as the bare root.
    // `normalizePermissionRoot` emits the deepagents virtual form on Windows
    // (`D:\proj` → `/D:/proj`); the `CrossPlatformFilesystemBackend` and
    // `normalizeFsToolPaths` middleware translate tool paths to/from that form,
    // so these rules confine the agent correctly on every platform.
    const root = normalizePermissionRoot(path.resolve(projectRoot))
    // `**` does not match the root directory itself, so the allow rules list
    // both the bare root (ls/glob/grep at the root) and everything under it.
    const underRoot = root === '/' ? '/**' : `${root}/**`
    const withinRoot = [root, underRoot]
    // join the sensitive-path globs without doubling the slash at root '/'
    const rootPrefix = root === '/' ? '' : root
    if (heal === 'propose') {
        return [
            { operations: ['read'], paths: withinRoot, mode: 'allow' },
            { operations: ['read', 'write'], paths: ['/**'], mode: 'deny' },
        ]
    }
    return [
        // Sensitive paths are denied first: first-match-wins, so the allow
        // rule below must not shadow them.
        { operations: ['read', 'write'], paths: [`${rootPrefix}/wdio.conf*`], mode: 'deny' },
        { operations: ['read', 'write'], paths: [`${rootPrefix}/.env*`], mode: 'deny' },
        { operations: ['read', 'write'], paths: [`${rootPrefix}/.git/**`], mode: 'deny' },
        { operations: ['read', 'write'], paths: [`${rootPrefix}/node_modules/**`], mode: 'deny' },
        { operations: ['read', 'write'], paths: withinRoot, mode: 'allow' },
        { operations: ['read', 'write'], paths: ['/**'], mode: 'deny' },
    ]
}

/** interrupt_on mapping per heal mode: `ask` pauses before every write. */
export function interruptsForHeal(heal: HealMode): Record<string, boolean> {
    if (heal === 'ask') {
        return { write_file: true, edit_file: true }
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
 */
export function withErrorRecovery(tool: DynamicStructuredTool): DynamicStructuredTool {
    // `_call` passes (input, runManager, parentConfig) — parentConfig carries
    // signal/timeout, which mcp-adapters' func reads; forwarding all args
    // keeps abort + per-call timeouts working through the wrapper
    const exec = tool.func as (input: unknown, ...rest: unknown[]) => Promise<unknown>
    // content_and_artifact tools (mcp-adapters) require a [content, artifact]
    // tuple; a bare string fails tool.call's output validation
    const tuple = (tool as { responseFormat?: string }).responseFormat === 'content_and_artifact'
    tool.func = (async (input: unknown, ...rest: unknown[]) => {
        try {
            return await exec(input, ...rest)
        } catch (err) {
            const message = `Error: ${err instanceof Error ? err.message : String(err)}`
            return tuple ? [message, undefined] : message
        }
    }) as unknown as DynamicStructuredTool['func']
    return tool
}

/**
 * deepagents' `FilesystemBackend` resolves native paths while its permission
 * layer requires `/`-prefixed virtual paths. On POSIX the two coincide; on
 * Windows they diverge (`C:\...` vs `/C:/...`). This backend bridges them:
 * virtual input paths are translated to native before hitting the host fs,
 * and `ls`/`glob`/`grep` result paths are translated back to virtual so
 * deepagents' `filterByPermissions` can validate them.
 */
class CrossPlatformFilesystemBackend extends FilesystemBackend {
    override async ls(dirPath: string) {
        const result = await super.ls(fromVirtualPath(dirPath))
        return { files: (result.files ?? []).map((f) => ({ ...f, path: toVirtualPath(f.path) })) }
    }

    override async read(filePath: string, offset?: number, limit?: number) {
        return super.read(fromVirtualPath(filePath), offset, limit)
    }

    override async readRaw(filePath: string) {
        return super.readRaw(fromVirtualPath(filePath))
    }

    override async write(filePath: string, content: string) {
        return super.write(fromVirtualPath(filePath), content)
    }

    override async edit(filePath: string, oldString: string, newString: string, replaceAll?: boolean) {
        return super.edit(fromVirtualPath(filePath), oldString, newString, replaceAll)
    }

    override async delete(filePath: string) {
        return super.delete(fromVirtualPath(filePath))
    }

    override async grep(pattern: string, dirPath?: string, glob?: string | null, maxCount?: number | null) {
        const result = await super.grep(
            pattern,
            dirPath === undefined ? dirPath : fromVirtualPath(dirPath),
            glob,
            maxCount,
        )
        return { matches: (result.matches ?? []).map((m) => ({ ...m, path: toVirtualPath(m.path) })) }
    }

    override async glob(pattern: string, searchPath?: string) {
        const result = await super.glob(
            pattern,
            searchPath === undefined ? searchPath : fromVirtualPath(searchPath),
        )
        return { files: (result.files ?? []).map((f) => ({ ...f, path: toVirtualPath(f.path) })) }
    }
}

const FS_TOOL_NAMES: Record<string, true> = {
    ls: true,
    read_file: true,
    write_file: true,
    edit_file: true,
    glob: true,
    grep: true,
}

/**
 * Rewrites the `path`/`file_path` args of the built-in fs tools into the
 * `/`-prefixed virtual form before deepagents' permission layer validates
 * them (that layer rejects native Windows paths). No-op on POSIX.
 */
function normalizeFsToolPaths() {
    return createMiddleware({
        name: 'NormalizeFsToolPaths',
        wrapToolCall: async (request, handler) => {
            const toolCall = request.toolCall
            if (!toolCall || !FS_TOOL_NAMES[toolCall.name]) {
                return handler(request)
            }
            const args = (toolCall.args ?? {}) as Record<string, unknown>
            const normalized: Record<string, unknown> = { ...args }
            let changed = false
            if (typeof normalized.path === 'string') {
                const virtual = toVirtualPath(normalized.path)
                if (virtual !== normalized.path) {
                    normalized.path = virtual
                    changed = true
                }
            }
            if (typeof normalized.file_path === 'string') {
                const virtual = toVirtualPath(normalized.file_path)
                if (virtual !== normalized.file_path) {
                    normalized.file_path = virtual
                    changed = true
                }
            }
            if (!changed) {
                return handler(request)
            }
            return handler({ ...request, toolCall: { ...toolCall, args: normalized } })
        },
    })
}

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
export async function createToolSurface(options: { mcp?: McpServerConfig | null; traceDir?: string; configPath?: string }): Promise<DeepAgentToolSurface> {
    const mcpConfig = resolveMcpConfig(options.mcp)
    const mcpClient = mcpConfig ? new WdioMcpClient(mcpConfig) : null
    const traceDir = options.traceDir ?? DEFAULT_TRACE_DIR

    const traversalTools = mcpClient ? await mcpClient.getTools() : []
    const traceTools = createTraceTools({ configPath: options.configPath, traceDir })
    const knowledgeBaseTools = createKnowledgeBaseTools()
    // MCP tools are DynamicStructuredTool; harness tools are too.
    const tools: DynamicStructuredTool[] = [...traversalTools, ...traceTools, ...knowledgeBaseTools].map(withErrorRecovery)

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

    const surface = await createToolSurface({ mcp: options.mcp === null ? null : mcpConfig, traceDir, configPath: options.configPath })
    const instructions = await readInstructionsFile(options.instructionsPath)
    const { tools, mcpClient } = surface

    const agent = createDeepAgent({
        name: '@wdio/deepagent',
        model: chatModel,
        tools,
        systemPrompt: instructions,
        middleware: [normalizeFsToolPaths(), todoListMiddleware()],
        // In-memory checkpointer. Required for two things:
        // 1. `ask`-mode human-in-the-loop interrupts (humanInTheLoopMiddleware
        //    calls langgraph's `interrupt()`, which throws MISSING_CHECKPOINTER
        //    without one) — every gated write pauses for approval.
        // 2. Multi-turn memory: conversation + todo state persist across
        //    `agent.invoke` calls (repl sessions, repeated missions).
        checkpointer: new MemorySaver(),
        // Real host filesystem. deepagents' default backend is an in-memory
        // sandbox (writes never reach the project); the harness must heal
        // real spec files, so we mount the real FS and confine it via the
        // permission rules below. FilesystemBackend exposes no `execute`
        // tool, so the permission rules are the sole boundary.
        backend: process.platform === 'win32'
            ? new CrossPlatformFilesystemBackend({ rootDir: '/' })
            : new FilesystemBackend({ rootDir: '/' }),
        ...(options.memoryFiles?.length ? { memory: options.memoryFiles } : {}),
        permissions: permissionsForHeal(heal, projectRoot),
        interruptOn: interruptsForHeal(heal),
    }).withConfig({
        // The in-memory checkpointer needs a stable thread id so every
        // invoke (repl turns, interrupt resumes, repeated missions) writes
        // to the same conversation thread.
        configurable: { thread_id: 'default' },
    }) as unknown as DeepAgent

    return {
        agent,
        mcpClient,
        tools,
        close: surface.close,
    }
}
