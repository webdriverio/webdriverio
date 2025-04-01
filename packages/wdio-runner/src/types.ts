import type { Options, Capabilities, Services, Workers } from '@wdio/types'
import type BaseReporter from './reporter.js'

export type BeforeArgs = Parameters<Required<Services.HookFunctions>['before']>
export type AfterArgs = Parameters<Required<Services.HookFunctions>['after']>
export type BeforeSessionArgs = Parameters<Required<Services.HookFunctions>['beforeSession']>
export type AfterSessionArgs = Parameters<Required<Services.HookFunctions>['afterSession']>

interface Args extends Partial<Options.Testrunner> {
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
        config: Options.Testrunner,
        specs: string[],
        capabilities: Capabilities.RequestedStandaloneCapabilities | Capabilities.RequestedMultiremoteCapabilities,
        reporter: BaseReporter
    ) => TestFramework
    run (): Promise<number>
    hasTests (): boolean
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
