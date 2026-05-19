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
 * Options for starting a long-lived display server daemon
 */
export interface DisplayDaemonOptions {
    /** Screen width in pixels */
    width?: number
    /** Screen height in pixels */
    height?: number
    /** Color depth (Xvfb only; Wayland implementations ignore this) */
    depth?: number
}

/**
 * Handle to a running display server daemon
 */
export interface DisplayDaemon {
    /**
     * Environment variables that downstream child processes need
     * (e.g. { DISPLAY: ':99' } or { WAYLAND_DISPLAY, XDG_RUNTIME_DIR, ... })
     */
    env: Record<string, string>

    /**
     * Terminate the daemon and clean up its socket / runtime files.
     * Must be safe to call multiple times.
     */
    stop(): Promise<void>

    /**
     * Best-effort **synchronous** cleanup, intended for use inside Node's
     * `'exit'` event handler — where any async work scheduled by the listener
     * is abandoned before it completes. Implementations should:
     *   - send a sync signal to the daemon child (`proc.kill('SIGKILL')` is
     *     fine here since we have no chance to wait for graceful exit), and
     *   - synchronously remove any runtime files (`rmSync(..., {force: true})`).
     *
     * Must be safe to call multiple times and after `stop()`.
     */
    stopSync(): void
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

    /**
     * Start the display server as a long-lived background daemon. Used by the
     * launcher service so child processes spawned in `onPrepare` (e.g. Tauri's
     * tauri-driver) inherit DISPLAY / WAYLAND_DISPLAY via process.env.
     *
     * Distinct from getProcessWrapper(): the wrapper is lifecycle-coupled to a
     * single child command, whereas a daemon outlives any individual child.
     */
    startDaemon(options?: DisplayDaemonOptions): Promise<DisplayDaemon>
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

