import vm from 'node:vm'
import { describe, it, expect } from 'vitest'

import {
    markGaveUp, gaveUpFor, passOn, markWaited, waitedFor,
    isStaleElementError, isStaleError
} from '../../src/utils/elementLookup.js'

describe('the record of a lookup that gave up', () => {
    it('records the element whose lookup gave up on the error', () => {
        const el = {}
        const other = {}
        const err = new Error('stale element reference')
        expect(gaveUpFor(err, el)).toBe(false)

        markGaveUp(err, el)
        expect(gaveUpFor(err, el)).toBe(true)
        expect(gaveUpFor(err, other)).toBe(false)
        expect(gaveUpFor(new Error('stale element reference'), el)).toBe(false)
    })

    it('records a frozen error, not a value that is not an object', () => {
        const el = {}
        const frozen = Object.freeze(new Error('stale element reference'))
        markGaveUp(frozen, el)
        expect(gaveUpFor(frozen, el)).toBe(true)

        for (const value of ['stale element reference', undefined, null, 42]) {
            expect(() => markGaveUp(value, el)).not.toThrow()
            expect(gaveUpFor(value, el)).toBe(false)
        }
    })

    it('finds the record through the cause of an error that wraps it', () => {
        const el = {}
        const err = new Error('stale element reference')
        markGaveUp(err, el)
        const wrapped = new Error('click failed', { cause: err })
        expect(gaveUpFor(wrapped, el)).toBe(true)
        expect(gaveUpFor(new Error('outer', { cause: wrapped }), el)).toBe(true)
        expect(gaveUpFor(new Error('other', { cause: new Error('stale element reference') }), el)).toBe(false)
        expect(gaveUpFor(new Error('not an error cause', { cause: 'stale element reference' }), el)).toBe(false)

        const loop = new Error('a') as Error & { cause?: unknown }
        loop.cause = new Error('b', { cause: loop })
        expect(gaveUpFor(loop, el)).toBe(false)
    })

    it('finds the record of each element in the cause chain', () => {
        const child = {}
        const parent = {}
        const childErr = new Error('stale element reference')
        markGaveUp(childErr, child)
        const wrapper = new Error('stale element reference: in a command of the parent', { cause: childErr })
        markGaveUp(wrapper, parent)
        expect(gaveUpFor(wrapper, parent)).toBe(true)
        expect(gaveUpFor(wrapper, child)).toBe(true)
        expect(gaveUpFor(wrapper, {})).toBe(false)
    })

    it('passes the record on to an error that replaces it', () => {
        const el = {}
        const err = new Error('stale element reference')
        const wrapped = new Error('waitUntil condition failed with the following reason: stale element reference')
        passOn(err, wrapped)
        expect(gaveUpFor(wrapped, el)).toBe(false)

        markGaveUp(err, el)
        passOn(err, wrapped)
        expect(gaveUpFor(wrapped, el)).toBe(true)
        expect(() => passOn(err, 'not an object')).not.toThrow()
        expect(() => passOn(undefined, wrapped)).not.toThrow()
    })
})

describe('the flag of a lookup that waited', () => {
    it('flags an error with a hidden registered symbol', () => {
        const err = new Error('Can\'t call getText on element with selector "#a" because element wasn\'t found')
        expect(waitedFor(err)).toBe(false)
        markWaited(err)

        expect(waitedFor(err)).toBe(true)
        expect(Object.keys(err)).toEqual([])
        expect(Object.getOwnPropertySymbols(err).filter((symbol) => Object.getOwnPropertyDescriptor(err, symbol)!.enumerable)).toEqual([])
        expect((err as unknown as Record<symbol, unknown>)[Symbol.for('wdio:waitedFor')]).toBe(true)
    })

    it('leaves a frozen error or a non-object as it is', () => {
        for (const value of [Object.freeze(new Error('frozen')), 'x', undefined, null]) {
            expect(() => markWaited(value)).not.toThrow()
            expect(waitedFor(value)).toBe(false)
        }
    })
})

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
