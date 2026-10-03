import { describe, expect, it } from 'vitest'

import { resolveCustomCommandOptions } from '../src/customCommands.js'

describe('resolveCustomCommandOptions', () => {
    it('returns an empty object when options are omitted', () => {
        expect(resolveCustomCommandOptions('addCommand')).toEqual({})
        expect(resolveCustomCommandOptions('overwriteCommand', undefined)).toEqual({})
        expect(resolveCustomCommandOptions('addCommand', null)).toEqual({})
    })

    it('returns an options object unchanged', () => {
        const options = { attachToElement: true, disableElementImplicitWait: true }
        expect(resolveCustomCommandOptions('addCommand', options)).toBe(options)
    })

    it('rejects the removed boolean form', () => {
        expect(() => resolveCustomCommandOptions('addCommand', true)).toThrow(
            'Passing a boolean as the third argument to `addCommand` was removed in WebdriverIO v10. ' +
            'Use `addCommand(name, fn, { attachToElement: true })`.'
        )
        expect(() => resolveCustomCommandOptions('overwriteCommand', false)).toThrow(
            'Passing a boolean as the third argument to `overwriteCommand` was removed in WebdriverIO v10. ' +
            'Use `overwriteCommand(name, fn, { attachToElement: false })`.'
        )
    })

    it('accepts attachToBrowsingContext on its own', () => {
        const options = { attachToBrowsingContext: true }
        expect(resolveCustomCommandOptions('addCommand', options)).toBe(options)
        expect(resolveCustomCommandOptions('overwriteCommand', options)).toBe(options)
    })

    it('rejects attaching to elements and browsing contexts at once', () => {
        expect(() => resolveCustomCommandOptions('addCommand', { attachToElement: true, attachToBrowsingContext: true })).toThrow(
            '`addCommand` cannot attach a command to elements and browsing contexts at once.'
        )
        expect(() => resolveCustomCommandOptions('overwriteCommand', { attachToElement: true, attachToBrowsingContext: true })).toThrow(
            '`overwriteCommand` cannot attach a command to elements and browsing contexts at once.'
        )
    })

    it('rejects a non-object third argument', () => {
        expect(() => resolveCustomCommandOptions('addCommand', 'element')).toThrow(
            'The third argument to `addCommand` must be an options object.'
        )
    })
})
