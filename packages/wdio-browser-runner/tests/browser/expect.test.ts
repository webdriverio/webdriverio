import { describe, it, expect } from 'vitest'
import { expect as browserExpect } from '../../src/browser/expect.js'

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
})
