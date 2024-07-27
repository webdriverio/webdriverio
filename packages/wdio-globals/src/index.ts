/// <reference path="../types.d.ts" />
import { AsyncLocalStorage } from 'node:async_hooks'

type SupportedGlobals = 'browser' | 'driver' | 'multiremotebrowser' | '$' | '$$' | 'expect'

declare global {
    // eslint-disable-next-line no-var
    var _wdioGlobals: Map<SupportedGlobals, any>
    // eslint-disable-next-line no-var
    var _wdioGlobalsStorage: AsyncLocalStorage<Map<SupportedGlobals, any>>
}

/**
 * As this file gets imported/used as ESM and CJS artifact we have to make sure
 * that we can share the globals map across both files. For example if someone
 * runs a CJS project, we run this file as ESM (/build/index.js) first, but when
 * imported in the test, the same file will be used as CJS version (/cjs/index.js)
 * and can use the Map initiated by the testrunner by making it accessible globally.
 */
const globalsDefault: Map<SupportedGlobals, any> = globalThis._wdioGlobals = globalThis._wdioGlobals || new Map<SupportedGlobals, any>()
const globalsStorage: AsyncLocalStorage<Map<SupportedGlobals, any>> = globalThis._wdioGlobalsStorage = globalThis._wdioGlobalsStorage || new AsyncLocalStorage<Map<SupportedGlobals, any>>()
const GLOBALS_ERROR_MESSAGE = 'No browser instance registered. Don\'t import @wdio/globals outside of the WDIO testrunner context. Or you have two two different "@wdio/globals" packages installed.'

function getGlobalKey(key: SupportedGlobals) {
    const globals = globalsStorage.getStore() || globalsDefault
    if (!globals.has(key)) {
        throw new Error(GLOBALS_ERROR_MESSAGE)
    }
    return globals.get(key)
}

function proxyHandler (key: SupportedGlobals) {
    return {
        get: (self: never, prop: any) => {
            const receiver = getGlobalKey(key)
            const field = receiver[prop]

            return typeof field === 'function'
                ? field.bind(receiver)
                : field
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
    return getGlobalKey('$')(...args)
}
export const $$: WebdriverIO.Browser['$$'] = (...args: any) => {
    return getGlobalKey('$$')(...args)
}
export const expect: ExpectWebdriverIO.Expect = ((...args: any) => {
    return getGlobalKey('expect')(...args)
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
        return getGlobalKey('expect')[matcher](...args)
    }
}

expect.not = ASYNC_MATCHERS.reduce((acc, matcher) => {
    acc[matcher] = (...args: any) => {
        return getGlobalKey('expect').not[matcher](...args)
    }
    return acc
}, {} as ExpectWebdriverIO.AsymmetricMatchers)

expect.extend = (...args: unknown[]) => {
    const expect = getGlobalKey('expect')
    return expect.extend(...args)
}

/**
 * allows to set global property to be imported and used later on
 * @param key global key
 * @param value actual value to be returned
 * @private
 */
export function _setGlobal (key: SupportedGlobals, value: any, setGlobal = true) {
    (globalsStorage.getStore() || globalsDefault)?.set(key, value)

    if (setGlobal) {
        //Sets the proxy instead of the value globaly so that LocalStorage is used when ever it applies.
        globalThis[key] = { browser, driver, multiremotebrowser, $, $$, expect }[key] as any
    }
}

/**
 * allows having different global values per each execution without them getting overriden by the other
 * @param ctx
 * @param callback
 * @returns
 */
export function _runInGlobalStorage(ctx: Map<SupportedGlobals, any>, callback: () => void) {
    return globalsStorage.run(ctx, callback)
}
