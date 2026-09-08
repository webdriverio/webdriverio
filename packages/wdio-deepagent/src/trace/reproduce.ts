import spawn from 'cross-spawn'
import fs from 'node:fs/promises'
import path from 'node:path'

/**
 * Reproduces a failing spec by re-running it under a devtools trace-mode
 * config overlay, producing a fresh `trace.zip` the agent can diff against
 * the original one (the "reproducible" half of the heal loop).
 */

export interface ReproduceOptions extends RunSpecOptions {
    /** Directory for the overlay config + trace artifacts. */
    traceDir: string
}

export interface SpecRunResult {
    exitCode: number
    /** Wall-clock duration of the run in ms. */
    duration: number
    durationMs: number
    stdout?: string
    stderr: string
    /** Path of the newest `.zip` written after the run started. */
    artifactPath?: string
}

/** @deprecated Use {@link SpecRunResult} instead. */
export type ReproduceResult = SpecRunResult

/**
 * Overlay config file name. Must end in `.ts` so `wdio run` registers tsx
 * before importing it — the overlay imports the project's `wdio.conf.ts`,
 * and without tsx active Node 20–22 throws ERR_UNKNOWN_FILE_EXTENSION.
 */
const OVERLAY_FILENAME = '.deepagent-trace.conf.ts'

/** Env var carrying the run-scoped trace output dir to the spawned run (used by the test fixture). */
const TRACE_DIR_ENV = 'WDIO_DEEPAGENT_TRACE_DIR'

/** Stderr tail handed to the model — shared by run summaries and the heal retry prompt. */
export const STDERR_TAIL_CHARS = 2000

/** Exit code used when a reproduction is killed by the timeout (mirrors `timeout(1)`). */
export const TIMED_OUT_EXIT_CODE = 124
export const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000

/** Upper bound for a caller-supplied run timeout (mirrored in the run_spec tool schema). */
export const MAX_TIMEOUT_MS = 30 * 60 * 1000

/** Max buffered bytes per spawned stream; past the cap output is dropped and flagged. */
const MAX_RUN_OUTPUT_BYTES = 1024 * 1024

/** Clamp a caller-supplied run timeout into `[1, MAX_TIMEOUT_MS]`, defaulting to DEFAULT_TIMEOUT_MS. */
export function clampTimeout(ms?: number): number {
    if (ms === undefined || !Number.isFinite(ms)) {
        return DEFAULT_TIMEOUT_MS
    }
    return Math.min(Math.max(Math.floor(ms), 1), MAX_TIMEOUT_MS)
}

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

async function findNewestTraceZip(dir: string, afterMs?: number): Promise<string | undefined> {
    let newest: { path: string; mtime: number } | undefined
    let entries: string[]
    try {
        entries = await fs.readdir(dir)
    } catch {
        return undefined
    }
    const stats = await Promise.all(entries
        .filter((entry) => entry.endsWith('.zip'))
        .map(async (entry) => {
            const full = path.join(dir, entry)
            try {
                return { path: full, mtime: (await fs.stat(full)).mtimeMs }
            } catch {
                return undefined
            }
        }))
    for (const stat of stats) {
        if (!stat || (afterMs !== undefined && stat.mtime < afterMs)) {
            continue
        }
        if (!newest || stat.mtime > newest.mtime) {
            newest = stat
        }
    }
    return newest?.path
}

/**
 * Command/args used to run `wdio run` (injectable for tests).
 * Default: the project's `node_modules/.bin/wdio`.
 */
export interface SpawnOverride {
    spawnCommand?: string
    spawnArgs?: string[]
}

interface SpawnRunOptions {
    cwd: string
    env?: NodeJS.ProcessEnv
    timeoutMs: number
}

/** Bounded per-stream buffer: chunk Buffers accumulate, concatenated once at the end. */
function cappedOutput() {
    const chunks: Buffer[] = []
    let bytes = 0
    let truncated = false
    return {
        push(chunk: Buffer) {
            if (bytes + chunk.length > MAX_RUN_OUTPUT_BYTES) {
                truncated = true
                return
            }
            chunks.push(chunk)
            bytes += chunk.length
        },
        text(extra = '') {
            const out = Buffer.concat(chunks).toString()
            return truncated ? `${out}\n[@wdio/deepagent] output truncated at ${MAX_RUN_OUTPUT_BYTES} bytes.\n${extra}` : out + extra
        },
    }
}

