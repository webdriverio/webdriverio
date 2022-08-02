type SupportedGlobals = 'browser'

const globals: Map<SupportedGlobals, any> = new Map()

function proxyHandler (key: SupportedGlobals) {
    return {
        get: (self: never, prop: any) => {
            if (!globals.has(key)) {
                throw new Error('Don\'t import @wdio/globals outside of the testrunner context')
            }

            return globals.get(key)[prop]
        }
    }
}

export const browser = new Proxy(
    class Browser {} as any as WebdriverIO.Browser,
    proxyHandler('browser')
)

/**
 * allows to set global property to be imported and used later on
 * @param key global key
 * @param value actual value to be returned
 * @private
 */
export function _setGlobal (key: SupportedGlobals, value: any) {
    globals.set(key, value)
}
