import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { spawn, execSync, execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { FakeToolCallingModel } from 'langchain'
import { createDeepAgentHarness } from '@wdio/deepagent/agent'
import type { DeepAgentHarness } from '@wdio/deepagent/agent'
import type { HealMode } from '@wdio/deepagent/config'

export const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)))
export const FIXTURES = path.join(PACKAGE_ROOT, 'fixtures')
export const MCP_SERVER = path.join(FIXTURES, 'mcp-server.mjs')
export const FAKE_WDIO = path.join(FIXTURES, 'fake-wdio.mjs')
export const CONFIG_FIXTURE = path.join(FIXTURES, 'project', 'wdio.conf.ts')
export const PAGE_HTML = path.join(FIXTURES, 'page.html')

/** Absolute paths into the monorepo's @wdio/deepagent package. */
const REPO_ROOT = path.resolve(PACKAGE_ROOT, '..', '..', '..')
export const DEEPAGENT_PKG = path.join(REPO_ROOT, 'packages', 'wdio-deepagent')
export const DEEPAGENT_BIN = path.join(DEEPAGENT_PKG, 'bin', 'wdio-deepagent.js')
export const MCP_SERVER_JS = path.join(DEEPAGENT_PKG, 'node_modules', '@wdio', 'mcp', 'lib', 'server.js')
export const WDIO_CLI_PKG = path.join(REPO_ROOT, 'packages', 'wdio-cli')
export const WDIO_CLI_BIN = path.join(WDIO_CLI_PKG, 'bin', 'wdio.js')
export const WDIO_CLI_BUILD = path.join(WDIO_CLI_PKG, 'build', 'index.js')

/** Tool-call shape for FakeToolCallingModel scripts. */
export interface ScriptedCall {
    name: string
    args: Record<string, unknown>
    id: string
}

export async function makeTempDir(prefix: string): Promise<string> {
    return fs.mkdtemp(path.join(os.tmpdir(), prefix))
}

export async function rmrf(dir: string): Promise<void> {
    await fs.rm(dir, { recursive: true, force: true })
}

/** Temp "project" dir with a wdio.conf.ts (copied fixture). */
export async function makeTempProject(prefix: string): Promise<string> {
    const dir = await makeTempDir(prefix)
    await fs.writeFile(path.join(dir, 'wdio.conf.ts'), await fs.readFile(CONFIG_FIXTURE, 'utf8'))
    return dir
}

/**
 * Real harness (real FilesystemBackend, real MCP stdio spawn). With a
 * `script` it is driven by a scripted fake model — deterministic, no LLM.
 * With `opts.model` (T0) a live BYOK model is resolved from the env instead.
 */
export function buildHarness(
    script: ScriptedCall[][],
    opts: {
        heal?: HealMode
        projectRoot?: string
        /** Real @wdio/mcp spawn config; `null` disables the browser tool surface (fs + trace only). */
        mcp?: { command: string; args: string[] } | null
        /** Live BYOK model (T0); when set, `script` is ignored. */
        model?: { provider: string; model: string; maxTokens?: number }
    } = {},
): Promise<DeepAgentHarness> {
    return createDeepAgentHarness({
        model: opts.model ?? { provider: 'openai', model: 'fake' },
        ...(opts.model
            ? {}
            : { modelOverride: new FakeToolCallingModel({ toolCalls: script, toolStyle: 'openai' }) }),
        mcp: opts.mcp === null ? null : (opts.mcp ?? { command: process.execPath, args: [MCP_SERVER] }),
        traceDir: 'test-results',
        projectRoot: opts.projectRoot ?? process.cwd(),
        heal: opts.heal ?? 'auto',
    })
}

/** Reads the fixture MCP call log (JSONL) if it was written. */
export async function readCallLog(logPath: string): Promise<Array<{ name: string; args: Record<string, unknown> }>> {
    const raw = await fs.readFile(logPath, 'utf8').catch(() => '')
    return raw.trim().split('\n').filter(Boolean).map((l) => JSON.parse(l))
}

export interface SpawnResult {
    code: number | null
    timedOut: boolean
    stdout: string
    stderr: string
}

/** Spawn a process with a hard timeout; resolve { code, timedOut, stdout, stderr }. */
export function spawnProcess(
    command: string,
    args: string[],
    options: { cwd?: string; env?: NodeJS.ProcessEnv; timeoutMs?: number; stdin?: 'pipe' | 'ignore' } = {},
): Promise<SpawnResult> {
    const timeoutMs = options.timeoutMs ?? 60_000
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            cwd: options.cwd,
            env: { ...process.env, ...options.env } as NodeJS.ProcessEnv,
            // stdin 'ignore' = EOF immediately, so interactive prompts resolve
            // instead of hanging a piped-but-never-closed stdin
            stdio: [options.stdin ?? 'pipe', 'pipe', 'pipe'],
        })
        let stdout = ''
        let stderr = ''
        let settled = false
        const timer = setTimeout(() => {
            if (settled) {
                return
            }
            settled = true
            child.kill('SIGKILL')
            resolve({ code: null, timedOut: true, stdout, stderr })
        }, timeoutMs)
        child.stdout.on('data', (d: Buffer) => { stdout += d.toString() })
        child.stderr.on('data', (d: Buffer) => { stderr += d.toString() })
        child.on('error', (err) => {
            if (!settled) {
                settled = true
                clearTimeout(timer)
                reject(err)
            }
        })
        child.on('close', (code) => {
            if (!settled) {
                settled = true
                clearTimeout(timer)
                resolve({ code, timedOut: false, stdout, stderr })
            }
        })
    })
}