/**
 * Forwards parent termination signals to the detached child process group so
 * Ctrl-C/CI-kill cannot orphan wdio's workers or the browser. Returns the
 * kill helper plus an unwrap that removes the listeners.
 */
function wireSignals(child: ReturnType<typeof spawn>, isSettled: () => boolean): { killRun: (signal: NodeJS.Signals) => void; unwrap: () => void } {
    // kill(-pid) hits the detached process group so wdio's workers and
    // the browser it spawned die with it; throws ESRCH once it is gone
    const killRun = (signal: NodeJS.Signals) => {
        try {
            if (process.platform === 'win32') {
                child.kill(signal)
            } else if (child.pid) {
                // process.kill with a negative pid targets the group;
                // child.kill takes a signal, not a pid
                process.kill(-child.pid, signal)
            }
        } catch {
            // group already gone or spawn failed
        }
    }
    // detached puts the child in its own session: forward parent
    // termination signals to the group so Ctrl-C/CI-kill cannot orphan it
    const forward = (signal: NodeJS.Signals) => () => {
        if (!isSettled()) {
            killRun(signal)
        }
    }
    const onSigint = forward('SIGTERM')
    const onSigterm = forward('SIGTERM')
    const onExit = forward('SIGKILL')
    process.once('SIGINT', onSigint)
    process.once('SIGTERM', onSigterm)
    process.once('exit', onExit)
    return {
        killRun,
        unwrap: () => {
            process.removeListener('SIGINT', onSigint)
            process.removeListener('SIGTERM', onSigterm)
            process.removeListener('exit', onExit)
        },
    }
}

/** Spawns the wdio run, killing the child after `timeoutMs` if it does not finish. */
function spawnRun(command: string, args: string[], options: SpawnRunOptions): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            cwd: options.cwd,
            env: { ...process.env, ...options.env },
            stdio: ['ignore', 'pipe', 'pipe'],
            detached: process.platform !== 'win32',
        })
        const out = cappedOutput()
        const errOut = cappedOutput()
        let settled = false
        const { killRun, unwrap } = wireSignals(child, () => settled)
        const timer = setTimeout(() => {
            if (settled) {
                return
            }
            settled = true
            unwrap()
            killRun('SIGTERM')
            // Force-kill shortly after in case the group ignores SIGTERM.
            setTimeout(() => killRun('SIGKILL'), 5000).unref()
            resolve({ exitCode: TIMED_OUT_EXIT_CODE, stdout: out.text(), stderr: errOut.text(`\n[@wdio/deepagent] reproduction timed out after ${options.timeoutMs} ms; killing the run.\n`) })
        }, options.timeoutMs)
        child.stdout?.on('data', (chunk: Buffer) => {
            out.push(chunk)
        })
        child.stderr?.on('data', (chunk: Buffer) => {
            errOut.push(chunk)
        })
        child.on('error', (err) => {
            if (!settled) {
                settled = true
                unwrap()
                clearTimeout(timer)
                reject(err)
            }
        })
        child.on('close', (code) => {
            if (!settled) {
                settled = true
                unwrap()
                clearTimeout(timer)
                resolve({ exitCode: code ?? 1, stdout: out.text(), stderr: errOut.text() })
            }
        })
    })
}

/**
 * Unified model-supplied path mapping: a host-absolute path that exists on
 * disk wins; a relative or `/`-virtual path is stripped of its leading `/`
 * and rooted at `root`.
 */
