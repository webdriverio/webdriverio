export interface SharedStoreServiceCapabilities extends WebdriverIO.Capabilities {
    'wdio:sharedStoreServicePort': number
}
export type GetValueOptions = { timeout: Number } | undefined

export type SharedStoreOptions = {
    /**
     * The port of the server, takes priority over capability key
     */
    port?: number,
    /**
     * Does not start a server and instead returns an instance ready to interact with an already created server
     */
    attach?: boolean,
    /**
     * The server can sometimes produce a 500 Internal Server error, this options ignores these
     */
    ignore500?: boolean
}