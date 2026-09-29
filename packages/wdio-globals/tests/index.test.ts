import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { $, browser, _setGlobal, expect as wdioExpect } from '../src/index.js'

const REGISTRATION_ERROR = /No browser instance registered/

function readGlobal (key: string): unknown {
    return (globalThis as Record<string, unknown>)[key]
}

const exportedExpect = wdioExpect as unknown as {
    (actual: unknown): unknown
    some (...args: unknown[]): unknown
    closeTo (...args: unknown[]): unknown
}

describe('global handler', () => {
    beforeEach(() => {
        _wdioGlobals.clear()
    })

    afterEach(() => {
        delete (globalThis as Record<string, unknown>).$$
    })

    it('throws the registration error before a browser is installed', () => {
        expect(() => browser.$).toThrow(REGISTRATION_ERROR)
    })

    it('reads installed browser fields, binds methods, and skips the global when asked', () => {
        const session = {
            $: 'foobar',
            tag () {
                return this
            }
        }

        _setGlobal('browser', session, false)

        expect(browser.$).toBe('foobar')
        expect((browser as unknown as { tag (): typeof session }).tag()).toBe(session)
        expect(readGlobal('browser')).toBeUndefined()
    })

    it('forwards $ to the installed function', () => {
        expect(() => $('bar')).toThrow(REGISTRATION_ERROR)

        _setGlobal('$', (param: string) => `foo${param}`, false)

        expect($('bar')).toBe('foobar')
    })

    it('installs the bare $$ global when setGlobal is true', () => {
        const fetchElements = (param: string) => `foo${param}`
        expect(readGlobal('$$')).toBeUndefined()

        _setGlobal('$$', fetchElements, true)

        expect(readGlobal('$$')).toBe(fetchElements)
        expect(($$ as unknown as typeof fetchElements)('bar')).toBe('foobar')
    })

    it('forwards expect calls, some, and closeTo to the installed expect', () => {
        expect(() => exportedExpect('value')).toThrow(REGISTRATION_ERROR)
        expect(() => exportedExpect.some('item')).toThrow(REGISTRATION_ERROR)
        expect(() => exportedExpect.closeTo(10, 2)).toThrow(REGISTRATION_ERROR)

        const some = vi.fn().mockReturnValue('some-result')
        const closeTo = vi.fn().mockReturnValue('close-result')
        const installed = Object.assign(vi.fn().mockReturnValue('called'), { some, closeTo })
        const previousExpect = readGlobal('expect')

        _setGlobal('expect', installed, false)

        expect(exportedExpect('value')).toBe('called')
        expect(installed).toHaveBeenCalledWith('value')
        expect(exportedExpect.some('item')).toBe('some-result')
        expect(some).toHaveBeenCalledWith('item')
        expect(exportedExpect.closeTo(10, 2)).toBe('close-result')
        expect(closeTo).toHaveBeenCalledWith(10, 2)
        expect(readGlobal('expect')).toBe(previousExpect)
    })
})
