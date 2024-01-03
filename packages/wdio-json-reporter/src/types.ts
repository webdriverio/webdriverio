import type { Capabilities } from '@wdio/types'

export type State = 'passed' | 'failed' | 'skipped' | 'pending'

export interface SuiteState {
    passed: number
    failed: number
    skipped: number
}

export interface ResultSet {
    start: Date
    end?: Date
    capabilities: Capabilities.RemoteCapability
    framework?: string
    mochaOpts?: WebdriverIO.MochaOpts
    jasmineOpts?: WebdriverIO.JasmineOpts
    cucumberOpts?: WebdriverIO.CucumberOpts
    suites: TestSuite[]
    specs: string[]
    state: SuiteState
}

export interface TestSuite {
    name: string
    duration: number
    start: Date
    end?: Date
    sessionId?: string
    tests: Test[]
    hooks: Hook[]
}

export interface Test {
    name: string
    state: State
    duration: number
    start: Date
    end?: Date
    error?: Error
}

export interface Hook {
    title: string
    state: State
    duration: number
    start: Date
    end?: Date
    associatedSuite?: string
    associatedTest?: string
    error?: Error
}
