interface SharedStoreServer {
    __store: WebdriverIO.JsonObject
    startServer: () => Promise<{ port: string }>
    stopServer: () => Promise<void>
}
