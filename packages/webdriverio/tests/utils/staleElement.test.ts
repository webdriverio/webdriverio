import vm from 'node:vm'
import { describe, it, expect } from 'vitest'

import { isStaleElementError, isStaleError, markNotFoundAgain, wasNotFoundAgain } from '../../src/utils/staleElement.js'

describe('isStaleError', () => {
    it('knows a stale element error by its name or its message', () => {
        expect(isStaleError(Object.assign(new Error('foo'), { name: 'stale element reference' }))).toBe(true)
        expect(isStaleError(new Error('stale element reference: element is not attached to the page document'))).toBe(true)
        expect(isStaleError(new Error('no such node - The node with the reference 123 is not known'))).toBe(true)
        expect(isStaleError(new Error('no such element'))).toBe(false)
    })

    it('knows a stale element error that is not an Error instance', () => {
        const otherRealm = vm.runInNewContext('new Error("stale element reference: element is not attached")')
        expect(otherRealm instanceof Error).toBe(false)
        expect(isStaleError(otherRealm)).toBe(true)
        expect(isStaleError({ name: 'stale element reference' })).toBe(true)
    })

    it('is false for a value that is not an error', () => {
        for (const value of [undefined, null, 'stale element reference', 42, { message: 42 }]) {
            expect(isStaleError(value)).toBe(false)
        }
    })

    it('is the message check of isStaleElementError, which is false for a value without a message', () => {
        expect(isStaleElementError(new Error('Element is no longer attached to the DOM'))).toBe(true)
        for (const value of [undefined, null, 'stale element reference', { message: 1 }]) {
            expect(isStaleElementError(value)).toBe(false)
        }
    })
})

describe('markNotFoundAgain', () => {
    it('marks an error', () => {
        const err = new Error('stale element reference')
        expect(wasNotFoundAgain(err)).toBe(false)
        markNotFoundAgain(err)
        expect(wasNotFoundAgain(err)).toBe(true)
    })

    it('uses a registered symbol, so another copy of webdriverio sees the mark', () => {
        const err = new Error('stale element reference')
        Object.assign(err, { [Symbol.for('wdio:notFoundAgain')]: true })
        expect(wasNotFoundAgain(err)).toBe(true)
    })

    it('leaves an error that can not get the mark as it is', () => {
        const err = Object.freeze(new Error('stale element reference'))
        expect(() => markNotFoundAgain(err)).not.toThrow()
        expect(wasNotFoundAgain(err)).toBe(false)
    })

    it('is false for a value that is not an object', () => {
        for (const value of [undefined, null, 'error']) {
            expect(() => markNotFoundAgain(value)).not.toThrow()
            expect(wasNotFoundAgain(value)).toBe(false)
        }
    })
})