/** Chrome binary on PATH? */
export function chromeBinary(): string | undefined {
    for (const name of ['google-chrome', 'chromium', 'chromium-browser']) {
        try {
            execSync(`command -v ${name}`, { stdio: 'ignore' })
            return name
        } catch {
            /* try next */
        }
    }
    return undefined
}

/**
 * Honest T2 gate: binary present AND a live CDP probe succeeds.
 * `launch_chrome` does not pass --headless, so a display-less environment
 * would start Chrome but never expose CDP — probing avoids a 60 s flake.
 * Probe Chrome is torn down via its own process group + profile.
 */
let probeResult: boolean | undefined
export async function chromeAvailable(): Promise<boolean> {
    if (probeResult !== undefined) {
        return probeResult
    }
    const binary = chromeBinary()
    if (!binary) {
        probeResult = false
        return false
    }
    const port = 9300 + Math.floor(Math.random() * 500)
    const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'chrome-gate-'))
    const child = spawn(binary, [
        `--remote-debugging-port=${port}`,
        `--user-data-dir=${profile}`,
        '--no-first-run',
        '--disable-session-crashed-bubble',
    ], { detached: true, stdio: 'ignore' })
    child.unref()
    const deadline = Date.now() + 12_000
    probeResult = false
    try {
        while (Date.now() < deadline) {
            try {
                const res = await fetch(`http://127.0.0.1:${port}/json/version`)
                if (res.ok) {
                    probeResult = true
                    break
                }
            } catch {
                /* not up yet */
            }
            await new Promise((r) => setTimeout(r, 300))
        }
    } finally {
        try { process.kill(-child.pid, 'SIGKILL') } catch { /* gone */ }
        try { execSync(`pkill -9 -f 'user-data-dir=${profile}'`, { stdio: 'ignore' }) } catch { /* none */ }
        await fs.rm(profile, { recursive: true, force: true })
    }
    return probeResult
}

/**
 * Count live processes whose command line matches `pattern` (pgrep -f).
 * The bracket trick (`[x]` vs `x`) keeps the wrapping shell's own cmdline —
 * which contains the raw pattern — from matching itself.
 */
export function pgrepCount(pattern: string): number {
    const bracketed = pattern.replace(/^./, (c) => `[${c}]`)
    try {
        const out = execSync(`pgrep -f ${JSON.stringify(bracketed)}`, { encoding: 'utf8' })
        return out.trim().split('\n').filter(Boolean).length
    } catch {
        return 0
    }
}

/** Process group id of a pid (from /proc/<pid>/stat, field after `comm`). */
function processGroup(pid: number): number | undefined {
    try {
        const stat = fs.readFileSync(`/proc/${pid}/stat`, 'utf8')
        const after = stat.slice(stat.lastIndexOf(')') + 2).split(' ')
        return parseInt(after[2], 10)
    } catch {
        return undefined
    }
}

function sleepSync(ms: number): void {
    // synchronous sleep without a child process
    const sab = new SharedArrayBuffer(4)
    Atomics.wait(new Int32Array(sab), 0, 0, ms)
}

/**
 * Kill every process group matching `pattern` and wait until none remain.
 * Group SIGKILL reaches Chrome's zygote/gpu/utility children that survive a
 * pid-only kill. Scoped on the suite's own pattern (per-case CDP port), not
 * a machine-wide chrome sweep — a global sweep kills other suites' Chrome.
 */
export function killChromeGroup(pattern: string): void {
    const bracketed = pattern.replace(/^./, (c) => `[${c}]`)
    for (let attempt = 0; attempt < 20; attempt++) {
        if (pgrepCount(pattern) === 0) {
            return
        }
        try {
            const out = execFileSync('pgrep', ['-f', bracketed], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
            const groups = new Set(
                out.trim().split('\n').filter(Boolean)
                    .map((l) => processGroup(parseInt(l, 10)))
                    .filter((g): g is number => Boolean(g)),
            )
            for (const g of groups) {
                try { process.kill(-g, 'SIGKILL') } catch { /* group already gone */ }
            }
            execFileSync('pkill', ['-9', '-f', bracketed], { stdio: 'ignore' })
        } catch {
            /* process list may have emptied between check and kill */
        }
        sleepSync(250)
    }
}

/** Extract the text content of the tool result message with `toolCallId`. */
export function toolResultText(run: { messages: Array<{ tool_call_id?: string; content?: unknown }> }, toolCallId: string): string {
    const msg = run.messages.find((m) => m.tool_call_id === toolCallId)
    const content = msg?.content
    return typeof content === 'string' ? content : JSON.stringify(content ?? '')
}
