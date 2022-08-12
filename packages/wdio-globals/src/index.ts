/// <reference path="../types.d.ts" />

type SupportedGlobals = 'browser' | 'driver' | 'multiremotebrowser' | '$' | '$$' | 'expect'

const globals: Map<SupportedGlobals, any> = new Map()
const GLOBALS_ERROR_MESSAGE = 'Don\'t import @wdio/globals outside of the WDIO testrunner context'

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

export const browser: WebdriverIO.Browser = new Proxy(
    class Browser {} as any as WebdriverIO.Browser,
    proxyHandler('browser')
)
export const driver: WebdriverIO.Browser = new Proxy(
    class Browser {} as any as WebdriverIO.Browser,
    proxyHandler('driver')
)
export const multiremotebrowser: WebdriverIO.MultiRemoteBrowser = new Proxy(
    class Browser {} as any as WebdriverIO.MultiRemoteBrowser,
    proxyHandler('multiremotebrowser')
)
export const $: WebdriverIO.Browser['$'] = (...args: any) => {
    if (!globals.has('$')) {
        throw new Error(GLOBALS_ERROR_MESSAGE)
    }
    return globals.get('$')(...args)
}
export const $$: WebdriverIO.Browser['$$'] = (...args: any) => {
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
        // @ts-expect-error
        globalThis[key] = value
    }
}
