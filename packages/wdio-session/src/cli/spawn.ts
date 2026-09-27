import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'
import { spawn } from 'node:child_process'

import { SessionError } from '../errors.js'
import { createState, ensureRuntimeDir, isPidAlive, readState, removeState, updateState } from '../daemon/state.js'
import type { OpenPlan, StateFile } from '../types.js'

export interface SpawnOptions {
    /**
     * called with new daemon.log lines while waiting
     */
    onLog?: (line: string) => void
    daemonPath?: string
}

export function defaultDaemonPath () {
    return url.fileURLToPath(new URL('./daemon.js', import.meta.url))
}

export function tailFile (file: string, lines = 40) {
    try {
        return fs.readFileSync(file, 'utf-8').trimEnd().split('\n').slice(-lines).join('\n')
    } catch {
        return ''
    }
}

/**
 * Keep session artifacts out of git without touching the project's
 * `.gitignore`.
 */
function ignoreArtifacts (artifactsDir: string) {
    const root = path.dirname(artifactsDir)
    const file = path.join(root, '.gitignore')
    if (!fs.existsSync(file)) {
        fs.mkdirSync(root, { recursive: true })
        fs.writeFileSync(file, '# wdio session artifacts\n*\n')
    }
}

/**
 * Start a daemon for the plan and wait until the session is ready.
 */
export async function spawnDaemon (plan: OpenPlan, opts: SpawnOptions = {}): Promise<StateFile> {
    ensureRuntimeDir(plan.runtimeDir)
    fs.mkdirSync(plan.artifactsDir, { recursive: true })
    ignoreArtifacts(plan.artifactsDir)

    const existing = readState(plan.runtimeDir, plan.name)
    if (existing) {
        /**
         * a state file without PID belongs to an `open` that is spawning right now
         */
        const spawning = existing.pid === null && Date.now() - Date.parse(existing.startedAt) < 10_000
        if (!spawning && (existing.status === 'failed' || !isPidAlive(existing.pid))) {
            removeState(plan.runtimeDir, plan.name)
        }
    }
    try {
        createState(plan.runtimeDir, {
            name: plan.name,
            pid: null,
            status: 'starting',
            cwd: plan.cwd,
            artifactsDir: plan.artifactsDir,
            target: plan.target,
            label: plan.label,
            platform: plan.platform,
            argv: plan.argv,
            startedAt: new Date().toISOString()
        })
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'EEXIST') {
            throw new SessionError('SESSION_EXISTS', `Session "${plan.name}" is already running.`, {
                hint: `Use it, close it with \`wdio session close${plan.name === 'default' ? '' : ` -s ${plan.name}`}\`, or pass --replace.`
            })
        }
        throw err
    }

    const logFile = path.join(plan.artifactsDir, 'daemon.log')
    const logFd = fs.openSync(logFile, plan.keepHistory ? 'a' : 'w')
    const child = spawn(process.execPath, [opts.daemonPath || defaultDaemonPath()], {
        cwd: plan.cwd,
        detached: true,
        stdio: ['ignore', logFd, logFd],
        env: {
            ...process.env,
            WDIO_SESSION_OPEN: Buffer.from(JSON.stringify(plan)).toString('base64')
        },
        windowsHide: true
    })
    fs.closeSync(logFd)
    child.unref()
    updateState(plan.runtimeDir, plan.name, { pid: child.pid ?? null })

    const started = Date.now()
    let logOffset = 0
    const fail = (message: string, error?: StateFile['error']) => {
        if (isPidAlive(child.pid)) {
            try {
                process.kill(child.pid!, 'SIGTERM')
            } catch {
                // ignore
            }
        }
        removeState(plan.runtimeDir, plan.name)
        const code = error && error.code !== 'INTERNAL' && error.code !== 'SESSION_START_FAILED' ? error.code : 'SESSION_START_FAILED'
        return SessionError.fromJSON({
            ...(error || {}),
            code,
            message: error?.message ? `${message}: ${error.message}` : message,
            details: code === 'SESSION_START_FAILED' ? `Last lines of ${logFile}:\n${tailFile(logFile)}` : error?.details
        })
    }

    while (true) {
        await new Promise((resolve) => setTimeout(resolve, 100))
        if (opts.onLog) {
            try {
                const content = fs.readFileSync(logFile, 'utf-8')
                const fresh = content.slice(logOffset)
                logOffset = content.length
                fresh.split('\n').filter(Boolean).forEach((l) => opts.onLog!(l))
            } catch {
                // ignore
            }
        }
        const state = readState(plan.runtimeDir, plan.name)
        if (state?.status === 'ready') {
            return state
        }
        if (state?.status === 'failed') {
            throw fail(`Could not start ${plan.label} session "${plan.name}"`, state.error)
        }
        if (!isPidAlive(child.pid)) {
            throw fail(`The session daemon exited before "${plan.name}" was ready`)
        }
        if (Date.now() - started > plan.launchTimeout) {
            throw fail(`Session "${plan.name}" was not ready within ${plan.launchTimeout}ms`)
        }
    }
}

/**
 * Wait until a daemon process is gone, then remove leftover files.
 */
export async function waitForExit (runtimeDir: string, name: string, pid: number | null | undefined, timeout = 25_000) {
    const start = Date.now()
    while (isPidAlive(pid) && Date.now() - start < timeout) {
        await new Promise((resolve) => setTimeout(resolve, 100))
    }
    if (isPidAlive(pid)) {
        try {
            process.kill(pid!, 'SIGKILL')
        } catch {
            // ignore
        }
    }
    removeState(runtimeDir, name)
}
