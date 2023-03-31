import type { Options, Capabilities, Services } from '@wdio/types'
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
    caps: Capabilities.RemoteCapability
    configFile: string
    retries: number
}

export interface TestFramework {
    init: (
        cid: string,
        config: Options.Testrunner,
        specs: string[],
        capabilities: Capabilities.RemoteCapability,
        reporter: BaseReporter
    ) => TestFramework
    run (): Promise<number>
    hasTests (): boolean
}

type SingleCapability = { capabilities: Capabilities.RemoteCapability }
export interface SingleConfigOption extends Omit<Options.Testrunner, 'capabilities'>, SingleCapability {}
export type MultiRemoteCaps = Record<string, (Capabilities.DesiredCapabilities | Capabilities.W3CCapabilities) & { sessionId?: string }>

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
        isMultiremote: boolean
        injectGlobals: boolean
        capabilities: Capabilities.Capabilities
    },
    cid?: string
}

export interface SessionEndedMessage {
    origin: 'worker'
    name: 'sessionEnded',
    cid: string
}

export interface WorkerHookResultMessage {
    origin: 'worker'
    name: 'workerHookResult',
    args: HookTriggerEvent
}

export interface WorkerCoverageMapMessage {
    origin: 'worker'
    name: 'coverageMap',
    content: { coverageMap: unknown }
}

/**
 * Duplicate of @wdio/browser-runner type, refactoring needed
 * see https://github.com/webdriverio/webdriverio/issues/9299
 */
export interface HookTriggerEvent {
    id: string
    cid: string
    name: string
    args: unknown[]
}
