type SupportedGlobals = 'browser' | 'driver' | 'multiremotebrowser' | '$' | '$$'

const globals: Map<SupportedGlobals, any> = new Map()
const GLOBALS_ERROR_MESSAGE = 'Don\'t import @wdio/globals outside of the WDIO testrunner context'

type BrowserSync = import('webdriverio').Browser<'async'>
type ElementSync = import('webdriverio').Element<'async'>
type MultiRemoteBrowserAsync = import('webdriverio').MultiRemoteBrowser<'async'>
type ElementArrayImport = import('webdriverio').ElementArray

declare namespace WebdriverIOAsync {
    interface Browser {}
    interface Element {}
    interface MultiRemoteBrowser {}
}

declare namespace WebdriverIO {
    interface Browser extends BrowserSync, WebdriverIOAsync.Browser { }
    interface Element extends ElementSync, WebdriverIOAsync.Element { }
    // @ts-expect-error
    interface MultiRemoteBrowser extends MultiRemoteBrowserAsync, WebdriverIOAsync.MultiRemoteBrowser { }
    interface ElementArray extends ElementArrayImport {}
}

declare global {
    var browser: WebdriverIO.Browser
    var driver: WebdriverIO.Browser
    var multiremotebrowser: WebdriverIO.MultiRemoteBrowser
    var $: (...args: Parameters<WebdriverIO.Browser['$']>) => ReturnType<WebdriverIO.Browser['$']>
    var $$: (...args: Parameters<WebdriverIO.Browser['$$']>) => ReturnType<WebdriverIO.Browser['$$']>
}

function proxyHandler (key: SupportedGlobals) {
    return {
        get: (self: never, prop: any) => {
            if (!globals.has(key)) {
                throw new Error(GLOBALS_ERROR_MESSAGE)
            }

            return globals.get(key)[prop]
        }
    }
}

export const browser = new Proxy(
    class Browser {} as any as WebdriverIO.Browser,
    proxyHandler('browser')
)
export const driver = new Proxy(
    class Browser {} as any as WebdriverIO.Browser,
    proxyHandler('driver')
)
export const multiremotebrowser = new Proxy(
    class Browser {} as any as WebdriverIO.MultiRemoteBrowser,
    proxyHandler('multiremotebrowser')
)
export const $ = (...args: any) => {
    if (!globals.has('$')) {
        throw new Error(GLOBALS_ERROR_MESSAGE)
    }
    return globals.get('$')(...args)
}
export const $$ = (...args: any) => {
    if (!globals.has('$$')) {
        throw new Error(GLOBALS_ERROR_MESSAGE)
    }
    return globals.get('$$')(...args)
}

/**
 * allows to set global property to be imported and used later on
 * @param key global key
 * @param value actual value to be returned
 * @private
 */
export function _setGlobal (key: SupportedGlobals, value: any, setGlobal = true) {
    globals.set(key, value)

    if (setGlobal) {
        globalThis[key] = value
    }
}
