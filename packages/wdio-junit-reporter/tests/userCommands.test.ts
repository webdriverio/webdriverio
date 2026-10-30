import vm from 'node:vm'
import { afterEach, describe, expect, it, vi } from 'vitest'

import WDIOJunitReporter from '../src/index.js'

const FILE = '/project/spec.js'
const runner = { specs: [FILE], config: { framework: 'mocha' }, sanitizedCapabilities: 'chrome', capabilities: {} }
const suite = { uid: 's1', title: 's1', fullTitle: 's1', type: 'suite', cid: '0-0', file: FILE }
const test = { uid: 't1', title: 't1', fullTitle: 't1', type: 'test', cid: '0-0' }
const base = { sessionId: 's', cid: '0-0' }

const xmlOf = (events: [string, Record<string, unknown>][]) => {
    const reporter = new WDIOJunitReporter({ stdout: true, writeStream: { write: vi.fn() } } as never)
    reporter.emit('suite:start', suite)
    reporter.emit('test:start', test)
    events.forEach(([name, payload]) => reporter.emit(name, { ...base, ...payload }))
    reporter.emit('test:pass', test)
    reporter.emit('test:end', test)
    reporter.emit('suite:end', suite)
    return reporter['_buildJunitXml'](runner as never).toString() as string
}

