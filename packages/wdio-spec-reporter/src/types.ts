import type { Capabilities } from '@wdio/types'

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
    /**
     * Be default the test results in Sauce Labs can only be viewed by a team member from the same team, not by a team
     * member from a different team. This options will enable
     * [sharable links](https://wiki.saucelabs.com/display/DOCS/Building+Sharable+Links+to+Test+Results)
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
}

export interface TestLink {
    capabilities: Capabilities.RemoteCapability
    sessionId: string
    isMultiremote: boolean
    instanceName?: string
}
