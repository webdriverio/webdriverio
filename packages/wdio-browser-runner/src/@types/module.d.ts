declare module "@wdio/browser-runner/setup" {
    export const socket: WebSockt
    export const connectPromise: Promise<WebSocket>
}
