import type { SauceConnectOptions } from 'saucelabs'

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
     * Use Sauce Connect as a Selenium Relay. See more [here](https://wiki.saucelabs.com/display/DOCS/Using+the+Selenium+Relay+with+Sauce+Connect+Proxy).
     * @deprecated
     */
    scRelay?: boolean
}