export async function resolveIn(root: string, p: string): Promise<string> {
    if (path.isAbsolute(p)) {
        try {
            await fs.stat(path.resolve(p))
            return path.resolve(p)
        } catch {
            // not on host disk — fall through to the virtual mapping
        }
    }
    return path.resolve(root, p.replace(/^\//, ''))
}

/** @deprecated Use {@link resolveIn} instead. */
export async function resolveModelPath(root: string, p: string): Promise<string> {
    return resolveIn(root, p)
}

/** Default project root for a config file (its dir), or the cwd. */
export function projectRootForConfig(configPath?: string): string {
    return configPath ? path.dirname(path.resolve(configPath)) : process.cwd()
}

/**
 * Resolves a model-supplied spec path against the project root: a
 * host-absolute path inside the root wins (so an outside-root spec still
 * fails runSpec's confinement check instead of being re-read as a virtual
 * path), else a `/`-prefixed virtual path as emitted by the fs tools is
 * mapped onto the root.
 */
/** @deprecated Use {@link resolveIn} instead. */
export async function resolveSpecPath(projectRoot: string, spec: string): Promise<string> {
    return resolveIn(projectRoot, spec)
}

export interface RunSpecOptions extends SpawnOverride {
    /** Path to the wdio config to run. */
    configPath: string
    /** Spec file path, resolved against `projectRoot`. */
    spec: string
    /**
     * Root for spec resolution, confinement and the spawn cwd (default:
     * dirname of `configPath`).
     */
    projectRoot?: string
    /**
     * Kill the spawned run after this many ms and report a timeout
     * (default: 10 minutes) so a hung spec cannot hang the harness/CI
     * forever.
     */
    timeoutMs?: number
    env?: NodeJS.ProcessEnv
}

/** @deprecated Use {@link SpecRunResult} instead. */
export type RunSpecResult = SpecRunResult

export type SpecRunCoreResult = SpecRunResult
export type SpecRunCoreOptions = RunSpecOptions & {
    /** When true, run under the trace overlay and scan for the fresh trace.zip. */
    trace: boolean
    /** Required when trace is true: directory for the overlay config + artifacts. */
    traceDir?: string
}

/**
 * Shared run_spec / reproduce_spec core: path confinement, timeout and spawn
 * live here once; `trace` selects the plain run vs the trace-overlay run.
 */
export async function runSpecCore(options: SpecRunCoreOptions): Promise<SpecRunCoreResult> {
    let configPath = options.configPath
    const projectRoot = path.resolve(options.projectRoot ?? projectRootForConfig(configPath))
    let traceRunDir: string | undefined
    let traceStartedAt = 0
    let env = options.env
    if (options.trace) {
        if (!options.traceDir) {
            throw new Error('traceDir is required for a trace run.')
        }
        const traceDir = path.resolve(options.traceDir)
        await fs.mkdir(traceDir, { recursive: true })
        // Each trace run gets its own output dir so a concurrent run (or a
        // second mission sharing `traceDir`) cannot inject a newer trace.zip
        // into the scan. The overlay pins `outputDir` here; findNewestTraceZip
        // then only ever sees this run's artifacts.
        traceRunDir = await fs.mkdtemp(path.join(traceDir, 'repro-'))
        const overlayPath = path.join(traceRunDir, OVERLAY_FILENAME)
        await fs.writeFile(overlayPath, buildTraceOverlay(configPath, traceRunDir))
        traceStartedAt = Date.now()
        env = { ...env, [TRACE_DIR_ENV]: traceRunDir }
        // configPath becomes the overlay, but projectRoot above stays the
        // original config's dir: the overlay lives in the mkdtemp traceDir,
        // so dirname(overlayPath) would break the confinement check below
        configPath = overlayPath
    }

    const spec = path.resolve(projectRoot, options.spec)
    const relativeSpec = path.relative(projectRoot, spec)
    if (relativeSpec.startsWith('..') || path.isAbsolute(relativeSpec)) {
        throw new Error(
            `Spec ${options.spec} resolves outside the project root (${projectRoot}); refusing to reproduce.`
        )
    }

    const wdioBin = options.spawnCommand ?? path.join(projectRoot, 'node_modules', '.bin', 'wdio')
    // configPath can be relative to the *caller's* cwd (createRunSpecTool
    // forwards it verbatim), but the spawned run's cwd is projectRoot —
    // absolutize before building args or a nested-relative `--config`
    // (e.g. `configs/wdio.conf.ts`) would misresolve in the child.
    const resolvedConfig = path.resolve(configPath)
    const args = options.spawnArgs ?? ['run', resolvedConfig, '--spec', spec]
    const timeoutMs = clampTimeout(options.timeoutMs)
    const spawnOptions: SpawnRunOptions = {
        cwd: projectRoot,
        env,
        timeoutMs,
    }

    const startedAt = process.hrtime.bigint()
    // no local wdio bin (npx-driven or globally installed project): fall back to npx.
    // cross-spawn resolves .cmd/.bat without a shell on win32, so the
    // spec path embedded in args is never handed to a shell interpreter
    const candidates: Array<[string, string[]]> = [[wdioBin, args], ['npx', ['wdio', ...args]]]
    let spawned: { exitCode: number; stdout: string; stderr: string } | undefined
    let lastErr: unknown
    for (const [command, cmdArgs] of candidates) {
        try {
            spawned = await spawnRun(command, cmdArgs, spawnOptions)
            break
        } catch (err) {
            if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
                throw err
            }
            lastErr = err
        }
    }
    if (!spawned) {
        throw lastErr
    }

    const duration = Number(process.hrtime.bigint() - startedAt) / 1e6
    return {
        exitCode: spawned.exitCode,
        duration,
        durationMs: duration,
        stdout: spawned.stdout,
        stderr: spawned.stderr,
        ...(traceRunDir !== undefined
            ? { artifactPath: await findNewestTraceZip(traceRunDir, traceStartedAt) }
            : {}),
    }
}

/**
 * Runs `wdio run` against the given config without any trace overlay.
 * The spawned run is killed after `timeoutMs` if it does not finish, and
 * the spec path is validated to stay inside the project root.
 */
export async function runSpec(options: RunSpecOptions): Promise<SpecRunResult> {
    return runSpecCore({ ...options, trace: false })
}

/**
 * Shared run_spec / reproduce_spec tool invocation: resolves the model
 * spec against the project root, runs the core with clamped timeout, and
 * formats the JSON tails. Thin wrappers keep the tool name, missing-config
 * message and `trace` selection.
 */
export async function runSpecTool(options: SpecRunCoreOptions & { projectRoot: string; missingAction: string }): Promise<string> {
    if (!options.configPath) {
        return missingConfigMessage(options.missingAction)
    }
    const result = await runSpecCore({
        ...options,
        spec: await resolveIn(options.projectRoot, options.spec),
        projectRoot: options.projectRoot,
        timeoutMs: options.timeoutMs === undefined ? options.timeoutMs : clampTimeout(options.timeoutMs),
    })
    return formatRunResult(result)
}

/** @deprecated Use {@link SpecRunResult} instead. */
export type RunResult = SpecRunResult

/** Formats a run result as the JSON the tools return to the model. */
export function formatRunResult(
    result: SpecRunResult,
    options?: { stdoutTail?: number; stderrTail?: number },
): string {
    const output: Record<string, unknown> = {}
    if (result.artifactPath !== undefined) {
        output.artifactPath = result.artifactPath ?? null
    }
    output.exitCode = result.exitCode
    output.durationMs = result.durationMs
    if (result.stdout !== undefined) {
        output.stdoutTail = result.stdout.slice(-(options?.stdoutTail ?? 4000))
    }
    if (result.stderr !== undefined) {
        output.stderrTail = result.stderr.slice(-(options?.stderrTail ?? STDERR_TAIL_CHARS))
    }
    return JSON.stringify(output, null, 2)
}

/** Message returned when a tool needs a wdio.conf but none is configured. */
export function missingConfigMessage(action: string): string {
    return `No wdio.conf configured — cannot ${action}.`
}

/**
 * Runs the spec under the trace overlay and returns the fresh artifact.
 * The spawned run is killed after `timeoutMs` if it does not finish, and
 * the spec path is validated to stay inside the project root.
 */
export async function reproduceSpec(options: ReproduceOptions): Promise<SpecRunResult> {
    const result = await runSpecCore({
        ...options,
        projectRoot: projectRootForConfig(options.configPath),
        trace: true,
    })
    const { stdout: _dropped, ...rest } = result
    return rest
}
