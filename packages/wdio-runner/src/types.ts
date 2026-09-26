import type { AnyRunnerToBrowserMessage, Capabilities, Services } from '@wdio/types'
import type { getDefaultOptions, wdioCustomMatchers } from 'expect-webdriverio'
import type { AddCommandFunction, CustomCommandOptions } from 'webdriverio'

import type BaseReporter from './reporter.js'

/**
 * Represents a custom command stored by the protocol stub before the session starts.
 * Both `addCommand` and `overwriteCommand` are stored as `[name, fn, options]`.
 */
export type CustomStubCommand = [string, AddCommandFunction<boolean>, CustomCommandOptions<boolean>]

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
        wdioMatchers: typeof wdioCustomMatchers,
        getExpectConfig: typeof getDefaultOptions
    ) => void | Promise<void>
}

export interface SessionStartedMessage {
    origin: 'worker'
    name: 'sessionStarted'
    content: {
        sessionId: string
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

export interface WorkerTimingsMessage {
    origin: 'worker'
    name: 'workerTimings'
    cid?: string
    content: {
        setup?: number
        execution?: number
        teardown?: number
        total?: number
    }
}

export interface WorkerResponseMessage {
    origin: 'worker'
    name: 'workerResponse',
    args: {
        /**
         * Communicator routing id, matching the id the browser runner assigned
         * when it forwarded the browser message. Not the id inside `message.value`.
         */
        id: number
        message: AnyRunnerToBrowserMessage
    }
}