describe('JUnit user commands', () => {
    afterEach(() => {
        process.removeAllListeners('junit:addProperty')
    })

    it('writes the user command on one line, with its arguments and its result', () => {
        const xml = xmlOf([
            ['client:beforeUserCommand', { id: 1, command: 'getText', body: [], protocol: 'bidi' }],
            ['client:afterUserCommand', { id: 1, command: 'getText', body: [], protocol: 'bidi', result: { value: 'clicked' } }]
        ])
        expect(xml).toContain('COMMAND: getText() → "clicked"')
        expect(xml).not.toContain('RESULT')
    })

    it('writes no result for a user command with no value or a value with no data', () => {
        const xml = xmlOf([
            ['client:beforeUserCommand', { id: 1, command: 'click', body: [], protocol: 'bidi' }],
            ['client:afterUserCommand', { id: 1, command: 'click', body: [], protocol: 'bidi', result: { value: undefined } }],
            ['client:beforeUserCommand', { id: 2, command: 'url', body: ['/home'], protocol: 'bidi' }],
            ['client:afterUserCommand', { id: 2, command: 'url', body: ['/home'], protocol: 'bidi', result: { value: 'WebdriverIO.BrowsingContext' } }]
        ])
        expect(xml).toContain('COMMAND: click()\nCOMMAND: url("/home")\n')
        expect(xml).not.toContain('RESULT')
    })

    it('writes the whole result under a user command whose line cuts it', () => {
        const html = `<span>${'x'.repeat(80)}</span>`
        const xml = xmlOf([
            ['client:beforeUserCommand', { id: 1, command: 'getHTML', body: [], protocol: 'bidi' }],
            ['client:afterUserCommand', { id: 1, command: 'getHTML', body: [], protocol: 'bidi', result: { value: html } }]
        ])
        expect(xml).toMatch(/COMMAND: getHTML\(\) → "<span>x+…\nRESULT: "<span>x{80}<\/span>"/)
    })

    it('writes the error of a user command', () => {
        const xml = xmlOf([
            ['client:beforeUserCommand', { id: 1, command: 'click', body: [], protocol: 'bidi' }],
            ['client:afterUserCommand', { id: 1, command: 'click', body: [], protocol: 'bidi', result: { error: new Error('boom') } }]
        ])
        expect(xml).toContain('RESULT: {"error":{"name":"Error","message":"boom"}}')
    })

    it('writes the message of an error from another realm', () => {
        const xml = xmlOf([
            ['client:beforeUserCommand', { id: 1, command: 'click', body: [], protocol: 'bidi' }],
            ['client:afterUserCommand', { id: 1, command: 'click', body: [], protocol: 'bidi', result: { error: vm.runInNewContext('new TypeError("boom")') } }]
        ])
        expect(xml).toContain('RESULT: {"error":{"name":"TypeError","message":"boom"}}')
    })

    it('writes the protocol commands of a user command under it, with their result and compact request', () => {
        const xml = xmlOf([
            ['client:beforeUserCommand', { id: 1, command: 'getText', body: [], protocol: 'bidi' }],
            ['client:beforeCommand', { command: 'getElementText', method: 'GET', endpoint: '/session/:sessionId/element/f.1.d.2.e.3/text', body: {}, parent: 1 }],
            ['client:afterCommand', { command: 'getElementText', method: 'GET', endpoint: '/session/:sessionId/element/f.1.d.2.e.3/text', body: {}, result: { value: 'clicked' }, parent: 1 }],
            ['client:beforeCommand', { command: 'getWindowHandle', method: 'GET', endpoint: '/session/:sessionId/window', body: {}, parent: 1 }],
            ['client:afterCommand', { command: 'getWindowHandle', method: 'GET', endpoint: '/session/:sessionId/window', body: {}, result: { value: '4F2B' }, parent: 1 }],
            ['client:afterUserCommand', { id: 1, command: 'getText', body: [], protocol: 'bidi', result: { value: 'clicked' } }]
        ])
        expect(xml).toContain([
            'COMMAND: getText() → "clicked"',
            '  COMMAND: getElementText → "clicked"  GET /element/:elementId/text',
            // no window handle in the line
            '  COMMAND: getWindowHandle  GET /window'
        ].join('\n'))
        expect(xml).not.toContain('f.1.d.2.e.3')
    })

    it('writes the error of a protocol command of a user command under it', () => {
        const xml = xmlOf([
            ['client:beforeUserCommand', { id: 1, command: 'click', body: [], protocol: 'bidi' }],
            ['client:beforeCommand', { command: 'elementClick', method: 'POST', endpoint: '/session/:sessionId/element/e.3/click', body: {}, parent: 1 }],
            ['client:afterCommand', { command: 'elementClick', method: 'POST', endpoint: '/session/:sessionId/element/e.3/click', body: {}, result: { error: 'stale element' }, parent: 1 }],
            ['client:afterUserCommand', { id: 1, command: 'click', body: [], protocol: 'bidi', result: { error: new Error('stale element') } }]
        ])
        expect(xml).toContain('COMMAND: click()\n  COMMAND: elementClick  POST /element/:elementId/click\n  RESULT: {"error":"stale element"}\nRESULT: {"error":{"name":"Error","message":"stale element"}}')
    })

    it('keeps the protocol commands of a run with no user command', () => {
        const xml = xmlOf([
            ['client:beforeCommand', { method: 'POST', endpoint: '/session/:sessionId/url', body: { url: '/home' } }]
        ])
        expect(xml).toContain('COMMAND: POST /session/s/url - {"url":"/home"}')
    })

    it('writes the XML when a custom command inside a user command returns a circular object', () => {
        const circular: Record<string, unknown> = { name: 'page' }
        circular.self = circular
        const xml = xmlOf([
            ['client:beforeUserCommand', { id: 1, command: 'login', body: ['john'], protocol: 'bidi' }],
            // the old events of an inner custom command keep their raw result
            ['client:beforeCommand', { command: 'openPage', body: [], parent: 1 }],
            ['client:afterCommand', { command: 'openPage', body: [], result: { value: circular }, parent: 1 }],
            ['client:afterUserCommand', { id: 1, command: 'login', body: ['john'], protocol: 'bidi', result: { value: true } }]
        ])
        expect(xml).toContain('COMMAND: login("john") → true')
        expect(xml).toContain('  COMMAND: openPage → {"name":"page","self":"[Circular]"}')
    })
})
