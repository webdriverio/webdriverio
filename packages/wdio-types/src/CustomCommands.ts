export type Instances = WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser

export type CustomCommandOptions<IsElement extends boolean = false> = {
    attachToElement?: IsElement,
    proto?: Record<string, unknown>,
    instances?: Record<string, Instances>,
    disableElementImplicitWait?: boolean
}