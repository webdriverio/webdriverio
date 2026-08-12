import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import type { DynamicStructuredTool } from '@langchain/core/tools'
import { loadMcpTools } from '@langchain/mcp-adapters'
import logger from '@wdio/logger'
import { exec } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEFAULT_MCP_CONFIG } from '../config/schema.js'
import { VERSION } from '../constants.js'

const log = logger('@wdio/deepagent')

/**
 * @wdio/mcp launches Chrome with a fixed temp profile (server.js
 * `USER_DATA_DIR = <tmp>/chrome-debug`). The cmdline pattern is the only
 * reliable scope for the close sweep: the server spawns Chrome detached (its
 * own process group, survives the server), so neither the stdio transport
 * nor a server-group kill can reach it — and a bare "chrome appeared since
 * spawn" diff would kill the user's own browser.
 */
const MCP_CHROME_PATTERN = `user-data-dir=${path.join(os.tmpdir(), 'chrome-debug').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`

/**
 * Chrome/Chromium process ids whose command line matches `pattern`, or null
 * when the platform cannot list them (e.g. Windows without pgrep — Chrome
 * cleanup is skipped).
 */
function listChromePids(pattern: string): Promise<Set<number> | null> {
    return new Promise((resolve) => {
        // bracket the first char so the wrapping shell's own cmdline (which
        // contains the literal pattern) does not match itself
        const bracketed = pattern.replace(/^./, (c) => `[${c}]`)
        exec(`pgrep -f '${bracketed}'`, (err, stdout) => {
            if (err) {
                resolve(null)
                return
            }
            resolve(new Set(stdout.split('\n').filter(Boolean).map(Number)))
        })
    })
}

/** Process group id of `pid` from /proc (Linux); undefined where /proc is absent. */
function processGroupOf(pid: number): number | undefined {
    try {
        const stat = fs.readFileSync(`/proc/${pid}/stat`, 'utf8')
        const after = stat.slice(stat.lastIndexOf(')') + 2).split(' ')
        return parseInt(after[2], 10)
    } catch {
        return undefined
    }
}

/**
 * Locates the `@wdio/mcp` server binary installed alongside this package.
 * This makes the harness run the exact version pinned in package.json
 * (`@wdio/mcp: ^3.11.1`) instead of whatever `npx -y @wdio/mcp` fetches
 * from the registry at runtime, so the traversal tool surface cannot drift.
 *
 * `@wdio/mcp` ships `main`/`exports`, but the walk-up still exists: the
 * package may be installed without being resolvable from this module's
 * location (pnpm store, npx cache). The pin holds only where
 * `node_modules/@wdio/mcp` is symlinked — otherwise it degrades to `npx`
 * (unpinned latest).
 *
 * Returns `undefined` when no local install is found (caller falls back to
 * `npx -y @wdio/mcp`).
 */
export function resolveLocalMcpBin(): string | undefined {
    const here = path.dirname(fileURLToPath(import.meta.url))
    let dir = here
    for (let depth = 0; depth < 10; depth++) {
        const pkgJson = path.join(dir, 'node_modules', '@wdio', 'mcp', 'package.json')
        if (fs.existsSync(pkgJson)) {
            try {
                const pkg = JSON.parse(fs.readFileSync(pkgJson, 'utf8')) as { bin?: string | Record<string, string> }
                const bin = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin?.['wdio-mcp'] ?? pkg.bin?.['mcp']
                if (bin) {
                    const full = path.resolve(path.dirname(pkgJson), bin)
                    if (fs.existsSync(full)) {
                        return full
                    }
                }
            } catch {
                // malformed package.json — fall through to npx
            }
        }
        const parent = path.dirname(dir)
        if (parent === dir) {
            break
        }
        dir = parent
    }
    return undefined
}

/**
 * Resolves the effective spawn command for the @wdio/mcp server.
 *
 * The default config (`npx -y @wdio/mcp`) is replaced by the locally
 * installed binary when available so the pinned version is used; any
 * explicitly different command/args are honored as-is.
 *
 * Windows note: `npx` requires a `.cmd` shim / `shell: true` on Windows.
 * Prefer configuring `mcp.command` to the full node + server path when
 * running on Windows hosts (known limitation, see USABILITY.md).
 */
export function resolveMcpSpawn(server: McpServerConfig): { command: string; args: string[] } {
    const isDefaultNpx = server.command === DEFAULT_MCP_CONFIG.command
        && server.args.length === DEFAULT_MCP_CONFIG.args.length
        && server.args.every((arg, i) => arg === DEFAULT_MCP_CONFIG.args[i])
    if (isDefaultNpx) {
        const localBin = resolveLocalMcpBin()
        if (localBin) {
            return { command: localBin, args: [] }
        }
    }
    return { command: server.command, args: server.args }
}

