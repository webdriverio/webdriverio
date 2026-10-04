// @vitest-environment jsdom

import { vi, describe, it, expect } from 'vitest'
import { trackNetworkIntercepts, mayInterceptRequest, guardSourceMapLookups } from '../../src/browser/intercepts.js'

describe('trackNetworkIntercepts', () => {
    const PATTERNS = [{ type: 'pattern', pathname: '/api' }]
    const bidiError = (command: string, error: string) =>
        new Error(`WebDriver Bidi command "${command}" failed with error: ${error} - message`)
    const timeoutError = (command: string) =>
        new Error(`Command ${command} with id 7 timed out after 180000ms! Consider increasing the "bidiResponseTimeout" option.`)

    const track = (addIntercept = vi.fn(), removeIntercept = vi.fn()) => {
        const prototype: PropertyDescriptorMap = {
            networkAddIntercept: { value: addIntercept },
            networkRemoveIntercept: { value: removeIntercept }
        }
        trackNetworkIntercepts(prototype)
        return {
            add: (params: unknown) => prototype.networkAddIntercept.value(params),
            remove: (intercept: string) => prototype.networkRemoveIntercept.value({ intercept })
        }
    }

    it('tracks an intercept with its url patterns from the time it is requested', async () => {
        let resolveAdd: (value: { intercept: string }) => void = () => {}
        const addIntercept = vi.fn().mockReturnValueOnce(new Promise((resolve) => { resolveAdd = resolve }))
        const { add } = track(addIntercept)

        const params = { phases: ['beforeRequestSent'], urlPatterns: PATTERNS }
        const intercept = add(params)
        expect(addIntercept).toBeCalledWith(params)
        /**
         * the browser pauses requests before the id gets back to the page
         */
        expect([...window.__wdioNetworkIntercepts__!.values()]).toEqual([PATTERNS])

        resolveAdd({ intercept: 'intercept-1' })
        await expect(intercept).resolves.toEqual({ intercept: 'intercept-1' })
        expect([...window.__wdioNetworkIntercepts__!]).toEqual([['intercept-1', PATTERNS]])
    })

    it('forgets an intercept the browser refused to add', async () => {
        const { add } = track(vi.fn().mockRejectedValue(bidiError('network.addIntercept', 'invalid argument')))
        await expect(add({ phases: [] })).rejects.toThrow('invalid argument')
        expect(window.__wdioNetworkIntercepts__!.size).toBe(0)
    })

    it('keeps an intercept whose add command got no answer', async () => {
        const { add } = track(vi.fn().mockRejectedValue(timeoutError('network.addIntercept')))
        await expect(add({ phases: [], urlPatterns: PATTERNS })).rejects.toThrow('timed out')
        expect([...window.__wdioNetworkIntercepts__!.values()]).toEqual([PATTERNS])
    })

    it.each([
        ['the browser removed it', 0, () => Promise.resolve({})],
        ['the browser does not know it', 0, () => Promise.reject(bidiError('network.removeIntercept', 'no such intercept'))],
        ['the browser refused to remove it', 1, () => Promise.reject(bidiError('network.removeIntercept', 'invalid argument'))],
        ['the remove command got no answer', 1, () => Promise.reject(timeoutError('network.removeIntercept'))]
    ])('after a remove command where %s, tracks %i intercepts', async (_, size, removeResult) => {
        const { add, remove } = track(
            vi.fn().mockResolvedValue({ intercept: 'intercept-1' }),
            vi.fn().mockImplementation(removeResult)
        )
        await add({ phases: [] })
        await remove('intercept-1').catch(() => {})
        expect(window.__wdioNetworkIntercepts__!.size).toBe(size)
    })

    it('keeps the other intercepts when one is removed', async () => {
        const { add, remove } = track(
            vi.fn().mockResolvedValueOnce({ intercept: 'intercept-1' }).mockResolvedValueOnce({ intercept: 'intercept-2' }),
            vi.fn().mockResolvedValue({})
        )
        await add({ phases: [] })
        await add({ phases: [], urlPatterns: PATTERNS })
        await remove('intercept-1')
        expect([...window.__wdioNetworkIntercepts__!]).toEqual([['intercept-2', PATTERNS]])
    })

    it('leaves a prototype without network commands alone', () => {
        const prototype: PropertyDescriptorMap = {}
        trackNetworkIntercepts(prototype)
        expect(prototype).toEqual({})
        expect(window.__wdioNetworkIntercepts__!.size).toBe(0)
    })
})

