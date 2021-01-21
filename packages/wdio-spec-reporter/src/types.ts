import { Options, Capabilities } from '@wdio/types'

export interface StateCount {
    passed: number
    failed: number
    skipped: number
}

export interface Symbols {
    passed: string
    skipped: string
    pending: string
    failed: string
}

export interface SpecReporterOptions {
    symbols?: Partial<Symbols>
}

export interface TestLink {
    config: Options.Testrunner
    capabilities: Capabilities.RemoteCapability
    sessionId?: string
    isMultiremote: boolean
    instanceName?: string
}
