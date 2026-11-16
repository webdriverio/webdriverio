import type { Capabilities } from '@wdio/types'

import type { RpcClient } from './rpc.js'

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
 * `timeouts` of the WebDriver protocol. mobilecli has no timeouts,
 * the driver only remembers what was set.
 */
export interface Timeouts {
    implicit?: number
    pageLoad?: number
    script?: number
}

/**
 * State of one session. mobilecli has no sessions: the id is made up by the
 * driver and the state only lives in this process.
 */
export interface Session {
    id: string
    rpc: RpcClient
    device: DeviceInfo
    timeouts: Timeouts
    /**
     * set by `deleteSession`
     */
    ended: boolean
}

export type Options = Capabilities.RemoteConfig
