import type { ChildProcess } from 'node:child_process'

/**
 * Options for display server installation
 */
export interface DisplayServerInstallOptions {
    /**
     * Mode for automatic installation
     * - 'root': install only if running as root (no sudo)
     * - 'sudo': allow non-interactive sudo when not root
     */
    mode?: 'root' | 'sudo'

    /**
     * Custom installation command to use instead of built-in detection
     */
    command?: string | string[]
}

/**
 * Interface for display server implementations (Wayland, Xvfb)
 */
export interface DisplayServer {
    readonly name: 'wayland' | 'xvfb'

    /**
     * Check if this display server is available on the system
     */
    isAvailable(): Promise<boolean>

    /**
     * Install the display server if not available
     * @param options - Installation options
     * @returns true if installation succeeded or was already available
     */
    install(options?: DisplayServerInstallOptions): Promise<boolean>

    /**
     * Get environment variables needed for this display server
     */
    getEnvironment(): Record<string, string>

    /**
     * Get the command and arguments to wrap a process with this display server
     * @returns Array with command and args, or null if no wrapping needed
     */
    getProcessWrapper(): string[] | null

    /**
     * Get Chrome/Chromium flags needed for this display server
     */
    getChromeFlags(): string[]
}

/**
 * Options for DisplayServerManager
 */
export interface DisplayServerOptions {
    /**
     * Explicitly enable/disable display server usage
     * Maps from legacy option: autoXvfb
     * @default true
     */
    enabled?: boolean

    /**
     * Which display server to use
     * - 'auto': Try Wayland first, then Xvfb fallback
     * - 'wayland': Force Wayland only
     * - 'xvfb': Force Xvfb only
     * @default 'auto'
     */
    displayServer?: 'auto' | 'wayland' | 'xvfb'

    /**
     * Enable automatic installation of display server packages if missing
     * Maps from legacy option: xvfbAutoInstall
     * @default false
     */
    autoInstall?: boolean

    /**
     * Mode for automatic installation
     * - 'root': install only if running as root (no sudo)
     * - 'sudo': allow non-interactive sudo when not root
     * Maps from legacy option: xvfbAutoInstallMode
     * @default 'sudo'
     */
    autoInstallMode?: 'root' | 'sudo'

    /**
     * Custom installation command to use instead of built-in detection
     * Maps from legacy option: xvfbAutoInstallCommand
     */
    autoInstallCommand?: string | string[]

    /**
     * Number of retry attempts for display server startup failures
     * Maps from legacy option: xvfbMaxRetries
     * @default 3
     */
    maxRetries?: number

    /**
     * Base delay between retries in milliseconds (progressive: delay × attempt)
     * Maps from legacy option: xvfbRetryDelay
     * @default 1000
     */
    retryDelay?: number

    /**
     * Force display server to run even on non-Linux systems (for testing)
     */
    force?: boolean

    /**
     * Override package manager detection (for testing)
     */
    packageManager?: string

    /**
     * Skip availability check and force installation (for testing)
     */
    forceInstall?: boolean

    // Legacy option aliases for backward compatibility
    /**
     * @deprecated Use `enabled` instead
     */
    autoXvfb?: boolean
    /**
     * @deprecated Use `autoInstall` instead
     */
    xvfbAutoInstall?: boolean
    /**
     * @deprecated Use `autoInstallMode` instead
     */
    xvfbAutoInstallMode?: 'root' | 'sudo'
    /**
     * @deprecated Use `autoInstallCommand` instead
     */
    xvfbAutoInstallCommand?: string | string[]
    /**
     * @deprecated Use `maxRetries` instead
     */
    xvfbMaxRetries?: number
    /**
     * @deprecated Use `retryDelay` instead
     */
    xvfbRetryDelay?: number
}

/**
 * Interface for creating worker processes
 */
export interface ProcessCreator {
    createWorkerProcess(
        scriptPath: string,
        args: string[],
        options: ProcessCreationOptions
    ): Promise<ChildProcess>
}

/**
 * Options for process creation
 */
export interface ProcessCreationOptions {
    cwd?: string
    env?: Record<string, string>
    execArgv?: string[]
    stdio?: ('inherit' | 'pipe' | 'ignore' | 'ipc')[]
}
