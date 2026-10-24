import path from 'node:path'
import { EventEmitter } from 'node:events'

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { CommandEndpoint } from '@wdio/protocols'

import '../src/browser.js'
import { environment } from '../src/environment.js'
import commandWrapper from '../src/command.js'
import type { BaseClient } from '../src/types.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const getUrlEndpoint: CommandEndpoint = {
    command: 'getUrl',
    ref: 'https://w3c.github.io/webdriver/#get-current-url',
    description: '',
    parameters: []
}
const deleteSessionEndpoint: CommandEndpoint = {
    command: 'deleteSession',
    ref: 'https://w3c.github.io/webdriver/#delete-session',
    description: '',
    parameters: []
}

/**
 * fake request that resolves immediately, or hangs until it gets aborted
 */
class FakeRequest {
    constructor (
        _method: string,
        private _endpoint: string,
        _body: unknown,
        private _signal?: AbortSignal
    ) {}

    makeRequest () {
        if (!this._endpoint.endsWith('/hang')) {
            return Promise.resolve({ value: null })
        }
        return new Promise((_, reject) => {
            this._signal?.addEventListener('abort', () => reject(new Error('aborted')))
        })
    }
}

describe('session abort handling', () => {
    const originalRequest = environment.value.Request
    const originalKillDriverProcess = environment.value.killDriverProcess
    let sessionCounter = 0
    let scope: BaseClient
    const getUrl = commandWrapper('GET', '/session/:sessionId/url', getUrlEndpoint)
    const getHanging = commandWrapper('GET', '/session/:sessionId/hang', getUrlEndpoint)
    const deleteSession = commandWrapper('DELETE', '/session/:sessionId', deleteSessionEndpoint)

    beforeEach(() => {
        environment.value.Request = FakeRequest as never
        environment.value.killDriverProcess = vi.fn()
        scope = Object.assign(new EventEmitter(), {
            sessionId: `abort-session-${sessionCounter++}`,
            capabilities: {},
            options: {}
        }) as unknown as BaseClient
    })

    afterEach(() => {
        environment.value.Request = originalRequest
        environment.value.killDriverProcess = originalKillDriverProcess
    })

    it('aborts in-flight commands when the session is deleted after another command completed', async () => {
        await getUrl.call(scope)

        const inFlight = getHanging.call(scope)
        await deleteSession.call(scope)

        await expect(inFlight).rejects.toThrow('aborted')
    })

    it('rejects commands sent after the session has been deleted', async () => {
        await getUrl.call(scope)
        await getUrl.call(scope)
        await deleteSession.call(scope)

        await expect(getUrl.call(scope)).rejects.toThrow(/after session has been deleted/)
    })

    it('removes the session-wide listener once the session has been deleted', async () => {
        await getUrl.call(scope)
        expect(scope.listenerCount('result')).toBe(1)

        await deleteSession.call(scope)
        expect(scope.listenerCount('result')).toBe(0)
    })

    it('does not leak listeners while the session is running', async () => {
        await getUrl.call(scope)
        await getUrl.call(scope)
        await getUrl.call(scope)
        expect(scope.listenerCount('result')).toBe(1)
    })
})
