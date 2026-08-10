import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'

/**
 * Reproduces a failing spec by re-running it under a devtools trace-mode
 * config overlay, producing a fresh `trace.zip` the agent can diff against
 * the original one (the "reproducible" half of the heal loop).
 */

export interface ReproduceOptions {
    /** Path to the project's wdio.conf.{js,ts,mjs,cjs}. */
    configPath: string
    /** Absolute path of the spec file to reproduce. */
    spec: string
    /** Directory for the overlay config + trace artifacts. */
    traceDir: string
    env?: NodeJS.ProcessEnv
    /**
     * Kill the spawned run after this many ms and report a timeout
     * (default: 10 minutes) so a hung spec cannot hang the harness/CI
     * forever.
     */
    timeoutMs?: number
    /**
     * Command/args used to run `wdio run` (injectable for tests).
     * Default: the project's `node_modules/.bin/wdio`.
     */
    spawnCommand?: string
    spawnArgs?: string[]
}

export interface ReproduceResult {
    /** Path of the newest `trace-*.zip` produced by the run. */
    artifactPath?: string
    exitCode: number
    /** Wall-clock duration of the run in ms. */
    duration: number
    stderr: string
}

/**
 * Overlay config file name. Must end in `.ts` so `wdio run` registers tsx
 * before importing it — the overlay imports the project's `wdio.conf.ts`,
 * and without tsx active Node 20–22 throws ERR_UNKNOWN_FILE_EXTENSION.
 */
const OVERLAY_FILENAME = '.deepagent-trace.conf.ts'

/** Exit code used when a reproduction is killed by the timeout (mirrors `timeout(1)`). */
export const TIMED_OUT_EXIT_CODE = 124
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000

/** Builds the overlay config: base config + devtools `trace` service. */
export function buildTraceOverlay(baseConfigPath: string, traceDir: string): string {
    const absBase = path.resolve(baseConfigPath)
    const absTraceDir = path.resolve(traceDir)
    return `import { config as base } from ${JSON.stringify(absBase)}

const baseServices = base.services || []
const isDevtools = (s) =>
    (typeof s === 'string' && s === 'devtools') || (Array.isArray(s) && s[0] === 'devtools')
const hasDevtools = baseServices.some(isDevtools)
const services = baseServices.map((s) =>
    isDevtools(s)
        ? ['devtools', { mode: 'trace', traceFormat: 'zip' }]
        : s
)

export const config = {
    ...base,
    services: hasDevtools
        ? services
        : [...services, ['devtools', { mode: 'trace', traceFormat: 'zip' }]],
    logLevel: 'error',
    outputDir: ${JSON.stringify(absTraceDir)},
}
`
}

async function findNewestTraceZip(dirs: string[]): Promise<string | undefined> {
    let newest: { path: string; mtime: number } | undefined
    for (const dir of dirs) {
        let entries: string[]
        try {
            entries = await fs.readdir(dir)
        } catch {
            continue
        }
        for (const entry of entries) {
            if (!/^trace-.+\.zip$/.test(entry)) {
                continue
            }
            const full = path.join(dir, entry)
            const stat = await fs.stat(full)
            if (!newest || stat.mtimeMs > newest.mtime) {
                newest = { path: full, mtime: stat.mtimeMs }
            }
        }
    }
    return newest?.path
}

interface SpawnRunOptions {
    cwd: string
    env?: NodeJS.ProcessEnv
    timeoutMs: number
    shell?: boolean
}

/** Spawns the wdio run, killing the child after `timeoutMs` if it does not finish. */
function spawnRun(command: string, args: string[], options: SpawnRunOptions): Promise<{ exitCode: number; stderr: string }> {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            cwd: options.cwd,
            env: { ...process.env, ...options.env },
            stdio: ['ignore', 'ignore', 'pipe'],
            shell: options.shell,
        })
        let stderr = ''
        let settled = false
        const timer = setTimeout(() => {
            if (settled) {
                return
            }
            settled = true
            stderr += `\n[@wdio/deepagent] reproduction timed out after ${options.timeoutMs} ms; killing the run.\n`
            child.kill('SIGTERM')
            // Force-kill shortly after in case the child ignores SIGTERM.
            setTimeout(() => child.kill('SIGKILL'), 5000).unref()
            resolve({ exitCode: TIMED_OUT_EXIT_CODE, stderr })
        }, options.timeoutMs)
        child.stderr.on('data', (chunk: Buffer) => {
            stderr += chunk.toString()
        })
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
                resolve({ exitCode: code ?? 1, stderr })
            }
        })
    })
}

/**
 * Runs the spec under the trace overlay and returns the fresh artifact.
 * The spawned run is killed after `timeoutMs` if it does not finish, and
 * the spec path is validated to stay inside the project root.
 */
export async function reproduceSpec(options: ReproduceOptions): Promise<ReproduceResult> {
    const traceDir = path.resolve(options.traceDir)
    await fs.mkdir(traceDir, { recursive: true })

    const projectRoot = path.dirname(path.resolve(options.configPath))
    const spec = path.resolve(projectRoot, options.spec)
    const relativeSpec = path.relative(projectRoot, spec)
    if (relativeSpec.startsWith('..') || path.isAbsolute(relativeSpec)) {
        throw new Error(
            `Spec ${options.spec} resolves outside the project root (${projectRoot}); refusing to reproduce.`
        )
    }

    const overlayPath = path.join(traceDir, OVERLAY_FILENAME)
    await fs.writeFile(overlayPath, buildTraceOverlay(options.configPath, traceDir))

    const wdioBin = options.spawnCommand ?? path.join(projectRoot, 'node_modules', '.bin', 'wdio')
    const args = options.spawnArgs ?? ['run', overlayPath, '--spec', spec]
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
    const spawnOptions: SpawnRunOptions = { cwd: projectRoot, env: options.env, timeoutMs }

    const startedAt = Date.now()
    let result: { exitCode: number; stderr: string }
    try {
        result = await spawnRun(wdioBin, args, spawnOptions)
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
            throw err
        }
        // no local wdio bin (npx-driven or globally installed project): retry via npx
        result = await spawnRun('npx', ['wdio', ...args], { ...spawnOptions, shell: process.platform === 'win32' })
    }

    const artifactPath = await findNewestTraceZip([traceDir, path.join(projectRoot, 'test-results')])

    return {
        artifactPath,
        exitCode: result.exitCode,
        duration: Date.now() - startedAt,
        stderr: result.stderr,
    }
}
