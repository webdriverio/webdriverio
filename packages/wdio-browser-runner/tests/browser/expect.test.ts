import { describe, it, expect } from 'vitest'
import { ElementArray } from '../../../webdriverio/src/element/array.js'
import { awaitPendingAssertionContext, expect as browserExpect, isArrayOfSelectorElements } from '../../src/browser/expect.js'

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
            return [{ selector: 'h1', elementId: 'a' } as unknown as WebdriverIO.Element]
        }, {
            selector: 'h1',
            foundWith: '$$',
            props: []
        })

        expect('selector' in elements).toBe(true)
        expect(typeof elements.then).toBe('function')

        const loaded = await awaitPendingAssertionContext(elements)
        expect(fetches).toBe(1)
        expect(loaded).toBe(elements)
        expect(elements).toHaveLength(1)
        expect(isArrayOfSelectorElements(elements)).toBe(true)
    })

    it('does not treat an async every result as an element array', () => {
        const list = Object.assign([{ selector: 'h1' }], {
            every: () => Promise.resolve(false)
        })
        expect(isArrayOfSelectorElements(list)).toBe(true)
        expect(isArrayOfSelectorElements([{ selector: 'h1' }, { elementId: 'bare' }])).toBe(false)
    })
})
