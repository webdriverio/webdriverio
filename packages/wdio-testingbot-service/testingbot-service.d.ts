declare module WebdriverIO {
    interface ServiceOption extends TestingbotOptions {}
}

interface TestingbotOptions {
    /**
     * If true it runs the TestingBot Tunnel and opens a secure connection between a TestingBot
     * Virtual Machine running your browser tests.
     */
    tbTunnel?: boolean;
    /**
     * Apply TestingBot Tunnel options (e.g. to change port number or logFile settings). See
     * [this list](https://github.com/testingbot/testingbot-tunnel-launcher) for more information.
     */
    tbTunnelOpts?: object;
}
