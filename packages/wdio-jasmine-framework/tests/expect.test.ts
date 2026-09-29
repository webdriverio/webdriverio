import { describe, expect, it, vi } from 'vitest'

import { createHybridExpect } from '../src/expect.js'

/**
 * Fake Jasmine expectations: sync matchers return `undefined`, async
 * matchers return a promise, and each call records which side ran.
 */
function fakeEnv (calls: string[]) {
    const expectation = (side: 'sync' | 'async', matchers: string[], prefix = ''): Record<string, unknown> => {
        const target: Record<string, unknown> = {}
        for (const name of matchers) {
            target[name] = function (this: unknown, ...args: unknown[]) {
                calls.push(`${side}:${prefix}${name}(${args.join(',')})`)
                return side === 'async' ? Promise.resolve() : undefined
            }
        }
        Object.defineProperty(target, 'not', { get: () => expectation(side, matchers, `${prefix}not.`) })
        target.withContext = (message: string) => expectation(side, matchers, `${prefix}ctx[${message}].`)
        return target
    }
    return {
        expect: vi.fn(() => expectation('sync', ['toBe', 'toHaveBeenCalled', 'toHaveSize'])),
        expectAsync: vi.fn(() => expectation('async', ['toBeResolved', 'toHaveTitle', 'toHaveSize']))
    }
}

describe('createHybridExpect', () => {
    const wdioMatchers = new Set(['toHaveTitle', 'toHaveSize'])

    it('runs Jasmine sync matchers synchronously', () => {
        const calls: string[] = []
        const hybridExpect = createHybridExpect(fakeEnv(calls), wdioMatchers) as (actual: unknown) => any

        expect(hybridExpect(1).toBe(1)).toBeUndefined()
        expect(calls).toEqual(['sync:toBe(1)'])
    })

    it('runs WDIO and Jasmine async matchers on expectAsync', async () => {
        const calls: string[] = []
        const hybridExpect = createHybridExpect(fakeEnv(calls), wdioMatchers) as (actual: unknown) => any

        await expect(hybridExpect({ sessionId: '1' }).toHaveTitle('foo')).resolves.toBeUndefined()
        await expect(hybridExpect(Promise.resolve()).toBeResolved()).resolves.toBeUndefined()
        expect(calls).toEqual(['async:toHaveTitle(foo)', 'async:toBeResolved()'])
    })

    it('uses the WDIO matcher for WebdriverIO objects when names collide', async () => {
        const calls: string[] = []
        const hybridExpect = createHybridExpect(fakeEnv(calls), wdioMatchers) as (actual: unknown) => any

        expect(hybridExpect([1, 2]).toHaveSize(2)).toBeUndefined()
        await hybridExpect({ parent: {}, selector: 'div', getElement () {} }).toHaveSize('elem')
        await hybridExpect(Promise.resolve({ selector: 'div' })).toHaveSize('chain')
        expect(calls).toEqual(['sync:toHaveSize(2)', 'async:toHaveSize(elem)', 'async:toHaveSize(chain)'])
    })

    it('identifies WebdriverIO values by the shape that expect-webdriverio uses', async () => {
        const element = { parent: {}, selector: 'div', getElement () {} }
        const wdioValues: Record<string, unknown> = {
            'element': element,
            'element without selector': { parent: {}, getElement () {} },
            'empty element array': Object.assign([], { parent: {}, selector: 'li', foundWith: '$$' }),
            'Element[]': [element],
            'multiremote element': { isMultiRemote: true, selector: 'div' },
            'multiremote element array': Object.assign([], { isMultiRemote: true, parent: {}, selector: 'li', foundWith: '$$' }),
            'browser': new (class Browser { getTitle () {} })(),
            'multiremote browser': new (class MultiRemoteDriver { getTitle () {} })()
        }
        for (const [name, value] of Object.entries(wdioValues)) {
            const calls: string[] = []
            const hybridExpect = createHybridExpect(fakeEnv(calls), wdioMatchers) as (actual: unknown) => any
            await hybridExpect(value).toHaveSize(name)
            expect(calls).toEqual([`async:toHaveSize(${name})`])
        }
    })

    it('uses the Jasmine matcher for values that only look like WebdriverIO values', () => {
        const jasmineValues: Record<string, unknown> = {
            'object with selector': { selector: '#item', length: 2 },
            'object with sessionId': { sessionId: '1', size: 1 },
            'object with parent': { parent: {}, length: 2 },
            'empty array': [],
            'application class named Browser': new (class Browser { length = 1 })()
        }
        for (const [name, value] of Object.entries(jasmineValues)) {
            const calls: string[] = []
            const hybridExpect = createHybridExpect(fakeEnv(calls), wdioMatchers) as (actual: unknown) => any
            expect(hybridExpect(value).toHaveSize(name)).toBeUndefined()
            expect(calls).toEqual([`sync:toHaveSize(${name})`])
        }
    })

    it('uses the WDIO matcher for the some() wrapper when names collide', async () => {
        const calls: string[] = []
        const hybridExpect = createHybridExpect(fakeEnv(calls), wdioMatchers) as (actual: unknown) => any

        await hybridExpect({ elements: [], [Symbol.for('expect-webdriverio.some')]: true }).toHaveSize('some')
        expect(calls).toEqual(['async:toHaveSize(some)'])
    })

    it('keeps the routing through not and withContext', async () => {
        const calls: string[] = []
        const hybridExpect = createHybridExpect(fakeEnv(calls), wdioMatchers) as (actual: unknown) => any

        hybridExpect(1).not.toBe(2)
        hybridExpect(1).withContext('a').not.toBe(2)
        await hybridExpect({ sessionId: '1' }).not.withContext('b').toHaveTitle('foo')
        expect(calls).toEqual([
            'sync:not.toBe(2)',
            'sync:ctx[a].not.toBe(2)',
            'async:not.ctx[b].toHaveTitle(foo)'
        ])
    })

    it('does not create an expectation for symbol properties', () => {
        const env = fakeEnv([])
        const hybridExpect = createHybridExpect(env, wdioMatchers) as (actual: unknown) => any

        expect(hybridExpect(1)[Symbol.iterator]).toBeUndefined()
        expect(env.expect).not.toHaveBeenCalled()
        expect(env.expectAsync).not.toHaveBeenCalled()
    })
})
