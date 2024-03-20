// @vitest-environment jsdom

import { vi, describe, it, beforeAll, afterAll, expect } from 'vitest'
import { showPopupWarning, sanitizeConsoleArgs } from '../../src/browser/utils.js'

describe('browser utils', () => {
    const consoleWarn = console.warn.bind(console)
    beforeAll(() => {
        console.warn = vi.fn()
        globalThis.alert = showPopupWarning('alert', undefined)
        globalThis.confirm = showPopupWarning('confirm', false, true)
        globalThis.prompt = showPopupWarning('prompt', null, 'your value')
    })

    it('showPopupWarning', () => {
        expect(alert('test')).toBeUndefined()
        expect(prompt('test')).toBeNull()
        expect(confirm('test')).toBe(false)
        expect(console.warn).toBeCalledTimes(3)
    })

    it('sanitizeConsoleArgs', () => {
        expect(sanitizeConsoleArgs([
            undefined,
            1,
            'foo',
            { foo: 'bar' },
            { selector: '.foobar' },
            {
                length: 42,
                selector: '.foobar'
            },
            {
                sessionId: 'foobar',
                capabilities: { browserName: 'chrome' }
            },
            new Error('foobar'),
            Promise.resolve('foobar'),
            () => {}
        ])).toEqual([
            'undefined',
            1,
            'foo',
            { foo: 'bar' },
            'WebdriverIO.Element<".foobar">',
            'WebdriverIO.ElementArray<42x ".foobar">',
            'WebdriverIO.Browser<chrome>',
            expect.stringContaining('Error: foobar'),
            '[object Promise]',
            '() => {\n      }'
        ])
    })

    afterAll(() => {
        console.warn = consoleWarn
    })
})
