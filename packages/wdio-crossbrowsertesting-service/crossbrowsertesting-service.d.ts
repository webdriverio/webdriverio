declare module WebdriverIO {
    interface ServiceOption extends CrossBrowserTestingConfig {}
}

interface CrossBrowserTestingConfig {
    /**
     * If true secure CBT local connection is started.
     */
    cbtTunnel?: boolean;
    /**
     * Any additional options to pass along to the `start()` function of [cbt_tunnels](https://www.npmjs.com/package/cbt_tunnels)
     */
    cbtTunnelOpts?: object;
}
