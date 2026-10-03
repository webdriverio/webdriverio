
export type Instances = WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser

export type CustomCommandOptions<IsElement extends boolean = false> = {
    attachToElement?: IsElement,
    /**
     * add or overwrite the command on every browsing context (tab, window,
     * frame) instead of the browser. Cannot be combined with `attachToElement`.
     */
    attachToBrowsingContext?: IsElement extends true ? never : boolean,
    proto?: Record<string, unknown>,
    instances?: Record<string, Instances>,
    disableElementImplicitWait?: boolean
}