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

    it('writes the user command and its result', () => {
        const xml = xmlOf([
            ['client:beforeUserCommand', { id: 1, command: 'url', body: ['/home'], protocol: 'bidi' }],
            ['client:afterUserCommand', { id: 1, command: 'url', body: ['/home'], protocol: 'bidi', result: { value: { title: 'Home' } } }]
        ])
        expect(xml).toContain('COMMAND: url - ["/home"]')
        expect(xml).toContain('RESULT: {"title":"Home"}')
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

    it('does not write a protocol command of a user command', () => {
        const xml = xmlOf([
            ['client:beforeUserCommand', { id: 1, command: 'url', body: ['/home'], protocol: 'bidi' }],
            ['client:beforeCommand', { method: 'POST', endpoint: '/session/:sessionId/url', body: { url: '/home' }, parent: 1 }],
            ['client:afterCommand', { method: 'POST', endpoint: '/session/:sessionId/url', body: { url: '/home' }, result: {}, parent: 1 }]
        ])
        expect(xml).toContain('COMMAND: url - ["/home"]')
        expect(xml).not.toContain('POST')
    })

    it('keeps the protocol commands of a run with no user command', () => {
        const xml = xmlOf([
            ['client:beforeCommand', { method: 'POST', endpoint: '/session/:sessionId/url', body: { url: '/home' } }]
        ])
        expect(xml).toContain('COMMAND: POST /session/s/url - {"url":"/home"}')
    })
})
