import { describe, it, expect, vi } from 'vitest'
import { browser, $, _setGlobal, expect as wdioExpect } from '../src/index.js'

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

    it('can set some on expect', () => {
        expect(() => (wdioExpect as any)('some')).toThrow()
        const myExpect =  { some: vi.fn().mockReturnValue('mock-result') }
        _setGlobal('expect', myExpect, true)
        expect(() => (wdioExpect as any).some()).not.toThrow()
    })

    it('can set some on expect', () => {
        expect(() => (wdioExpect as any)('some')).toThrow()
        const myExpect =  { closeTo: vi.fn().mockReturnValue('mock-result') }
        _setGlobal('expect', myExpect, true)
        expect(() => (wdioExpect as any).closeTo(10, 2)).not.toThrow()
    })

    it('can set multiRemote on expect', () => {
        const values = { browserA: 'foo', browserB: 'bar' }
        const myExpect = { multiRemote: vi.fn().mockReturnValue('mock-result') }
        _setGlobal('expect', myExpect, true)
        expect(wdioExpect.multiRemote(values)).toBe('mock-result')
        expect(myExpect.multiRemote).toHaveBeenCalledWith(values)
    })

})
