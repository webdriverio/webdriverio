import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import type { DynamicStructuredTool } from '@langchain/core/tools'
import { loadMcpTools } from '@langchain/mcp-adapters'
import logger from '@wdio/logger'
import { exec } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const log = logger('wdio-deepagent')

/**
 * Current Chrome/Chromium process ids, or null when the platform cannot
 * list them (e.g. Windows without pgrep — Chrome cleanup is skipped).
 */
function listChromePids(): Promise<Set<number> | null> {
    return new Promise((resolve) => {
        exec('pgrep -f chrome', (err, stdout) => {
            if (err) {
                resolve(null)
                return
            }
            resolve(new Set(stdout.split('\n').filter(Boolean).map(Number)))
        })
    })
}

/**
 * Locates the `@wdio/mcp` server binary installed alongside this package.
 * This makes the harness run the exact version pinned in package.json
 * (`@wdio/mcp: ^3.11.1`) instead of whatever `npx -y @wdio/mcp` fetches
 * from the registry at runtime, so the traversal tool surface cannot drift.
 *
 * `@wdio/mcp` is a bin-only package (no resolvable main/package.json
 * export), so we walk up from this module to find a `node_modules` that
 * contains it and read its `bin` field.
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
    const isDefaultNpx = server.command === 'npx'
        && server.args.length === 2
        && server.args[0] === '-y'
        && server.args[1] === '@wdio/mcp'
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
        // Record pre-existing Chrome processes so close() can kill the
        // browser session this mission spawned without touching others.
        this.#chromeAtStart = await listChromePids()
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
            { name: 'wdio-deepagent', version: '9.30.1' },
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

    async close(): Promise<void> {
        try {
            await this.#client?.close()
        } finally {
            this.#client = undefined
            this.#transport = undefined
            this.#tools = undefined
            // @wdio/mcp spawns Chrome detached (survives the server process),
            // so killing the stdio transport alone leaks the browser session.
            // Kill every Chrome process that appeared since the server spawn.
            if (this.#chromeAtStart) {
                const now = await listChromePids()
                if (now) {
                    for (const pid of now) {
                        if (!this.#chromeAtStart.has(pid)) {
                            try {
                                process.kill(pid, 'SIGTERM')
                            } catch {
                                // already gone
                            }
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
