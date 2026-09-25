import { exec, execFile } from 'node:child_process'
import { access } from 'node:fs/promises'
import { promisify } from 'node:util'
import type logger from '@wdio/logger'
import type { DisplayDaemonOptions, DisplayServerInstallOptions } from './types.js'

const execAsync = promisify(exec)
const execFileAsync = promisify(execFile)

// Package installs pull toolchains/mirrors and are slow; give them 4 minutes.
const INSTALL_TIMEOUT_MS = 240_000

/** True if `command` is on PATH. */
export async function commandExists(command: string): Promise<boolean> {
    try {
        await execAsync(`which ${command}`)
        return true
    } catch {
        return false
    }
}

/** Daemon screen geometry with the shared defaults applied (depth is Xvfb-only). */
export function resolveDaemonDimensions(options?: DisplayDaemonOptions): { width: number, height: number, depth: number } {
    return {
        width: options?.width ?? 1920,
        height: options?.height ?? 1080,
        depth: options?.depth ?? 24,
    }
}

/**
 * Poll for the socket file at `path` to appear, up to `timeoutMs`.
 *
 * @param label - name used in the timeout error message (e.g. "Xvfb socket").
 * @param signal - stops polling early; callers abort it once the exit/socket race settles.
 */
export async function waitForSocket(path: string, timeoutMs: number, label = 'socket', signal?: AbortSignal): Promise<void> {
    const deadline = Date.now() + timeoutMs
    while (Date.now() < deadline) {
        if (signal?.aborted) {
            return
        }
        try {
            await access(path)
            return
        } catch {
            await new Promise((resolve) => setTimeout(resolve, 50))
        }
    }
    throw new Error(`Timed out waiting for ${label} at ${path}`)
}

export async function detectPackageManager(): Promise<string> {
    const packageManagers = [
        { command: 'apt-get', name: 'apt' },
        { command: 'dnf', name: 'dnf' },
        { command: 'yum', name: 'yum' },
        { command: 'zypper', name: 'zypper' },
        { command: 'pacman', name: 'pacman' },
        { command: 'apk', name: 'apk' },
        { command: 'xbps-install', name: 'xbps' },
    ]

    for (const { command, name } of packageManagers) {
        try {
            // execFile (no shell) — no shell needed to run a fixed command name.
            await execFileAsync('which', [command])
            return name
        } catch { /* try the next candidate */ }
    }

    return 'unknown'
}

/**
 * Install a display server binary via the system package manager. Shared by the
 * Wayland and Xvfb backends, which supply only their own command table and name.
 */
export async function installViaPackageManager({
    name,
    packageCommands,
    log,
    options,
}: {
    name: string
    packageCommands: Record<string, string>
    log: ReturnType<typeof logger>
    options?: DisplayServerInstallOptions
}): Promise<boolean> {
    log.info(`Attempting to install ${name}...`)

    if (options?.command) {
        try {
            if (Array.isArray(options.command)) {
                // Array form = argv vector, no shell interpolation.
                const [bin, ...args] = options.command
                if (!bin) {
                    log.error(`Failed to install ${name}: options.command array is empty`)
                    return false
                }
                await execFileAsync(bin, args, { timeout: INSTALL_TIMEOUT_MS })
            } else {
                // String form = caller wants a shell.
                await execAsync(options.command, { timeout: INSTALL_TIMEOUT_MS })
            }
            log.info(`${name} installed successfully using custom command`)
            return true
        } catch (error) {
            log.error(`Failed to install ${name} with custom command:`, error)
            return false
        }
    }

    const packageManager = await detectPackageManager()

    if (!packageCommands[packageManager]) {
        log.error(`Unsupported package manager: ${packageManager}`)
        return false
    }

    const command = packageCommands[packageManager]
    let sudoWrap = false

    if (options?.mode === 'sudo') {
        if (process.getuid && process.getuid() !== 0) {
            try {
                await execFileAsync('which', ['sudo'])
                sudoWrap = true
            } catch {
                log.warn('sudo not available, attempting install without sudo')
            }
        }
    } else if (options?.mode === 'root') {
        if (process.getuid && process.getuid() !== 0) {
            log.error('Not running as root and autoInstallMode is "root"')
            return false
        }
    }

    try {
        // sudo path: pass `command` as one argv element to sh -c, so shell
        // metacharacters stay inside the inner shell.
        await (sudoWrap
            ? execFileAsync('sudo', ['-n', 'sh', '-c', command], { timeout: INSTALL_TIMEOUT_MS })
            : execAsync(command, { timeout: INSTALL_TIMEOUT_MS }))
        log.info(`${name} installed successfully`)
        return true
    } catch (error) {
        log.error(`Failed to install ${name}:`, error)
        return false
    }
}

/** Generic retry helper with progressive (linear) backoff, for first-attempt-flaky operations. */
export async function executeWithRetry<T>({
    fn,
    maxRetries,
    retryDelay,
    log,
    context = 'display server operation',
}: {
    fn: () => Promise<T>
    maxRetries: number
    retryDelay: number
    log: ReturnType<typeof logger>
    context?: string
}): Promise<T> {
    let lastError: Error | unknown = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            if (attempt === 1) {
                log.info(`Executing ${context}`)
            } else {
                log.info(`Retry attempt ${attempt}/${maxRetries}: ${context}`)
            }

            const result = await fn()

            if (attempt > 1) {
                log.info(`Success on attempt ${attempt}/${maxRetries}`)
            }
            return result
        } catch (error: unknown) {
            log.info(`Attempt ${attempt}/${maxRetries} failed: ${error}`)
            lastError = error

            if (attempt < maxRetries) {
                const delay = retryDelay * attempt
                log.info(`Waiting ${delay}ms before retry...`)
                await new Promise((resolve) => setTimeout(resolve, delay))
            } else {
                log.info(`All ${maxRetries} attempts failed`)
            }
        }
    }

    throw lastError
}
