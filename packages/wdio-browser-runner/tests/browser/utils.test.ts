// @vitest-environment jsdom

import { vi, describe, it, beforeAll, afterAll, expect } from 'vitest'
import { getWdioKind } from '@wdio/utils'
import { commandResult, showPopupWarning, sanitizeConsoleArgs, toViteFsUrl } from '../../src/browser/utils.js'

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

    it('commandResult sets again the kind of a mock or a browsing context', () => {
        const mock = commandResult({ id: 1, result: { url: '**/api' }, kind: 'mock' })
        const context = commandResult({ id: 2, result: { contextId: 'tab-1' }, kind: 'browsing-context' })

        expect(mock).toEqual({ url: '**/api' })
        expect([getWdioKind(mock), getWdioKind(context)]).toEqual(['mock', 'browsing-context'])
        expect(getWdioKind(commandResult({ id: 3, result: { url: '**/api' } }))).toBeUndefined()
        expect(commandResult({ id: 4, result: 'foo', kind: 'mock' })).toBe('foo')
        expect(commandResult({ id: 5, kind: 'mock' })).toBeUndefined()
    })

    it('toViteFsUrl', () => {
        expect(toViteFsUrl('/Users/dev/spec.tsx')).toBe('/@fs/Users/dev/spec.tsx')
        expect(toViteFsUrl('C:\\repo\\spec.tsx')).toBe('/@fs/C:/repo/spec.tsx')
        expect(toViteFsUrl('/@fs/Users/dev/spec.tsx')).toBe('/@fs/Users/dev/spec.tsx')
        expect(toViteFsUrl('http://localhost:3000/spec.js')).toBe('http://localhost:3000/spec.js')
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
