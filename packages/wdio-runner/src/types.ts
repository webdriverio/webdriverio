import type { Capabilities, Services, Workers } from '@wdio/types'
import type { getConfig, matchers } from 'expect-webdriverio'
import type { AddCommandFunction, CustomCommandOptions, Instances } from 'webdriverio'

import type BaseReporter from './reporter.js'

/**
 * Represents a custom command stored by the protocol stub before the session starts.
 * Supports both:
 * - options object format: [name, fn, CustomCommandOptions]
 * - deprecated positional format: [name, fn, attachToElement, proto?, instances?]
 */
export type CustomStubCommand =
    | CustomStubCommandWithOptions
    | LegacyCustomStubCommand
export type CustomStubCommandWithOptions = [string, AddCommandFunction<boolean>, CustomCommandOptions<boolean>]
/** @deprecated use CustomStubCommandWithOptions, to remove in v10 */
export type LegacyCustomStubCommand = [string, AddCommandFunction<boolean>, boolean?, Record<string, unknown>?, Record<string, Instances>?]

export type BeforeArgs = Parameters<Required<Services.HookFunctions>['before']>
export type AfterArgs = Parameters<Required<Services.HookFunctions>['after']>
export type BeforeSessionArgs = Parameters<Required<Services.HookFunctions>['beforeSession']>
export type AfterSessionArgs = Parameters<Required<Services.HookFunctions>['afterSession']>

interface Args extends Partial<WebdriverIO.Config> {
    ignoredWorkerServices?: string[]
    watch?: boolean
}

export type RunParams = {
    cid: string
    args: Args
    specs: string[]
    caps: Capabilities.RequestedStandaloneCapabilities | Capabilities.RequestedMultiremoteCapabilities
    configFile: string
    retries: number
}

export interface TestFramework {
    init: (
        cid: string,
        config: WebdriverIO.Config,
        specs: string[],
        capabilities: Capabilities.RequestedStandaloneCapabilities | Capabilities.RequestedMultiremoteCapabilities,
        reporter: BaseReporter
    ) => TestFramework
    run (): Promise<number>
    hasTests (): boolean
    setupExpect?: (
        wdioExpect: ExpectWebdriverIO.Expect,
        wdioMatchers: typeof matchers,
        getExpectConfig: typeof getConfig
    ) => void
}

export interface SessionStartedMessage {
    origin: 'worker'
    name: 'sessionStarted'
    content: {
        sessionId: string
        isW3C: boolean
        protocol: string
        hostname: string
        port: number
        path: string
        headers: Record<string, string>
        isMultiremote: boolean
        injectGlobals: boolean
        capabilities: WebdriverIO.Capabilities
    },
    cid?: string
}

export interface SnapshotResultMessage {
    origin: 'worker'
    name: 'snapshot'
    content: {
        filepath: string
        added: number
        fileDeleted: boolean
        matched: number
        unchecked: number
        uncheckedKeys: string[]
        unmatched: number
        updated: number
    }[]
}

export interface SessionEndedMessage {
    origin: 'worker'
    name: 'sessionEnded',
    cid: string
}

export interface WorkerResponseMessage {
    origin: 'worker'
    name: 'workerResponse',
    args: {
        id: number
        message: Workers.SocketMessage
    }
}
