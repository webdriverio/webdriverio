import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import type { DynamicStructuredTool } from '@langchain/core/tools'
import { loadMcpTools } from '@langchain/mcp-adapters'
import logger from '@wdio/logger'
import { execFile } from 'node:child_process'
import fsp from 'node:fs/promises'
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
 * Holder registry for the shared `chrome-debug` profile. The profile is fixed,
 * so a second mission's Chrome hands off to the first mission's instance; the
 * sweep must not run while another holder is alive. Refcount as one file per
 * holder pid inside a directory — single-file create/unlink is atomic, so
 * concurrent missions can never clobber each other's claim (a shared JSON
 * read-modify-write would).
 */
let chromeLockDir = path.join(os.tmpdir(), 'chrome-debug.lock')

/** Test hook: point the profile lock at an isolated path (vitest workers share os.tmpdir()). */
export function useChromeLockPath(p: string): void {
    chromeLockDir = p
}

async function bestEffort(fn: () => Promise<unknown>): Promise<void> {
    try {
        await fn()
    } catch {
        // best-effort: lock-registry fs failures must not break the harness
    }
}

async function claimChromeLock(pid: number): Promise<void> {
    await bestEffort(async () => {
        await fsp.mkdir(chromeLockDir, { recursive: true })
        await fsp.writeFile(path.join(chromeLockDir, String(pid)), '')
    })
}

async function releaseChromeLock(pid: number): Promise<void> {
    await bestEffort(async () => {
        await fsp.rm(path.join(chromeLockDir, String(pid)), { force: true })
        // drop the empty registry dir so a finished mission leaves nothing behind
        await fsp.rmdir(chromeLockDir)
    })
}

/** Removes holder files whose mission crashed without releasing. */
async function pruneDeadHolders(): Promise<void> {
    await bestEffort(async () => {
        for (const name of await fsp.readdir(chromeLockDir)) {
            const pid = Number(name)
            if (!Number.isInteger(pid)) {
                continue
            }
            try {
                process.kill(pid, 0)
            } catch {
                await fsp.rm(path.join(chromeLockDir, name), { force: true })
            }
        }
    })
}

/** Holder file names currently in the shared-profile registry. */
async function chromeHolders(): Promise<string[]> {
    try {
        return await fsp.readdir(chromeLockDir)
    } catch {
        return []
    }
}

/**
 * Chrome/Chromium process ids whose command line matches `pattern`, or null
 * when the platform cannot list them (e.g. Windows without pgrep — Chrome
 * cleanup is skipped).
 */
function listChromePids(pattern: string): Promise<Set<number> | null> {
    return new Promise((resolve) => {
        // bracket the first char so the pattern cannot match the literal
        // pattern text in any wrapping process's own cmdline
        const bracketed = pattern.replace(/^./, (c) => `[${c}]`)
        // execFile: no shell, so a pattern containing `'` or `$` cannot
        // escape into command injection
        execFile('pgrep', ['-f', bracketed], (err, stdout) => {
            if (err) {
                resolve(null)
                return
            }
            resolve(new Set(stdout.split('\n').filter(Boolean).map(Number)))
        })
    })
}

/** (ppid, process group id) of `pid` from one /proc/<pid>/stat read (Linux); undefined where /proc is absent. */
async function procStatOf(pid: number): Promise<{ ppid: number | undefined; pgrp: number | undefined } | undefined> {
    try {
        const stat = await fsp.readFile(`/proc/${pid}/stat`, 'utf8')
        const after = stat.slice(stat.lastIndexOf(')') + 2).split(' ')
        return { ppid: parseInt(after[1], 10), pgrp: parseInt(after[2], 10) }
    } catch {
        return undefined
    }
}

function killPid(pid: number): void {
    try {
        process.kill(pid, 'SIGKILL')
    } catch {
        // already gone
    }
}

function killGroup(group: number): void {
    try {
        process.kill(-group, 'SIGKILL')
    } catch {
        // group already gone
    }
}

