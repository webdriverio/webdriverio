import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import sourceMapSupportUrl from 'source-map-support/browser-source-map-support.js?url'

import { guardSourceMapLookups } from '../../src/browser/intercepts.js'
import { getStack } from './__fixtures__/stack.js'

declare const sourceMapSupport: { install (): void }

/**
 * the line of `new Error` in `__fixtures__/stack.ts`
 */
const MAPPED_FRAME = 'stack.ts:10:'

/**
 * source-map-support with the guard, in a real browser, as the runner page
 * sets it up: the template loads it as a script, `setup.ts` adds the guard
 */
describe('guardSourceMapLookups with source-map-support', () => {
    const prepareStackTrace = Error.prepareStackTrace
    const open = XMLHttpRequest.prototype.open
    let requests: string[] = []

    beforeAll(async () => {
        await new Promise((resolve, reject) => {
            const script = document.createElement('script')
            script.src = sourceMapSupportUrl
            script.onload = resolve
            script.onerror = reject
            document.head.append(script)
        })
        sourceMapSupport.install()
        Error.prepareStackTrace = guardSourceMapLookups(Error.prepareStackTrace!)
        XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, ...args: Parameters<typeof open>) {
            requests.push(String(args[1]))
            return open.apply(this, args)
        } as typeof open
    })

    beforeEach(() => {
        requests = []
    })

    afterAll(() => {
        Error.prepareStackTrace = prepareStackTrace
        XMLHttpRequest.prototype.open = open
        window.__wdioNetworkIntercepts__ = undefined
    })

    it('reads no file while an intercept may pause the request', () => {
        window.__wdioNetworkIntercepts__ = new Map([['intercept-1', [{ type: 'pattern' }]]])
        const stack = getStack()
        expect(requests).toEqual([])
        expect(stack).toContain('Error: fixture\n    at getStack (')
        expect(stack).toContain('stack.ts')
        expect(stack).not.toContain(MAPPED_FRAME)
    })

    it('maps the file once the intercept is removed', () => {
        window.__wdioNetworkIntercepts__ = new Map()
        const stack = getStack()
        expect(requests).toContainEqual(expect.stringContaining('stack.ts'))
        expect(stack).toContain(MAPPED_FRAME)
    })

    it('maps a file it mapped before without a request while an intercept is active', () => {
        window.__wdioNetworkIntercepts__ = new Map()
        expect(getStack()).toContain(MAPPED_FRAME)
        requests = []

        window.__wdioNetworkIntercepts__ = new Map([['intercept-1', [{ type: 'pattern' }]]])
        expect(getStack()).toContain(MAPPED_FRAME)
        expect(requests).toEqual([])
    })
})
