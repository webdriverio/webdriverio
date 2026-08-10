import path from 'node:path'
import { createDeepAgent, FilesystemBackend } from 'deepagents'
import type { DeepAgent, FilesystemPermission } from 'deepagents'
import { todoListMiddleware } from 'langchain'
import type { DynamicStructuredTool } from '@langchain/core/tools'
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { parseModelConfig } from './model/index.js'
import type { DeepAgentModelConfig } from './model/index.js'
import { resolveChatModel, RequestChatModel } from './model/index.js'
import type { HealMode } from './config/index.js'
import type { McpServerConfig } from './mcp/index.js'
import { WdiMcpClient } from './mcp/index.js'
import { createTraceTools } from './trace/tools.js'
import { createKnowledgeBaseTools } from './knowledge-base/tools.js'
import { DEFAULT_INSTRUCTIONS, readInstructionsFile } from './prompts.js'

export interface DeepAgentHarnessOptions {
    /** BYOK model config (validated through the zod schema). */
    model: DeepAgentModelConfig
    /** Healing policy that drives filesystem permissions + interrupts. */
    heal?: HealMode
    /** @wdio/mcp spawn config. */
    mcp?: McpServerConfig
    /** Where devtools trace artifacts land. */
    traceDir?: string
    /** Project root for filesystem permission scoping. */
    projectRoot?: string
    /** Path to the project's wdio.conf (enables reproduce_spec). */
    configPath?: string
    /** Custom system prompt / instructions file. */
    instructions?: string
    /** AGENTS.md memory files loaded into the system prompt. */
    memoryFiles?: string[]
    /** Inject instructions from a file instead of the default. */
    instructionsPath?: string
    /** Test/advanced escape hatch: use this model instead of resolving from config. */
    modelOverride?: BaseChatModel
}

export interface DeepAgentHarness {
    agent: DeepAgent
    mcpClient: WdiMcpClient
    tools: DynamicStructuredTool[]
    /** Shuts down the MCP server process. */
    close(): Promise<void>
}

/** Default @wdio/mcp spawn. The local (pinned) install is preferred at runtime; `npx -y` is the fallback. */
export const DEFAULT_MCP_CONFIG: McpServerConfig = {
    command: 'npx',
    args: ['-y', '@wdio/mcp'],
}

/**
 * Filesystem rules per heal mode. Every mode confines the agent to
 * `projectRoot` — deepagents evaluates rules in declaration order with a
 * permissive default, so the allow rule must come first, followed by a
 * catch-all deny. `ask` additionally gates every write via interrupts
 * (`interruptsForHeal`); `propose` is read-only inside the project and
 * denies writes everywhere; `auto` is scoped by the rules alone.
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
    let root = path.resolve(projectRoot).replace(/\/+$/, '')
    if (root === '') {
        root = '/'
    }
    // `**` does not match the root directory itself, so the allow rules list
    // both the bare root (ls/glob/grep at the root) and everything under it.
    const underRoot = root === '/' ? '/**' : `${root}/**`
    const withinRoot = [root, underRoot]
    if (heal === 'propose') {
        return [
            { operations: ['read'], paths: withinRoot, mode: 'allow' },
            { operations: ['read', 'write'], paths: ['/**'], mode: 'deny' },
        ]
    }
    return [
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
 * Builds the Deep Agent harness: model (BYOK) + traversal tools from the
 * @wdio/mcp server + trace tools + site knowledge base + filesystem
 * permissions and human-in-the-loop interrupts per heal mode.
 */
export async function createDeepAgentHarness(
    options: DeepAgentHarnessOptions,
): Promise<DeepAgentHarness> {
    const modelConfig = parseModelConfig(options.model)
    const heal = options.heal ?? 'ask'
    const mcpConfig = options.mcp ?? DEFAULT_MCP_CONFIG
    const traceDir = options.traceDir ?? 'test-results'
    const projectRoot = options.projectRoot ?? process.cwd()

    const chatModel = options.modelOverride ?? resolveChatModel(modelConfig)

    const mcpClient = new WdiMcpClient(mcpConfig)
    const traversalTools = await mcpClient.getTools()

    const traceTools = createTraceTools({ configPath: options.configPath, traceDir })
    const knowledgeBaseTools = createKnowledgeBaseTools()
    // MCP tools are DynamicStructuredTool; harness tools are too.
    const tools: DynamicStructuredTool[] = [...traversalTools, ...traceTools, ...knowledgeBaseTools]

    if (chatModel instanceof RequestChatModel && tools.length > 0) {
        throw new Error(
            'The `request` override model is text-only and cannot call tools. ' +
            'Configure a real provider (openrouter | openai | anthropic | ollama) for the deepagent agent modes.'
        )
    }

    const instructions = options.instructions ?? await readInstructionsFile(options.instructionsPath)
    const agent = await createDeepAgent({
        name: 'wdio-deepagent',
        model: chatModel,
        tools,
        systemPrompt: instructions ?? DEFAULT_INSTRUCTIONS,
        middleware: [todoListMiddleware()],
        // Real host filesystem. deepagents' default backend is an in-memory
        // sandbox (writes never reach the project); the harness must heal
        // real spec files, so we mount the real FS and confine it via the
        // permission rules below. FilesystemBackend exposes no `execute`
        // tool, so the permission rules are the sole boundary.
        backend: new FilesystemBackend({ rootDir: '/' }),
        ...(options.memoryFiles?.length ? { memory: options.memoryFiles } : {}),
        permissions: permissionsForHeal(heal, projectRoot),
        interruptOn: interruptsForHeal(heal),
    })

    return {
        agent,
        mcpClient,
        tools,
        close: () => mcpClient.close(),
    }
}
