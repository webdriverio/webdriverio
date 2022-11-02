import type { Options, Capabilities, Services } from '@wdio/types'
import BaseReporter from './reporter.js'

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
        capabilities: Capabilities.Capabilities
    },
    cid?: string
}

export interface SessionEndedMessage {
    origin: 'worker'
    name: 'sessionEnded',
    cid: string
}
