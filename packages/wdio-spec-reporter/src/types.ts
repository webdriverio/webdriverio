import type { Capabilities } from '@wdio/types'

export interface StateCount {
    passed: number
    failed: number
    skipped: number
    pending: number
    retried: number
}

export interface Symbols {
    passed: string
    skipped: string
    pending: string
    failed: string
    retried: string
}

export interface SpecReporterOptions {
    /**
     * Be default the test results in Sauce Labs can only be viewed by a team member from the same team, not by a team
     * member from a different team. This options will enable
     * [sharable links](https://docs.saucelabs.com/test-results/sharing-test-results/#building-sharable-links)
     * by default, which means that all tests that are executed in Sauce Labs can be viewed by everybody.
     * Adding `sauceLabsSharableLinks: false`, in the reporter options will disable this feature.
     *
     * @default: true
     */
    sauceLabsSharableLinks?: boolean
    /**
     * Provide custom symbols for `passed`, `failed` and or `skipped` tests
     *
     * @default: {passed: '✓', skipped: '-', failed: '✖'}
     */
    symbols?: Partial<Symbols>
    /**
     * Ability to show only failed specs results
     *
     * @default: false
     */
    onlyFailures?: boolean
    /**
     * Ability to show console logs from steps in report
     *
     * @default: false
     */
    addConsoleLogs?: boolean
    /**
     * Ability to show test status realtime
     *
     * @default: `false`
     */
    realtimeReporting?: boolean
    /**
     * Ability to show or hide preface on each line of the report ('[MultiRemote ...]')
     *
     * @default: `true`
     */
    showPreface?: boolean
    /**
    * Ability to enable or disable colored output in terminal')
    *
    * @default: `true`
    */
    color?: boolean
}

export enum ChalkColors {
    RED = 'red',
    GREEN = 'green',
    CYAN = 'cyan',
    GRAY = 'gray',
    GREY = 'grey',
    BLACCK = 'black',
    YELLOW = 'yellow',
    BLUE = 'blue',
    MAGENTA = 'magenta',
    WHITE = 'white',
}

export enum State {
    FAILED = 'failed',
    PASSED = 'passed',
    PENDING = 'pending',
    SKIPPED = 'skipped',
    RETRIED = 'retried'
}

export interface TestLink {
    capabilities: Capabilities.ResolvedTestrunnerCapabilities
    sessionId: string
    isMultiremote: boolean
    instanceName?: string
}
