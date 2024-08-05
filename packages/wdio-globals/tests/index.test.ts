import { describe, it, expect } from 'vitest'
import { browser, $, _setGlobal, _runInGlobalStorage } from '../src/index.js'

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

    it('can set different global vars to be used by different functions', async () => {
        let resolver:(value: any) => void
        const stopper = new Promise(res => resolver = res)

        const first = _runInGlobalStorage(new Map(), async () => {
            _setGlobal('$$', (param: string) => `foo${param}`, false)
            expect($$('bar')).toBe('foobar')
            await stopper
            expect($$('foo')).toBe('foofoo')
        })
        const seccond = _runInGlobalStorage(new Map(), async () => {
            _setGlobal('$$', (param: string) => `bar${param}`, false)
            expect($$('foo')).toBe('barfoo')
            resolver({})
        })
        await first
        await seccond
    })
})
