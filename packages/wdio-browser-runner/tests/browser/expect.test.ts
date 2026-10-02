import path from 'node:path'
import { describe, it, expect, vi } from 'vitest'
import { getLoadedWdioKind, isArrayOfElements, setWdioKind } from '@wdio/utils'
import { remote } from 'webdriverio'
import { ElementArray } from '../../../webdriverio/src/element/array.js'
import { expect as browserExpect, contextNameOf, shouldLoadAssertionContext } from '../../src/browser/expect.js'
import { commandResult } from '../../src/browser/utils.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const element = (selector: string) => setWdioKind({ selector, elementId: selector }, 'element') as unknown as WebdriverIO.Element

describe('expect', () => {
    describe('expectWithHelpers', () => {
        describe('oneOf', () => {
            it('returns an AsymmetricMatcher with matcherName "OneOf"', () => {
                const matcher = browserExpect.oneOf('foo', 'bar')
                expect(matcher.matcherName).toBe('OneOf')
            })

            it('stores all provided samples as an array', () => {
                const matcher = browserExpect.oneOf('a', 'b', 'c')
                expect(matcher.sample).toEqual(['a', 'b', 'c'])
            })

            it('toString() returns "OneOf"', () => {
                expect(browserExpect.oneOf('x').toString()).toBe('OneOf')
            })
        })

        describe('some', () => {
            it('returns an AsymmetricMatcher with matcherName "Some"', () => {
                const fakeElements = [{ selector: '.foo' }] as any
                const matcher = browserExpect.some(fakeElements)
                expect(matcher.matcherName).toBe('Some')
            })

            it('stores the provided element collection as sample', () => {
                const fakeElements = [{ selector: '.foo' }, { selector: '.bar' }] as any
                const matcher = browserExpect.some(fakeElements)
                expect(matcher.sample).toBe(fakeElements)
            })

            it('toString() returns "Some"', () => {
                const matcher = browserExpect.some([] as any)
                expect(matcher.toString()).toBe('Some')
            })
        })
    })

    it('loads a pending element list before the assertion is sent', async () => {
        let fetches = 0
        const elements = ElementArray.fromAsyncCallback(async () => {
            fetches++
            return [element('h1')]
        }, {
            selector: 'h1',
            foundWith: '$$',
            props: []
        })

        expect('selector' in elements).toBe(true)
        expect(typeof elements.then).toBe('function')
        expect(shouldLoadAssertionContext(elements)).toBe(true)
        expect(shouldLoadAssertionContext({ foo: 'bar' })).toBe(false)

        const loaded = await elements
        expect(fetches).toBe(1)
        expect(loaded).toBe(elements)
        expect(elements).toHaveLength(1)
        expect(shouldLoadAssertionContext(elements)).toBe(false)
        expect(isArrayOfElements(elements)).toBe(true)
    })

    it('does not treat an async every result as an element array', () => {
        const list = Object.assign([element('h1')], {
            every: () => Promise.resolve(false)
        })
        expect(isArrayOfElements(list)).toBe(true)
        expect(isArrayOfElements([element('h1'), { elementId: 'bare' }])).toBe(false)
    })

    /**
     * The page sends a loaded element or element list as `element`, and the runner
     * fetches it again. A chainable is sent as `context`, and the browser is not sent.
     */
    describe('getLoadedWdioKind and isArrayOfElements read the wdio.kind brand', () => {
        it('gives the kind of loaded WebdriverIO objects', async () => {
            const browser = await remote({ capabilities: { browserName: 'foobar' }, strictSelectors: false })
            const elem = await browser.$('#foo')
            const elems = await browser.$$('#foo')

            expect(getLoadedWdioKind(browser)).toBe('browser')
            expect(getLoadedWdioKind(elem)).toBe('element')
            expect(getLoadedWdioKind(elems)).toBe('element-array')
            expect(isArrayOfElements(elems)).toBe(true)
            expect(isArrayOfElements([...elems])).toBe(true)
            expect(isArrayOfElements(await elems.filter(() => true))).toBe(true)
        })

        it('gives no kind to a value that is still a promise', async () => {
            const browser = await remote({ capabilities: { browserName: 'foobar' }, strictSelectors: false })

            expect(getLoadedWdioKind(browser.$('#foo'))).toBeUndefined()
            expect(getLoadedWdioKind(browser.$('#foo').$('#bar'))).toBeUndefined()
            expect(getLoadedWdioKind(browser.$$('#foo'))).toBeUndefined()
            expect(isArrayOfElements([browser.$('#foo')])).toBe(false)
        })

        it('does not take a plain object with a selector for an element', () => {
            expect(getLoadedWdioKind({ selector: 'h1', elementId: 'a' })).toBeUndefined()
            expect(getLoadedWdioKind({ sessionId: 'a' })).toBeUndefined()
            expect(isArrayOfElements([{ selector: 'h1' }])).toBe(false)
            expect(getLoadedWdioKind(null)).toBeUndefined()
            expect(getLoadedWdioKind('h1')).toBeUndefined()
        })

        it('does not take an empty array for an array of elements', () => {
            expect(isArrayOfElements([])).toBe(false)
        })
    })

    describe('contextNameOf', () => {
        it('names each assertion subject in the timeout message', async () => {
            const browser = await remote({ capabilities: { browserName: 'foobar' }, strictSelectors: false })
            const elems = await browser.$$('#foo')

            expect(contextNameOf(browser)).toBe('WebdriverIO.Browser')
            expect(contextNameOf(await browser.$('#foo'))).toBe('WebdriverIO.Element')
            expect(contextNameOf(elems)).toBe('WebdriverIO.ElementArray')
            expect(contextNameOf([...elems])).toBe('WebdriverIO.Element[]')
            expect(contextNameOf('foo')).toBe('foo')
        })

        it('names a mock and a browsing context that come from the worker as JSON', () => {
            const mock = commandResult({ id: 1, result: { url: '**/api' }, kind: 'mock' })
            const context = commandResult({ id: 2, result: { contextId: 'tab-1' }, kind: 'browsing-context' })

            expect(contextNameOf(mock)).toBe('WebdriverIO.Mock')
            expect(contextNameOf(context)).toBe('WebdriverIO.BrowsingContext')
            expect(contextNameOf(commandResult({ id: 3, result: { url: '**/api' } }))).toBe('WebdriverIO.Browser')
        })
    })
})
