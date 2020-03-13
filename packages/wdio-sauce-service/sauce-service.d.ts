declare module WebdriverIO {
    interface ServiceOption extends SauceServiceConfig {}
}

interface SauceServiceConfig {
    /**
     * If true it runs Sauce Connect and opens a secure connection between a Sauce Labs virtual
     * machine running your browser tests.
     */
    sauceConnect?: boolean;
    /**
     * Apply Sauce Connect options (e.g. to change port number or logFile settings). See this
     * list for more information: https://github.com/bermi/sauce-connect-launcher#advanced-usage
     */
    sauceConnectOpts?: object;
    /**
     * Use Sauce Connect as a Selenium Relay. See more [here](https://wiki.saucelabs.com/display/DOCS/Using+the+Selenium+Relay+with+Sauce+Connect+Proxy).
     * @deprecated
     */
    scRelay?: boolean;
}
