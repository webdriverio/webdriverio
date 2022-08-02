import { describe, it, expect } from 'vitest'
import { browser, $, _setGlobal } from '../src/index.js'

describe('global handler', () => {
    it('should allow to import without issues', () => {
        expect(typeof browser).toBe('function')
    })

    it('should fail if you like to use the object', () => {
        expect(() => browser.$('foobar')).toThrow()
    })

    it('should allow to set and use the global', () => {
        _setGlobal('browser', { $: 'foobar' }, false)
        expect(browser.$).toBe('foobar')
    })

    it('can handle global functions', () => {
        expect(() => $('bar')).toThrow()
        _setGlobal('$', (param: string) => `foo${param}`, false)
        expect($('bar')).toBe('foobar')
    })

    it('can set a global var', () => {
        expect(() => $$('foo')).toThrow()
        _setGlobal('$$', (param: string) => `foo${param}`, true)
        expect(() => $$('foo')).not.toThrow()
    })
})
