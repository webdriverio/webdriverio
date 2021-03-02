declare module 'testingbot-tunnel-launcher' {
    const testingbotTunnel: (options: TunnelLauncherOptions, cb: (err: Error, tunnel: TestingbotTunnel) => void) => void;
    export default testingbotTunnel;
}

