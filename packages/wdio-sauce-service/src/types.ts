import type { SauceConnectOptions } from 'saucelabs'
import type { Capabilities, Options } from '@wdio/types'

export interface SauceServiceConfig {
    /**
     * Specify the max error stack length represents the amount of error stack lines that will be
     * pushed to Sauce Labs when a test fails
     */
    maxErrorStackLength?: number

    /**
     * Specify tunnel identifier for Sauce Connect tunnel
     */
    tunnelName?: string

    /**
     * Specify tunnel owner
     */
    tunnelOwner?: string

    /**
     * If true it runs Sauce Connect and opens a secure connection between a Sauce Labs virtual
     * machine running your browser tests.
     *
     * @default false
     */
    sauceConnect?: boolean

    /**
     * Apply Sauce Connect options (e.g. to change port number or logFile settings). See this
     * list for more information: https://docs.saucelabs.com/dev/cli/sauce-connect-5/run/
     *
     * @default {}
     */
    sauceConnectOpts?: SauceConnectOptions

    /**
     * Upload WebdriverIO logs to the Sauce Labs platform.
     * @default true
     */
    uploadLogs?: boolean

    /**
     * Dynamically control the name of the job
     */
    setJobName?: (
        config: Options.Testrunner,
        capabilities: Capabilities.ResolvedTestrunnerCapabilities,
        suiteTitle: string
    ) => string
}

export interface Provider {
    matcher(): boolean;
    ci: CI;
}

export interface CI {
    repo: string;
    refName: string;
    sha: string;
    user: string;
}