export interface McpServerConfig {
    /** Executable that starts the @wdio/mcp server (default `npx`). */
    command: string
    /** Args passed to the executable (default `['-y', '@wdio/mcp']`). */
    args: string[]
    /**
     * Extra env vars for the server process. The full parent env is passed
     * through by default (the MCP SDK otherwise inherits only a curated
     * allowlist, which would drop e.g. cloud credentials).
     */
    env?: Record<string, string>
}

/**
 * Lazily spawns the `@wdio/mcp` server over stdio and loads its tools as
 * LangChain tools. The MCP client is the agent's traversal layer over the
 * app under test — WebdriverIO executes underneath the server.
 *
 * Lifecycle: the server process starts on first `getTools()` (first tool
 * call), and is shut down via `close()` on REPL exit / `run` completion.
 */
export class WdioMcpClient {
    #transport?: StdioClientTransport
    #client?: Client
    #tools?: DynamicStructuredTool[]
    /** Chrome PIDs that existed before the server spawned (kill diff on close). */
    #chromeAtStart: Set<number> | null = null

    constructor(private server: McpServerConfig) {}

    async getTools(): Promise<DynamicStructuredTool[]> {
        if (this.#tools) {
            return this.#tools
        }

        // Prefer the locally installed (pinned) @wdio/mcp binary over
        // `npx -y @wdio/mcp` so the traversal tool surface cannot drift.
        // Record pre-existing Chrome processes (scoped to the @wdio/mcp
        // profile) so close() can kill the browser session this mission
        // spawned without touching others.
        this.#chromeAtStart = await listChromePids(MCP_CHROME_PATTERN)
        const { command, args } = resolveMcpSpawn(this.server)
        log.info(`Spawning @wdio/mcp: ${command} ${args.join(' ')}`)
        this.#transport = new StdioClientTransport({
            command,
            args,
            stderr: 'pipe',
            env: { ...process.env as Record<string, string>, ...(this.server.env ?? {}) },
        })
        this.#transport.stderr?.on('data', (chunk: Buffer) => {
            log.debug(`[wdio-mcp stderr] ${chunk.toString().trim()}`)
        })

        this.#client = new Client(
            { name: '@wdio/deepagent', version: VERSION },
            { capabilities: {} },
        )
        try {
            await this.#client.connect(this.#transport)
            this.#tools = await loadMcpTools('wdio-mcp', this.#client)
        } catch (err) {
            // Never leave the spawned server process orphaned behind a
            // failed harness build.
            await this.close()
            throw err
        }
        log.info(`Loaded ${this.#tools.length} traversal tools from @wdio/mcp`)
        return this.#tools
    }

    // direct tool invocation (e.g. the REPL's `close session` keyword) without
    // going through the agent's LangChain tool wrapper
    async callTool(name: string, args: Record<string, unknown> = {}): Promise<unknown> {
        if (!this.#client) {
            throw new Error('MCP client not connected')
        }
        // the SDK types the result as a union with the task variant (content
        // unknown); the runtime value is always the tool-result shape here
        const result = (await this.#client.callTool({ name, arguments: args })) as CallToolResult
        // @wdio/mcp returns an isError result instead of throwing (e.g. no
        // active session) — surface it as a throw so callers see the failure
        if (result.isError) {
            const message = result.content.map((c) => 'text' in c ? c.text : JSON.stringify(c)).join('; ')
            throw new Error(message || `MCP tool ${name} failed`)
        }
        return result.content
    }

    async close(): Promise<void> {
        try {
            await this.#client?.close()
        } finally {
            this.#client = undefined
            this.#transport = undefined
            this.#tools = undefined
            // @wdio/mcp spawns Chrome detached (survives the server process),
            // so killing the stdio transport alone leaks the browser session.
            // Kill the process groups of Chrome instances using the @wdio/mcp
            // profile that appeared since the server spawn: the profile match
            // keeps the user's own browser alive, the start-diff keeps a
            // concurrent mission's Chrome alive, and group SIGKILL reaches
            // zygote/gpu/utility children a pid-only kill leaves behind.
            if (this.#chromeAtStart) {
                const now = await listChromePids(MCP_CHROME_PATTERN)
                if (now) {
                    const groups = new Set<number>()
                    for (const pid of now) {
                        if (this.#chromeAtStart.has(pid)) {
                            continue
                        }
                        const group = processGroupOf(pid)
                        if (group) {
                            groups.add(group)
                        } else {
                            try {
                                process.kill(pid, 'SIGKILL')
                            } catch {
                                // already gone
                            }
                        }
                    }
                    for (const group of groups) {
                        try {
                            process.kill(-group, 'SIGKILL')
                        } catch {
                            // group already gone
                        }
                    }
                }
            }
            this.#chromeAtStart = null
        }
    }

    get toolCount(): number {
        return this.#tools?.length ?? 0
    }
}
