import type { Capabilities } from '@wdio/types'

import type { DEFAULT_SETTINGS } from './constants.js'
import type { ElementRegistry } from './elements.js'
import type { RpcClient } from './rpc.js'
import type { TreeNode } from './tree.js'

/**
 * `device.resolve`: the device an id refers to, or the only online device
 */
export interface ResolvedDevice {
    id: string
    platform: string
    type: string
}

/**
 * `device.info`
 */
export interface DeviceInfo {
    id: string
    name: string
    platform: string
    type: string
    version?: string
    state?: string
    model?: string
    screenSize?: {
        width: number
        height: number
        scale?: number
    }
}

export interface DeviceInfoResult {
    device: DeviceInfo
}

/**
 * what mobilecli reads from an app file
 */
export interface InstalledApp {
    /**
     * the bundle id (iOS) or the package name (Android)
     */
    packageName: string
    version?: string
    versionCode?: string
}

/**
 * `device.apps.foreground`
 */
export interface ForegroundApp {
    packageName?: string
    bundleId?: string
    appName?: string
    version?: string
}

/**
 * `device.apps.install`, without `app` if mobilecli could not read the file
 */
export interface InstallResult {
    message: string
    app?: InstalledApp
}

/**
 * `timeouts` of the WebDriver protocol. The driver only has `implicit`: how
 * long a command waits for its element, see `setTimeouts`.
 */
export interface Timeouts {
    implicit?: number
}

/**
 * the settings of a session, see `getSettings`
 */
export type Settings = typeof DEFAULT_SETTINGS & {
    actionTimeout?: number
    pollInterval?: number
}

/**
 * a look at the screen that find commands can share
 */
export interface ScreenDump {
    tree: TreeNode[]
    /**
     * when, in ms
     */
    at: number
    /**
     * the selectors that were searched in it, and how often
     */
    served: Map<string, number>
}

/**
 * The options of a command that types: `CommandRuntimeOptions` of the
 * `webdriver` package, which WebdriverIO passes as the last parameter of
 * `elementSendKeys` for `addValue(text, { mask: true })`
 */
export interface TextOptions {
    mask?: boolean
}

export interface WaitOptions {
    timeout: number
    interval: number
}

/**
 * State of one session. mobilecli has no sessions: the id is made up by the
 * driver and the state only lives in this process.
 */
export interface Session {
    id: string
    rpc: RpcClient
    device: DeviceInfo
    /**
     * what `browser.setTimeout()` set
     */
    timeouts: Timeouts
    /**
     * the capability `mobilecli:options` on top of the defaults
     */
    settings: Settings
    /**
     * How long a command waits for its element, and how long it waits
     * between two looks at the screen. Worked out before every command,
     * see `getWaitOptions`.
     */
    wait: WaitOptions
    /**
     * the elements that were found in this session
     */
    elements: ElementRegistry
    /**
     * the last look at the screen, see `findElementReferences`
     */
    lastDump?: ScreenDump
    /**
     * set by `deleteSession`
     */
    ended: boolean
}

export type Options = Capabilities.RemoteConfig
