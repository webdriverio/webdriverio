export interface DisplayServerInstallOptions {
    /**
     * - 'root': install only if running as root (no sudo)
     * - 'sudo': allow non-interactive sudo when not root
     */
    mode?: 'root' | 'sudo'

    /** Custom install command; bypasses built-in package-manager detection. */
    command?: string | string[]
}

export interface DisplayDaemonOptions {
    width?: number
    height?: number
    /** Xvfb only; Wayland ignores it. */
    depth?: number
}

export interface DisplayDaemon {
    /** Env downstream children need, e.g. { DISPLAY: ':99' } or { WAYLAND_DISPLAY, XDG_RUNTIME_DIR }. */
    env: Record<string, string>

    /** Safe to call multiple times. */
    stop(): Promise<void>

    /**
     * Best-effort **synchronous** cleanup for Node's `'exit'` listener, where async
     * work is abandoned: `proc.kill('SIGKILL')` and `rmSync` any runtime files.
     * Safe to call multiple times and after `stop()`.
     */
    stopSync(): void
}

export interface DisplayServer {
    readonly name: 'wayland' | 'xvfb'

    isAvailable(): Promise<boolean>

    /** @returns true if the install succeeded or the server was already available. */
    install(options?: DisplayServerInstallOptions): Promise<boolean>

    getChromeFlags(): string[]

    /**
     * The launcher starts this so children spawned in a service `onPrepare`
     * (e.g. tauri-driver) inherit DISPLAY / WAYLAND_DISPLAY via process.env.
     */
    startDaemon(options?: DisplayDaemonOptions): Promise<DisplayDaemon>
}

export interface DisplayServerOptions {
    /** @default true */
    enabled?: boolean

    /**
     * - 'auto': Wayland first, then Xvfb fallback
     * - 'wayland': Wayland only
     * - 'xvfb': Xvfb only
     * @default 'auto'
     */
    displayServer?: 'auto' | 'wayland' | 'xvfb'

    /** @default false */
    autoInstall?: boolean

    /**
     * - 'root': install only if running as root (no sudo)
     * - 'sudo': allow non-interactive sudo when not root
     * @default 'sudo'
     */
    autoInstallMode?: 'root' | 'sudo'

    /** Custom install command; bypasses built-in package-manager detection. */
    autoInstallCommand?: string | string[]

    /** @default 3 */
    maxRetries?: number

    /** Base delay (ms); progressive: delay × attempt. @default 1000 */
    retryDelay?: number

    /** Run even on non-Linux systems (test seam). */
    force?: boolean
}
