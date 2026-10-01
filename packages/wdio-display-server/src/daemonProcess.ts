import { spawn, type ChildProcess } from 'node:child_process'
import { once } from 'node:events'
import { createInterface } from 'node:readline'
import type { Readable } from 'node:stream'
import type logger from '@wdio/logger'
import { waitForSocket } from './utils.js'
import type { DisplayDaemon } from './types.js'

/** The descriptor a daemon reports its display number on. */
export const DISPLAY_FD = 3

type Readiness =
    | { socketPath: string, socketLabel: string, env: Record<string, string> } // poll for a socket file to appear
    | { displayFd: true, env: (display: string) => Record<string, string> } // the daemon writes its display number to DISPLAY_FD once listening

interface RunDaemonOptions {
    command: string
    args: string[]
    /** How to tell the daemon is ready, and the env to expose on the returned handle. */
    ready: Readiness
    log: ReturnType<typeof logger>
    label: string
    /** For the spawned process; defaults to inheriting process.env. */
    spawnEnv?: NodeJS.ProcessEnv
    timeoutMs?: number
    /** Runs after the process exits or fails to spawn, in stop() and on startup failure. */
    cleanup?: () => void | Promise<void>
    /** Best-effort synchronous teardown for Node's 'exit' handler. */
    cleanupSync?: () => void
}

async function readDisplayNumber(stream: Readable, timeoutMs: number, label: string, signal: AbortSignal): Promise<string> {
    const lines = createInterface({ input: stream })
    const timeout = AbortSignal.timeout(timeoutMs)
    try {
        const [line] = await once(lines, 'line', { signal: AbortSignal.any([signal, timeout]) })
        return String(line).trim()
    } catch (err) {
        if (timeout.aborted) {
            throw new Error(`Timed out waiting for ${label} to report its display on fd ${DISPLAY_FD}`)
        }
        throw err
    } finally {
        lines.close()
    }
}

/** Shared daemon lifecycle for the Wayland and Xvfb backends. */
export async function runDaemon({
    command, args, ready, log, label, spawnEnv, timeoutMs = 10_000, cleanup, cleanupSync,
}: RunDaemonOptions): Promise<DisplayDaemon> {
    const displayFd = 'displayFd' in ready
    const stdio: Array<'ignore' | 'pipe'> = displayFd
        ? ['ignore', 'ignore', 'pipe', 'pipe'] // stderr for startup errors, and DISPLAY_FD
        : ['ignore', 'ignore', 'pipe']
    let proc: ChildProcess
    try {
        proc = spawn(command, args, { stdio, ...(spawnEnv ? { env: spawnEnv } : {}) })
    } catch (err) { // errnos like E2BIG throw synchronously instead of emitting 'error'
        await cleanup?.()
        throw err
    }

    let syncDone = false
    const stopSync = (): void => {
        if (syncDone) {
            return
        }
        syncDone = true
        process.off('exit', stopSync)
        try {
            if (proc.pid !== undefined && proc.exitCode === null && proc.signalCode === null) { // a failed spawn has no pid, and kill() would then signal the whole process group
                proc.kill('SIGKILL') // an 'exit' listener can't wait for a graceful SIGTERM exit
            }
        } catch { /* process may already be gone */ }
        cleanupSync?.()
    }
    process.once('exit', stopSync) // before startup finishes, so exiting mid-startup still kills the child

    // Keep only the tail of stderr to bound memory.
    let stderr = ''
    proc.stderr?.on('data', (chunk) => {
        stderr = (stderr + chunk.toString()).slice(-4096)
    })
    proc.stderr?.on('error', (err) => log.debug(`${label} stderr error: ${err.message}`))

    let rejectExit!: (err: Error) => void
    const exitPromise = new Promise<never>((_, reject) => { rejectExit = reject })
    const onClose = (code: number | null, signal: NodeJS.Signals | null) =>
        rejectExit(new Error(`${label} process exited unexpectedly (code=${code}, signal=${signal})`))
    const onError = (err: Error) => {
        log.debug(`${label} process error: ${err.message}`)
        rejectExit(new Error(`${label} process error: ${err.message}`))
    }
    proc.once('close', onClose) // unlike 'exit', 'close' waits for stderr to drain, so the error has the full tail
    proc.on('error', onError) // never removed: an unhandled 'error' from a kill during teardown would crash the process

    const displayStream = displayFd ? proc.stdio?.[DISPLAY_FD] as Readable | undefined : undefined
    displayStream?.on('error', (err) => log.debug(`${label} fd ${DISPLAY_FD} error: ${err.message}`)) // an unhandled 'error' after readline detaches would crash the process

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

    const teardown = async (): Promise<void> => {
        try {
            await terminate()
            if (!syncDone) {
                await cleanup?.()
            }
        } finally {
            process.off('exit', stopSync) // removed last, so an exit mid-teardown still kills the child
        }
    }

    const readyWait = new AbortController() // ends the readiness wait once the race settles, so a crash doesn't leave it running
    let env: Record<string, string>
    try {
        let readiness: Promise<Record<string, string>>
        if (!displayFd) {
            readiness = waitForSocket(ready.socketPath, timeoutMs, ready.socketLabel, readyWait.signal).then(() => ready.env)
        } else if (displayStream) {
            readiness = readDisplayNumber(displayStream, timeoutMs, label, readyWait.signal).then((display) => {
                log.info(`${label} reported display ${display} on fd ${DISPLAY_FD}`)
                return ready.env(display)
            })
        } else {
            readiness = exitPromise // spawn failed, e.g. with EMFILE, so only its 'error' can settle this
        }
        env = await Promise.race([readiness, exitPromise])
    } catch (err) {
        await teardown()
        const tail = stderr.trim()
        throw tail ? new Error(`${(err as Error).message}\n${tail}`, { cause: err }) : err
    } finally {
        readyWait.abort()
        proc.removeListener('close', onClose)
    }

    let stopPromise: Promise<void> | null = null
    const stop = (): Promise<void> => {
        if (!stopPromise && syncDone) { // stopSync() already killed the child
            return Promise.resolve()
        }
        stopPromise ??= (async () => {
            log.info(`Stopping ${label} daemon`)
            await teardown()
        })()
        return stopPromise
    }

    return { env, stop, stopSync }
}