interface AncestryResult {
    descendant: boolean
    /** Process group of the start pid, from its own stat read. */
    group: number | undefined
}

/**
 * Walks `pid`'s ancestor chain, one stat read per pid. Chrome spawned by
 * @wdio/mcp is detached, so its PPID stays the server while the server lives —
 * ancestry is the ownership proof the PID-diff sweep lacked.
 */
export async function walkAncestry(pid: number, ancestor: number, maxDepth = 16): Promise<AncestryResult> {
    let stat = await procStatOf(pid)
    const group = stat?.pgrp
    for (let i = 0; i < maxDepth && stat; i++) {
        const ppid = stat.ppid
        if (ppid === ancestor) {
            return { descendant: true, group }
        }
        if (ppid === undefined || ppid <= 1) {
            return { descendant: false, group }
        }
        stat = await procStatOf(ppid)
    }
    return { descendant: false, group }
}

/**
 * Locates the `@wdio/mcp` server binary installed alongside this package.
 * This makes the harness run the exact version pinned in package.json
 * (`@wdio/mcp: ^3.11.1`) instead of whatever `npx -y @wdio/mcp` fetches
 * from the registry at runtime, so the traversal tool surface cannot drift.
 *
 * `@wdio/mcp` ships an exports map that blocks `./package.json` and has no
 * `require` condition, so createRequire/import.meta.resolve cannot reach it
 * (and import.meta.resolve fails under vitest) — the walk-up reads the
 * symlinked `node_modules/@wdio/mcp` directly. The pin holds only where
 * `node_modules/@wdio/mcp` is symlinked — otherwise it degrades to `npx`
 * (unpinned latest).
 *
 * Returns `undefined` when no local install is found (caller falls back to
 * `npx -y @wdio/mcp`).
 */
let cachedMcpBin: string | undefined | null = null

/** Test hook: forget the memoized resolveLocalMcpBin result. */
export function resetLocalMcpBinCache(): void {
    cachedMcpBin = null
}

