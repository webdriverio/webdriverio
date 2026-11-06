import vm from 'node:vm'
import { afterEach, describe, expect, it, vi } from 'vitest'

import SumoLogicReporter from '../src/index.js'

vi.useFakeTimers()

const test = { uid: 't1', title: 't1', fullTitle: 't1', type: 'test', cid: '0-0', parent: 's1' }
const base = { sessionId: 's', cid: '0-0' }

const payloadOf = (events: [string, Record<string, unknown>][]) => {
    const reporter = new SumoLogicReporter({ sourceAddress: 'http://localhost:1234', stdout: true, writeStream: { write: vi.fn() } } as never)
    reporter.emit('suite:start', { uid: 's1', title: 's1', fullTitle: 's1', type: 'suite', cid: '0-0' })
    reporter.emit('test:start', test)
    events.forEach(([name, payload]) => reporter.emit(name, { ...base, ...payload }))
    reporter.emit('test:pass', test)
    const sent = reporter['_unsynced'].map((line) => JSON.parse(line)).find((line) => line.event === 'test:pass')
    clearInterval(reporter['_interval'])
    return sent.data as { output: Record<string, unknown>[] }
}

describe('Sumo Logic user commands', () => {
    afterEach(() => {
        vi.clearAllTimers()
    })

    it('sends the user command, its protocol commands with their parent, and the one-line text of each', () => {
        const data = payloadOf([
            ['client:beforeUserCommand', { id: 1, command: 'url', body: ['/home'], protocol: 'bidi' }],
            ['client:beforeCommand', { command: 'navigateTo', method: 'POST', endpoint: '/session/:sessionId/url', body: { url: '/home' }, parent: 1 }],
            ['client:afterCommand', { command: 'navigateTo', method: 'POST', endpoint: '/session/:sessionId/url', body: { url: '/home' }, result: { value: null }, parent: 1 }],
            ['client:afterUserCommand', { id: 1, command: 'url', body: ['/home'], protocol: 'bidi', result: { value: 'WebdriverIO.BrowsingContext' } }]
        ])
        expect(data.output.map((entry) => [entry.type, entry.parent, entry.text])).toEqual([
            ['userCommand', undefined, 'url("/home")'],
            ['command', 1, 'navigateTo  POST /url'],
            ['result', 1, undefined],
            ['userResult', undefined, undefined]
        ])
        expect(data.output[0]).toMatchObject({ command: 'url', body: ['/home'] })
    })

    it('sends the message of an Error from a user command', () => {
        const data = payloadOf([
            ['client:beforeUserCommand', { id: 1, command: 'click', body: [], protocol: 'bidi' }],
            ['client:afterUserCommand', { id: 1, command: 'click', body: [], protocol: 'bidi', result: { error: new Error('boom') } }]
        ])
        expect(data.output[1].result).toEqual({ error: { name: 'Error', message: 'boom' } })
    })

    it('sends the message of an error from another realm', () => {
        const data = payloadOf([
            ['client:beforeUserCommand', { id: 1, command: 'click', body: [], protocol: 'bidi' }],
            ['client:afterUserCommand', { id: 1, command: 'click', body: [], protocol: 'bidi', result: { error: vm.runInNewContext('new TypeError("boom")') } }]
        ])
        expect(data.output[1].result).toEqual({ error: { name: 'TypeError', message: 'boom' } })
    })

    it('sends the protocol commands of a run with no user command', () => {
        const data = payloadOf([
            ['client:beforeCommand', { method: 'POST', endpoint: '/session/:sessionId/url', body: { url: '/home' } }]
        ])
        expect(data.output.map((entry) => [entry.type, entry.text])).toEqual([['command', undefined]])
    })

    it('sends the test when a custom command inside a user command returns a circular object', () => {
        const circular: Record<string, unknown> = { name: 'page' }
        circular.self = circular
        const data = payloadOf([
            ['client:beforeUserCommand', { id: 1, command: 'login', body: ['john'], protocol: 'bidi' }],
            // the old events of an inner custom command keep their raw result
            ['client:beforeCommand', { command: 'openPage', body: [], parent: 1 }],
            ['client:afterCommand', { command: 'openPage', body: [], result: { value: circular }, parent: 1 }],
            ['client:afterUserCommand', { id: 1, command: 'login', body: ['john'], protocol: 'bidi', result: { value: true } }]
        ])
        expect(data.output.map((entry) => entry.text)).toEqual(['login("john") → true', 'openPage → {"name":"page","self":"[Circular]"}', undefined, undefined])
    })
})
