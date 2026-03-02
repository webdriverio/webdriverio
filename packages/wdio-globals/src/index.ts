/* eslint-disable @typescript-eslint/no-explicit-any */

/// <reference path="../types.d.ts" />

type SupportedGlobals = 'browser' | 'driver' | 'multiremotebrowser' | '$' | '$$' | 'expect' | 'multiRemoteBrowser'

declare global {

    var _wdioGlobals: Map<SupportedGlobals, any>
    namespace WebdriverIO {
        interface Browser {}
        interface Element {}
        interface MultiRemoteBrowser {}
    }
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

            const receiver = globals.get(key)
            const field = receiver[prop]

            return typeof field === 'function'
                ? field.bind(receiver)
                : field
        }
    }
}

export const browser: WebdriverIO.Browser = new Proxy(
    class Browser {} as unknown as WebdriverIO.Browser,
    proxyHandler('browser')
)
export const driver: WebdriverIO.Browser = new Proxy(
    class Browser {} as unknown as WebdriverIO.Browser,
    proxyHandler('driver')
)
/**
 * @deprecated Use `multiRemoteBrowser` instead.
 */
export const multiremotebrowser: WebdriverIO.MultiRemoteBrowser = new Proxy(
    class Browser {} as unknown as WebdriverIO.MultiRemoteBrowser,
    proxyHandler('multiremotebrowser')
)
export const multiRemoteBrowser: WebdriverIO.MultiRemoteBrowser = new Proxy(
    class Browser {} as unknown as WebdriverIO.MultiRemoteBrowser,
    proxyHandler('multiRemoteBrowser')
)

// @ts-ignore
export const $: WebdriverIO.Browser['$'] = (...args: any) => {
    if (!globals.has('$')) {
        throw new Error(GLOBALS_ERROR_MESSAGE)
    }
    return globals.get('$')(...args)
}
// @ts-ignore
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

const ASYNC_MATCHERS = [
    'any',
    'anything',
    'arrayContaining',
    'objectContaining',
    'stringContaining',
    'stringMatching',
] as const

for (const matcher of ASYNC_MATCHERS) {
    expect[matcher] = (...args: any) => {
        if (!globals.has('expect')) {
            throw new Error(GLOBALS_ERROR_MESSAGE)
        }
        return globals.get('expect')[matcher](...args)
    }
}

expect.not = ASYNC_MATCHERS.reduce((acc, matcher) => {
    acc[matcher] = (...args: any) => {
        if (!globals.has('expect')) {
            throw new Error(GLOBALS_ERROR_MESSAGE)
        }
        return globals.get('expect').not[matcher](...args)
    }
    return acc
}, {} as ExpectWebdriverIO.AsymmetricMatchers)

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
        globalThis[key] = value
    }
}