describe('mayInterceptRequest', () => {
    /**
     * the page of the jsdom environment is http://localhost:3000/
     */
    const PAGE_FILE = 'http://localhost:3000/@fs/project/component.test.ts'

    it('is false when the page has no intercept', () => {
        window.__wdioNetworkIntercepts__ = undefined
        expect(mayInterceptRequest(PAGE_FILE)).toBe(false)
        window.__wdioNetworkIntercepts__ = new Map()
        expect(mayInterceptRequest(PAGE_FILE)).toBe(false)
        expect(mayInterceptRequest(undefined)).toBe(false)
    })

    it.each([
        ['no url patterns', true, undefined],
        ['an empty list of url patterns', true, []],
        ['a pattern without fields (`*/api/*`)', true, [{ type: 'pattern' }]],
        ['a pattern of the page origin', true, [{ type: 'pattern', protocol: 'http', hostname: 'localhost', port: '3000' }]],
        ['a pattern with a protocol that ends with a colon', true, [{ type: 'pattern', protocol: 'http:' }]],
        ['a hostname in upper case', true, [{ type: 'pattern', hostname: 'LOCALHOST' }]],
        ['a pattern of a path only', true, [{ type: 'pattern', pathname: '/api/users' }]],
        ['a pattern of another hostname', false, [{ type: 'pattern', hostname: 'api.example.com' }]],
        ['a pattern of another protocol', false, [{ type: 'pattern', protocol: 'https' }]],
        ['a pattern of another port', false, [{ type: 'pattern', hostname: 'localhost', port: '4000' }]],
        ['a pattern of the default http port', false, [{ type: 'pattern', protocol: 'http', port: '80' }]],
        ['a hostname the URL parser refuses', true, [{ type: 'pattern', hostname: '::1' }]],
        ['a string pattern of the page origin', true, [{ type: 'string', pattern: 'http://localhost:3000/api' }]],
        ['a string pattern of another origin', false, [{ type: 'string', pattern: 'https://api.example.com/users' }]],
        ['a string pattern that is not a URL', true, [{ type: 'string', pattern: 'not a url' }]],
        ['a list where one pattern matches', true, [{ type: 'pattern', hostname: 'api.example.com' }, { type: 'pattern', port: '3000' }]]
    ])('for a page file, with %s, is %s', (_, expected, urlPatterns) => {
        window.__wdioNetworkIntercepts__ = new Map([['intercept-1', urlPatterns as never]])
        expect(mayInterceptRequest(PAGE_FILE)).toBe(expected)
    })

    it('compares the patterns with the url of the request, not of the page', () => {
        window.__wdioNetworkIntercepts__ = new Map([['intercept-1', [{ type: 'pattern', hostname: 'cdn.example.com' }]]])
        expect(mayInterceptRequest('https://cdn.example.com/lib.js')).toBe(true)
        expect(mayInterceptRequest(PAGE_FILE)).toBe(false)
        /**
         * a relative file resolves against the page
         */
        expect(mayInterceptRequest('/@fs/project/component.test.ts')).toBe(false)
    })

    it('is true for a request without a valid url while an intercept is active', () => {
        window.__wdioNetworkIntercepts__ = new Map([['intercept-1', [{ type: 'pattern', hostname: 'api.example.com' }]]])
        expect(mayInterceptRequest(undefined)).toBe(true)
        expect(mayInterceptRequest('http://[')).toBe(true)
    })

    it('is true while one of several intercepts matches', () => {
        window.__wdioNetworkIntercepts__ = new Map<string | symbol, never>([
            ['intercept-1', [{ type: 'pattern', hostname: 'api.example.com' }] as never],
            [Symbol('pending intercept'), undefined as never]
        ])
        expect(mayInterceptRequest(PAGE_FILE)).toBe(true)
    })
})