export async function resolveLocalMcpBin(): Promise<string | undefined> {
    if (cachedMcpBin !== null) {
        return cachedMcpBin
    }
    const here = path.dirname(fileURLToPath(import.meta.url))
    let dir = here
    for (let depth = 0; depth < 10; depth++) {
        const pkgJson = path.join(dir, 'node_modules', '@wdio', 'mcp', 'package.json')
        try {
            const pkg = JSON.parse(await fsp.readFile(pkgJson, 'utf8')) as { bin?: string | Record<string, string> }
            const bin = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin?.['wdio-mcp'] ?? pkg.bin?.['mcp']
            if (bin) {
                const full = path.resolve(path.dirname(pkgJson), bin)
                try {
                    await fsp.access(full)
                    cachedMcpBin = full
                    return full
                } catch {
                    // bin entry points nowhere — keep walking up
                }
            }
        } catch {
            // missing or malformed package.json — keep walking up
        }
        const parent = path.dirname(dir)
        if (parent === dir) {
            break
        }
        dir = parent
    }
    cachedMcpBin = undefined
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
export async function resolveMcpSpawn(server: McpServerConfig): Promise<{ command: string; args: string[] }> {
    const isDefaultNpx = server.command === DEFAULT_MCP_CONFIG.command
        && server.args.length === DEFAULT_MCP_CONFIG.args.length
        && server.args.every((arg, i) => arg === DEFAULT_MCP_CONFIG.args[i])
    if (isDefaultNpx) {
        const localBin = await resolveLocalMcpBin()
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
    /** PID of the spawned @wdio/mcp server (child of the stdio transport); set after connect. */
    #serverPid?: number

    constructor(private server: McpServerConfig) {}

    async getTools(): Promise<DynamicStructuredTool[]> {
        if (this.#tools) {
            return this.#tools
        }

        // Prefer the locally installed (pinned) @wdio/mcp binary over
        // `npx -y @wdio/mcp` so the traversal tool surface cannot drift.
        const { command, args } = await resolveMcpSpawn(this.server)
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
            // Ancestry anchor for close(): Chrome spawned by @wdio/mcp keeps
            // this server as its PPID while the server lives, so the sweep can
            // prove ownership instead of relying on a start-time PID diff.
            this.#serverPid = this.#transport.pid ?? undefined
            if (this.#serverPid) {
                // prune holders that crashed without releasing, then claim
                await pruneDeadHolders()
                await claimChromeLock(this.#serverPid)
            }
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
        // Sweep only when no OTHER mission holds the shared `chrome-debug`
        // profile: Chrome hands off to the existing instance, so killing it
        // would take down their session. Own claim stays in place until the
        // sweep has run so a mission claiming during close still blocks us.
        // Accepted trade-off: in an overlap, the survivor's Chrome descends
        // from the departed mission's server, so a later last-holder sweep
        // cannot prove ownership and the instance leaks (one zombie per host —
        // the handoff reuses it, so it never accumulates). Killing it would
        // require trusting profile matches alone, which would also kill any
        // non-deepagent @wdio/mcp consumer sharing the profile — the
        // wrongful-kill class this gate exists to prevent.
        const heldElsewhere = this.#serverPid === undefined
            || (await chromeHolders()).some((name) => name !== String(this.#serverPid))
        // Resolve owned Chrome groups while the server is still alive: Chrome
        // is spawned detached by @wdio/mcp and reparents to PID 1 once the
        // server exits, so ancestry must be checked before closing the server.
        // On platforms without /proc (macOS, Windows) the sweep is skipped —
        // the safe direction, since the shared profile means a PID diff
        // cannot prove ownership.
        const groups = heldElsewhere ? undefined : await collectOwnedGroups(this.#serverPid)
        try {
            await this.#client?.close()
        } finally {
            this.#client = undefined
            this.#transport = undefined
            this.#tools = undefined
            const serverPid = this.#serverPid
            this.#serverPid = undefined
            // Recheck holders right before the kills: a mission that claimed
            // while the sweep (pgrep + /proc walks + MCP close) ran now owns
            // the surviving Chrome via handoff — killing it would end their
            // session. A claim landing after this readdir cannot terminate
            // that mission: termination requires its handoff to have
            // completed, and handoff runs only after its claim plus server
            // spawn, connect and first tool call — tens of ms at least —
            // while this kill loop runs in microseconds. Worst case the
            // claim lands mid-loop, our kill takes the handoff target, and
            // the mission spawns a fresh Chrome: session survives.
            if (groups && (await chromeHolders()).every((name) => name === String(serverPid))) {
                killGroups(groups)
            }
            if (serverPid) {
                await releaseChromeLock(serverPid)
            }
        }
    }

    get toolCount(): number {
        return this.#tools?.length ?? 0
    }
}

function killGroups(groups: Set<number>): void {
    for (const group of groups) {
        killGroup(group)
    }
}

/**
 * Process groups of Chrome instances using the @wdio/mcp profile whose
 * ancestor chain reaches `serverPid`. Group SIGKILL reaches zygote/gpu/utility
 * children a pid-only kill leaves behind.
 */
async function collectOwnedGroups(serverPid: number | undefined): Promise<Set<number>> {
    const groups = new Set<number>()
    if (!serverPid) {
        return groups
    }
    const chrome = await listChromePids(MCP_CHROME_PATTERN)
    if (!chrome) {
        return groups
    }
    const walks = await Promise.all([...chrome].map(async (pid) => ({ pid, ...(await walkAncestry(pid, serverPid)) })))
    for (const { pid, descendant, group } of walks) {
        if (!descendant) {
            continue
        }
        if (group) {
            groups.add(group)
        } else {
            killPid(pid)
        }
    }
    return groups
}
