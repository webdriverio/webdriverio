interface SharedStoreServer {
    __store: WebdriverIO.JsonObject
    startServer: (port: number = 0, attach: boolean = false) => Promise<{ port: number, app: PolkaInstance }>
}
