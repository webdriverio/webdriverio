interface SharedStoreServer {
    __store: WebdriverIO.JsonObject
    startServer: () => Promise<{ port: number }>
    stopServer: () => Promise<void>
}
