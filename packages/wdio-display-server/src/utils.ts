import { exec } from 'node:child_process'
import { access } from 'node:fs/promises'
import { promisify } from 'node:util'
import type logger from '@wdio/logger'
import type { DisplayServerInstallOptions } from './types.js'

const execAsync = promisify(exec)

/**
 * Poll for a Unix socket file at `path` to appear, up to `timeoutMs`. Used by
 * display-server implementations after spawning their daemon process to confirm
 * the socket has been created before returning the daemon handle to the caller.
 *
 * @param label - human-readable name used in the timeout error message
 *                (e.g. "Wayland socket", "Xvfb socket").
 */
export async function waitForSocket(path: string, timeoutMs: number, label = 'socket'): Promise<void> {
    const deadline = Date.now() + timeoutMs
    while (Date.now() < deadline) {
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
            await execAsync(`which ${command}`)
            return name
        } catch {
            // Continue to next
        }
    }

    return 'unknown'
}

/**
 * Install a display server binary via the system package manager. Shared by
 * WaylandDisplayServer and XvfbDisplayServer, which each contribute only their
 * own per-package-manager command table and human-readable name.
 *
 * Behaviour:
 * - If `options.command` is provided, run it verbatim and return early.
 * - Otherwise pick a command from `packageCommands` based on detected PM.
 * - Honour `options.mode`:
 *   - `'sudo'`: when non-root and `sudo` is on PATH, wrap with
 *     `sudo -n sh -c "<cmd>"`; when sudo is missing, log a warning and
 *     attempt the install without elevation.
 *   - `'root'`: bail if not running as root.
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
        const command = Array.isArray(options.command) ? options.command.join(' ') : options.command
        try {
            await execAsync(command, { timeout: 240000 })
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

    let command = packageCommands[packageManager]

    if (options?.mode === 'sudo') {
        if (process.getuid && process.getuid() !== 0) {
            try {
                await execAsync('which sudo')
                command = `sudo -n sh -c "${command}"`
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
        await execAsync(command, { timeout: 240000 })
        log.info(`${name} installed successfully`)
        return true
    } catch (error) {
        log.error(`Failed to install ${name}:`, error)
        return false
    }
}

/**
 * Generic exponential-backoff retry helper. Used by DisplayServerManager to
 * retry display-server availability / daemon-start operations when the
 * underlying tool (Xvfb / Weston) is flaky on its first attempt.
 *
 * Lives in utils because it's a generic retry policy that doesn't reach into
 * any display-server state — DisplayServerManager.executeWithRetry is a thin
 * facade that forwards its configured maxRetries/retryDelay here.
 */
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
                log.info(`🚀 Executing ${context}`)
            } else {
                log.info(`🔄 Retry attempt ${attempt}/${maxRetries}: ${context}`)
            }

            const result = await fn()

            if (attempt > 1) {
                log.info(`✅ Success on attempt ${attempt}/${maxRetries}`)
            }
            return result
        } catch (error: unknown) {
            log.info(`❌ Attempt ${attempt}/${maxRetries} failed: ${error}`)
            lastError = error

            if (attempt < maxRetries) {
                const delay = retryDelay * attempt
                log.info(`⏳ Waiting ${delay}ms before retry...`)
                await new Promise((resolve) => setTimeout(resolve, delay))
            } else {
                log.info(`❌ All ${maxRetries} attempts failed`)
            }
        }
    }

    throw lastError
}
