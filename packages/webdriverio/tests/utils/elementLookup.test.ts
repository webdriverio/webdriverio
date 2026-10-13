import vm from 'node:vm'
import { describe, it, expect } from 'vitest'

import {
    enterCommand, leaveCommand, markNotFound, isMarkedNotFound, markWaited, waitedFor,
    isStaleElementError, isStaleError
} from '../../src/utils/elementLookup.js'

describe('the not found mark of an element', () => {
    it('marks only the layers that are active when the wait fails', () => {
        const el = {}
        markNotFound(el)
        expect(isMarkedNotFound(el)).toBe(false)

        const outer = enterCommand(el)
        const inner = enterCommand(el)
        markNotFound(el)
        expect(isMarkedNotFound(el, outer)).toBe(true)
        expect(isMarkedNotFound(el, inner)).toBe(true)
        expect(isMarkedNotFound(el)).toBe(true)

        /**
         * a layer that starts after the mark, e.g. the next poll of `waitUntil`
         */
        leaveCommand(el, inner)
        const next = enterCommand(el)
        expect(isMarkedNotFound(el, next)).toBe(false)
        expect(isMarkedNotFound(el, outer)).toBe(true)
        leaveCommand(el, next)
    })

    it('forgets a layer when it ends', () => {
        const el = {}
        const outer = enterCommand(el)
        markNotFound(el)
        leaveCommand(el, outer)
        expect(isMarkedNotFound(el, outer)).toBe(false)
        expect(isMarkedNotFound(el)).toBe(false)

        const again = enterCommand(el)
        expect(isMarkedNotFound(el, again)).toBe(false)
        expect(isMarkedNotFound(el)).toBe(false)
        leaveCommand(el, again)
    })

    it('keeps the marks of different elements apart', () => {
        const a = {}
        const b = {}
        const layerA = enterCommand(a)
        const layerB = enterCommand(b)
        markNotFound(a)
        expect(isMarkedNotFound(a, layerA)).toBe(true)
        expect(isMarkedNotFound(b, layerB)).toBe(false)
        leaveCommand(a, layerA)
        leaveCommand(b, layerB)
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
