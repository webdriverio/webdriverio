declare module "@wdio/browser-runner/setup" {
    export const socket: WebSockt
    export const connectPromise: Promise<WebSocket>
}

declare module "https://esm.sh/mocha@10.0.0" {
    export default any
}
