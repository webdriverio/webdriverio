export interface SharedStoreServiceCapabilities extends WebdriverIO.Capabilities {
    'wdio:sharedStoreServicePort': number
}
export type GetValueOptions = { timeout: Number } | undefined
