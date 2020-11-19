declare module 'testingbot-tunnel-launcher' {
    const testingbotTunnel: (options: TunnelLauncherOptions, cb: (err: Error, tunnel: TestingbotTunnel) => void) => void;
    export default testingbotTunnel;
}

interface TunnelLauncherOptions {
    // The TestingBot API key which you can get for free, listed in our member area
    apiKey: string;
 
    // The TestingBot API secret which you can get for free, listed in our member area
    apiSecret: string;
 
    // More verbose output from the tunnel
    verbose?: boolean;
 
    // Port on which the tunnel Selenium relay will listen for
    // requests. Default 4445. (optional)
    'se-port'?: number;
 
    // Proxy host and port the tunnel can use to connect to an upstream proxy
    // e.g. "localhost:1234" (optional)
    proxy?: string,
 
    // a comma-separated list of domains that
    // will not go through the tunnel. (optional)
    'fast-fail-regexps'?: string,
 
    // Write logging output to this logfile (optional)
    logfile?: string,
 
    // Change the tunnel version - see versions on https://testingbot.com/support/other/tunnel
    // "1.19" // or 2.1 (Java 8)
    tunnelVersion?: string,

    // A unique identifier for this tunnel (optional)
    tunnelIdentifier?: string,

    // This file will be touched when the tunnel is ready for usage (optional)
    readyFile?: string,

    // Use a custom DNS server. For example: 8.8.8.8 (optional)
    dns?: string,

    // Bypass the Caching Proxy running on the TestingBot tunnel VM.
    noproxy?: string,
}

interface TestingbotTunnel {
    close: (cb) => void;
}

