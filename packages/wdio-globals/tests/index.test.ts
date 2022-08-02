import { describe, it, expect } from 'vitest'
import { browser, _setGlobal } from '../src/index.js'

describe('global handler', () => {
    it('should allow to import without issues', () => {
        expect(typeof browser).toBe('function')
    })

    it('should fail if you like to use the object', () => {
        expect(() => browser.$('foobar')).toThrow()
    })

    it('should allow to set and use the global', () => {
        _setGlobal('browser', { $: 'foobar' })
        expect(browser.$).toBe('foobar')
    })
})
