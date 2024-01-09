import type { SauceConnectOptions } from 'saucelabs'
import type { Capabilities, Options } from '@wdio/types'

// The Sauce Labs region.
export type Region = 'us' | 'eu' | 'staging';

export const apiURLMap = new Map<Region, string>([
    ['us', 'https://api.us-west-1.saucelabs.com'],
    ['eu', 'https://api.eu-central-1.saucelabs.com'],
    ['staging', 'https://api.staging.saucelabs.net'],
])

export interface SauceServiceConfig {
    /**
     * Specify the max error stack length represents the amount of error stack lines that will be
     * pushed to Sauce Labs when a test fails
     */
    maxErrorStackLength?: number

    /**
     * Specify tunnel identifier for Sauce Connect tunnel
     */
    tunnelIdentifier?: string

    /**
     * Specify tunnel identifier for Sauce Connect parent tunnel
     */
    parentTunnel?: string

    /**
     * If true it runs Sauce Connect and opens a secure connection between a Sauce Labs virtual
     * machine running your browser tests.
     *
     * @default false
     */
    sauceConnect?: boolean

    /**
     * Apply Sauce Connect options (e.g. to change port number or logFile settings). See this
     * list for more information: https://github.com/bermi/sauce-connect-launcher#advanced-usage
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
     * Use Sauce Connect as a Selenium Relay. See more [here](https://wiki.saucelabs.com/display/DOCS/Using+the+Selenium+Relay+with+Sauce+Connect+Proxy).
     * @deprecated
     */
    scRelay?: boolean

    /**
     * Dynamically control the name of the job
     */
    setJobName?: (
        config: Options.Testrunner,
        capabilities: Capabilities.RemoteCapability,
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
