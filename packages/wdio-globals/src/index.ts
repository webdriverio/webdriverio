/// <reference path="../types.d.ts" />

type SupportedGlobals = 'browser' | 'driver' | 'multiremotebrowser' | '$' | '$$' | 'expect'

declare global {
    // eslint-disable-next-line no-var
    var _wdioGlobals: Map<SupportedGlobals, any>
}

/**
 * As this file gets imported/used as ESM and CJS artifact we have to make sure
 * that we can share the globals map across both files. For example if someone
 * runs a CJS project, we run this file as ESM (/build/index.js) first, but when
 * imported in the test, the same file will be used as CJS version (/cjs/index.js)
 * and can use the Map initiated by the testrunner by making it accessible globally.
 */
const globals: Map<SupportedGlobals, any> = globalThis._wdioGlobals = globalThis._wdioGlobals || new Map()
const GLOBALS_ERROR_MESSAGE = 'No browser instance registered. Don\'t import @wdio/globals outside of the WDIO testrunner context. Or you have two two different "@wdio/globals" packages installed.'

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
export const expect: ExpectWebdriverIO.Expect = ((...args: any) => {
    if (!globals.has('expect')) {
        throw new Error(GLOBALS_ERROR_MESSAGE)
    }
    return globals.get('expect')(...args)
}) as ExpectWebdriverIO.Expect

expect.extend = (...args: unknown[]) => {
    if (!globals.has('expect')) {
        throw new Error(GLOBALS_ERROR_MESSAGE)
    }
    const expect = globals.get('expect')
    return expect.extend(...args)
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
