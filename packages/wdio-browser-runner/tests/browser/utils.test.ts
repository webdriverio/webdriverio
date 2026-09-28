// @vitest-environment jsdom

import { vi, describe, it, beforeAll, afterAll, expect } from 'vitest'
import { createBrowserEventEmitter, showPopupWarning, sanitizeConsoleArgs, toViteFsUrl } from '../../src/browser/utils.js'

describe('browser utils', () => {
    it.each(['network.responseCompleted', 'network.fetchError'])('leaves source-map requests to Node until %s', (terminalEvent) => {
        const emitter = createBrowserEventEmitter()
        const handler = vi.fn()
        const events = ['network.beforeRequestSent', 'network.responseStarted', terminalEvent]
        for (const event of events) {
            emitter.on(event, handler)
        }
        const request = { request: 'source-map', url: 'http://localhost:5173/spec.ts' }
        emitter.emit('network.beforeRequestSent', {
            request,
            initiator: { stackTrace: { callFrames: [{ url: 'http://localhost:5173/source-map-support/browser-source-map-support.js' }] } }
        })
        emitter.emit('network.responseStarted', { request })
        emitter.emit(terminalEvent, { request })
        expect(handler).not.toHaveBeenCalled()

        // Reusing a URL or a completed request ID must not hide the user's request.
        emitter.emit('network.beforeRequestSent', { request })
        emitter.emit('network.responseStarted', { request })
        expect(handler).toHaveBeenCalledTimes(2)
    })

    it.each(['result', 'network.custom'])('passes %s events through unchanged', (event) => {
        const emitter = createBrowserEventEmitter()
        const handler = vi.fn()
        emitter.on(event, handler)
        expect(emitter.emit(event, 'value', 42)).toBe(true)
        expect(handler).toHaveBeenCalledWith('value', 42)
    })

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
