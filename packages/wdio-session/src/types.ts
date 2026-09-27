import type { Capabilities } from '@wdio/types'

/**
 * Applicability of an action: web (browsers, Electron renderer, mobile web),
 * native mobile, native desktop.
 */
export type Applies = 'W' | 'M' | 'D'

export type PlatformKind = 'browser' | 'mobile' | 'desktop' | 'electron' | 'tauri' | 'dioxus'

export interface SerializedError {
    code: string
    message: string
    hint?: string
    package?: string
    install?: string[]
    details?: string
}

export interface ActionResult {
    text?: string
    code?: string
    data?: unknown
    files?: string[]
}

export interface Request {
    v: number
    id: string
    token: string
    action: string
    args: Record<string, unknown>
    cwd: string
    timeout?: number
}

export type Response = {
    v: number
    id: string
    ok: true
    result: ActionResult
} | {
    v: number
    id: string
    ok: false
    error: SerializedError
}

export interface AppiumPlan {
    /**
     * absolute path to Appium's main script, when the daemon starts the server
     */
    main?: string
    driver?: string
    port?: number
}

export interface DriverPlan {
    binary: string
    args: string[]
    port: number
}

export interface ElectronPlan {
    appBinaryPath?: string
    appEntryPoint?: string
    appArgs: string[]
    chromedriver?: string
    electronVersion?: string
    logDir: string
}

export interface RemoteOptions {
    hostname?: string
    port?: number
    path?: string
    protocol?: string
    user?: string
    key?: string
    logLevel?: string
    baseUrl?: string
    waitforTimeout?: number
    connectionRetryTimeout?: number
}

export interface OpenPlan {
    name: string
    cwd: string
    artifactsDir: string
    runtimeDir: string
    target: string
    /**
     * human readable target, e.g. `chrome` or `android (UiAutomator2)`
     */
    label: string
    platform: PlatformKind
    applies: Applies[]
    mode: 'remote' | 'electron' | 'driver'
    capabilities: Capabilities.RequestedStandaloneCapabilities
    remote: RemoteOptions
    url?: string
    viewport?: { width: number, height: number }
    headless: boolean
    bidi: boolean
    /**
     * end the session with a detach instead of `deleteSession`
     */
    detach?: boolean
    idleTimeout: number
    launchTimeout: number
    appium?: AppiumPlan
    driver?: DriverPlan
    electron?: ElectronPlan
    display?: boolean
    visualOptions?: Record<string, unknown>
    configPath?: string
    provider?: string
    /**
     * a tunnel this session should start (BrowserStack Local)
     */
    tunnel?: { package: string, entry: string, name?: string }
    /**
     * original `open` arguments, used by `restart`
     */
    argv: string[]
    notes: string[]
    /**
     * keep the existing history (used by `restart`)
     */
    keepHistory?: boolean
}

/**
 * the target specific part of an `OpenPlan`
 */
export type TargetPlan = Omit<OpenPlan, 'name' | 'cwd' | 'runtimeDir' | 'artifactsDir' | 'target' | 'remote' | 'bidi' | 'idleTimeout' | 'launchTimeout' | 'argv'> & Partial<Pick<OpenPlan, 'remote' | 'bidi'>>

export interface StateFile {
    version: number
    name: string
    pid: number | null
    status: 'starting' | 'ready' | 'failed'
    socket?: string
    token?: string
    cwd: string
    artifactsDir: string
    target?: string
    label?: string
    platform?: PlatformKind
    browserName?: string
    browserVersion?: string
    sessionId?: string
    bidi?: boolean
    url?: string
    startedAt: string
    lastRequestAt?: string
    error?: SerializedError
    /**
     * original `open` arguments, used by `restart`
     */
    argv?: string[]
    /**
     * set for sessions exposed by `wdio run --debug=agent`
     */
    debug?: { spec?: string, test?: string }
}

export interface HistoryEntry {
    n: number
    time: string
    kind: 'open' | 'action' | 'exec' | 'marker'
    code: string
    action?: string
    args?: Record<string, unknown>
    /**
     * pathname of the page when the step ran (web only), used by page objects
     */
    path?: string
}
