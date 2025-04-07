export interface ContextProps {
    isIframe: boolean
    isTab: boolean
    isWindow: boolean
    request?: WebdriverIO.Request
    parent?: WebdriverIO.BrowsingContext
}
