import { spawn } from 'node:child_process'
import type logger from '@wdio/logger'
import { waitForSocket } from './utils.js'
import type { DisplayDaemon } from './types.js'

interface RunDaemonOptions {
    /** Executable to spawn, e.g. 'Xvfb' or 'weston'. */
    command: string
    args: string[]
    /** Socket file polled for before the daemon is considered ready. */
    socketPath: string
    /** Env exposed on the returned handle for downstream child processes. */
    env: Record<string, string>
    log: ReturnType<typeof logger>
    /** Label for process error messages and the stop log, e.g. 'Weston', 'Xvfb'. */
    label: string
    /** Label for the socket-wait timeout, e.g. 'Wayland socket', 'Xvfb socket'. */
    socketLabel: string
    /** Env for the spawned process; defaults to inheriting process.env. */
    spawnEnv?: NodeJS.ProcessEnv
    timeoutMs?: number
    /** Async teardown, run after the process exits in stop() and on startup failure. */
    cleanup?: () => void | Promise<void>
    /** Best-effort synchronous teardown for Node's 'exit' handler. */
    cleanupSync?: () => void
}

/**
 * Spawn a display-server daemon, wait for its socket, and return a handle whose
 * stop()/stopSync() tear it down. Shared by WaylandDisplayServer and
 * XvfbDisplayServer, which differ only in the command, socket derivation, exposed
 * env, and per-backend cleanup.
 */
export async function runDaemon({
    command, args, socketPath, env, log, label, socketLabel, spawnEnv, timeoutMs = 10_000, cleanup, cleanupSync,
}: RunDaemonOptions): Promise<DisplayDaemon> {
    const proc = spawn(command, args, {
        // Capture stderr (stdin/stdout ignored) so a startup failure can be
        // diagnosed — the daemon is otherwise silent.
        stdio: ['ignore', 'ignore', 'pipe'],
        ...(spawnEnv ? { env: spawnEnv } : {}),
    })

    // Keep only the tail of stderr to bound memory; surfaced in the exit error.
    let stderr = ''
    proc.stderr?.on('data', (chunk) => {
        stderr = (stderr + chunk.toString()).slice(-4096)
    })

    let rejectExit!: (err: Error) => void
    const exitPromise = new Promise<never>((_, reject) => { rejectExit = reject })
    const onExit = (code: number | null, signal: NodeJS.Signals | null) =>
        rejectExit(new Error(`${label} process exited unexpectedly (code=${code}, signal=${signal})${stderr ? `\n${stderr.trim()}` : ''}`))
    const onError = (err: Error) =>
        rejectExit(new Error(`${label} process error: ${err.message}`))
    proc.once('exit', onExit)
    proc.once('error', onError)

    // Resolve only once the process has actually exited, so cleanup never releases the
    // display reservation / removes the runtime dir out from under a not-yet-reaped
    // process. SIGTERM, then SIGKILL after a 1s grace, then keep waiting for 'exit'; a 2s
    // fallback prevents a wedge if 'exit' is somehow never reported after SIGKILL.
    const terminate = async (): Promise<void> => {
        if (proc.exitCode !== null || proc.signalCode !== null) {
            return
        }
        proc.kill('SIGTERM')
        await new Promise<void>((resolve) => {
            const sigkillTimer = setTimeout(() => {
                if (proc.exitCode === null && proc.signalCode === null) {
                    proc.kill('SIGKILL')
                }
            }, 1000)
            const fallbackTimer = setTimeout(() => {
                proc.removeListener('exit', onProcExit)
                resolve()
            }, 2000)
            function onProcExit () {
                clearTimeout(sigkillTimer)
                clearTimeout(fallbackTimer)
                resolve()
            }
            proc.once('exit', onProcExit)
        })
    }

    // Abort the socket poll once the race settles so it doesn't keep polling
    // in the background when exitPromise (a premature crash) wins.
    const socketWait = new AbortController()
    try {
        await Promise.race([waitForSocket(socketPath, timeoutMs, socketLabel, socketWait.signal), exitPromise])
    } catch (err) {
        proc.removeListener('exit', onExit)
        proc.removeListener('error', onError)
        await terminate()
        await cleanup?.()
        throw err
    } finally {
        socketWait.abort()
    }
    proc.removeListener('exit', onExit)
    proc.removeListener('error', onError)

    // syncDone short-circuits stop() so a prior stopSync() (sync teardown during
    // process exit) isn't undone by a redundant async cleanup, while still allowing
    // stopSync() to run when an async stop() is mid-flight — otherwise an exit fired
    // while stop() is awaiting would orphan the child.
    let stopPromise: Promise<void> | null = null
    let syncDone = false
    const stop = (): Promise<void> => {
        if (syncDone) {
            return Promise.resolve()
        }
        if (stopPromise) {
            return stopPromise
        }
        stopPromise = (async () => {
            log.info(`Stopping ${label} daemon`)
            await terminate()
            // Cleanup runs only after the process is gone — releasing/removing a
            // still-running daemon's resources would race a concurrent restart.
            await cleanup?.()
        })()
        return stopPromise
    }

    const stopSync = (): void => {
        if (syncDone) {
            return
        }
        syncDone = true
        try {
            if (proc.exitCode === null && proc.signalCode === null) {
                proc.kill('SIGKILL')
            }
        } catch { /* process may already be gone */ }
        cleanupSync?.()
    }

    return { env, stop, stopSync }
}