describe('guardSourceMapLookups', () => {
    const PAGE_FILE = 'http://localhost:3000/@fs/project/component.test.ts'
    const callSite = (source?: string, native = false) => ({
        isNative: () => native,
        getFileName: () => source,
        getScriptNameOrSourceURL: () => undefined,
        toString: () => `fn (${source ?? '<anonymous>'}:1:1)`
    })
    /**
     * stands for source-map-support: it marks each frame it maps
     */
    const mapStackTrace = vi.fn((error: Error, frames: ReturnType<typeof callSite>[]) =>
        frames.map((frame) => frame.isNative() ? `${frame}` : `mapped ${frame}`))
    const interceptAll = () => {
        window.__wdioNetworkIntercepts__ = new Map([['intercept-1', undefined]])
    }

    it('maps every frame while the page has no intercept', () => {
        window.__wdioNetworkIntercepts__ = new Map()
        const prepareStackTrace = guardSourceMapLookups(mapStackTrace)
        expect(prepareStackTrace(new Error(), [callSite(PAGE_FILE), callSite(undefined)]))
            .toEqual([`mapped fn (${PAGE_FILE}:1:1)`, 'mapped fn (<anonymous>:1:1)'])
    })

    it('does not map a file it never mapped while an intercept may pause the request', () => {
        interceptAll()
        const prepareStackTrace = guardSourceMapLookups(mapStackTrace)
        expect(prepareStackTrace(new Error(), [callSite(PAGE_FILE), callSite(undefined)]))
            .toEqual([`fn (${PAGE_FILE}:1:1)`, 'fn (<anonymous>:1:1)'])
    })

    it('maps a file it mapped before, because source-map-support cached its map', () => {
        window.__wdioNetworkIntercepts__ = new Map()
        const prepareStackTrace = guardSourceMapLookups(mapStackTrace)
        prepareStackTrace(new Error(), [callSite(PAGE_FILE)])

        interceptAll()
        expect(prepareStackTrace(new Error(), [callSite(PAGE_FILE)])).toEqual([`mapped fn (${PAGE_FILE}:1:1)`])
    })

    it('maps a file again once the intercept is removed', () => {
        interceptAll()
        const prepareStackTrace = guardSourceMapLookups(mapStackTrace)
        expect(prepareStackTrace(new Error(), [callSite(PAGE_FILE)])).toEqual([`fn (${PAGE_FILE}:1:1)`])

        window.__wdioNetworkIntercepts__ = new Map()
        expect(prepareStackTrace(new Error(), [callSite(PAGE_FILE)])).toEqual([`mapped fn (${PAGE_FILE}:1:1)`])
    })

    it('maps a file while the intercepts cannot pause its request', () => {
        window.__wdioNetworkIntercepts__ = new Map([['intercept-1', [{ type: 'pattern', hostname: 'api.example.com' }]]])
        const prepareStackTrace = guardSourceMapLookups(mapStackTrace)
        expect(prepareStackTrace(new Error(), [callSite(PAGE_FILE)])).toEqual([`mapped fn (${PAGE_FILE}:1:1)`])
    })

    it('passes a native frame along', () => {
        interceptAll()
        const prepareStackTrace = guardSourceMapLookups(mapStackTrace)
        const frame = callSite(undefined, true)
        prepareStackTrace(new Error(), [frame])
        expect(mapStackTrace.mock.lastCall![1][0]).toBe(frame)
    })
})
