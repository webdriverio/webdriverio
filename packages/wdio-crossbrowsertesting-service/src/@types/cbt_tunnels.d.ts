declare module 'cbt_tunnels' {
    const cbt: CBTTunnelInterface;
    export default cbt;
}

interface CBTTunnelInterface {
    start: (config: CBTConfigInterface, callback: (err: Error | null) => void) => void;
    stop: (callback: Function) => void;
}

interface CBTConfigInterface {
    username?: string,
    authkey?: string,
    nokill?: boolean,
}
