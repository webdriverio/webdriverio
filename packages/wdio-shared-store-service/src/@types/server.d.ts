interface SharedStoreServer {
    __store: WebdriverIO.JsonObject
    startServer: () => Promise<{ port: number, app: PolkaInstance }>
}
