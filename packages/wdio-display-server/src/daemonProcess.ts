import { spawn } from 'node:child_process'
import type logger from '@wdio/logger'
import { waitForSocket } from './utils.js'
import type { DisplayDaemon } from './types.js'

interface RunDaemonOptions {
    command: string
    args: string[]
    socketPath: string
    /** Exposed on the returned handle for downstream children. */
    env: Record<string, string>
    log: ReturnType<typeof logger>
    label: string
    socketLabel: string
    /** For the spawned process; defaults to inheriting process.env. */
    spawnEnv?: NodeJS.ProcessEnv
    timeoutMs?: number
    /** Runs after the process exits, in stop() and on startup failure. */
    cleanup?: () => void | Promise<void>
    /** Best-effort synchronous teardown for Node's 'exit' handler. */
    cleanupSync?: () => void
}

/**
 * Shared daemon lifecycle for the Wayland and Xvfb backends, which differ only
 * in command, socket derivation, exposed env, and per-backend cleanup.
 */
export async function runDaemon({
    command, args, socketPath, env, log, label, socketLabel, spawnEnv, timeoutMs = 10_000, cleanup, cleanupSync,
}: RunDaemonOptions): Promise<DisplayDaemon> {
    const proc = spawn(command, args, {
        // Capture stderr so a startup failure can be diagnosed.
        stdio: ['ignore', 'ignore', 'pipe'],
        ...(spawnEnv ? { env: spawnEnv } : {}),
    })

    // Keep only the tail of stderr to bound memory.
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

    // Resolve only once the process has actually exited, so cleanup never runs while
    // it's still alive. The 2s fallback prevents a wedge if 'exit' is never reported after SIGKILL.
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

    // Stop the socket poll once the race settles, so a premature crash doesn't
    // leave it polling in the background.
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

    // syncDone short-circuits stop() so a prior stopSync() isn't undone by a redundant
    // async cleanup, while still letting stopSync() run during an in-flight stop() —
    // otherwise an exit mid-stop() would orphan the child.
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
