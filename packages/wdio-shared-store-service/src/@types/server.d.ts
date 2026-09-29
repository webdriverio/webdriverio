interface SharedStoreServer {
    startServer: () => Promise<{ port: number, app: PolkaInstance }>
}
