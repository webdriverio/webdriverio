import path from 'node:path'
import { EventEmitter } from 'node:events'

import { describe, it, expect, vi, beforeEach } from 'vitest'

import '../src/browser.js'
import { runClassicProtocolCommand } from '../src/classicProtocolCommand.js'
import type { BaseClient } from '../src/types.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('fetch')

/**
 * A session that could speak BiDi (`webSocketUrl` is set) but is not connected.
 * The helper must still post the classic endpoint, and must not call an
 * overwritten instance method.
 */
class FakeClient extends EventEmitter {
    isSeleniumStandalone = false
    isBidi = false
    sessionId = 'foobar-123'
    capabilities = { webSocketUrl: 'ws://webdriver.io' }
    options = {
        protocol: 'http',
        hostname: 'localhost',
        port: 4444,
        path: '/'
    }

    back = vi.fn(async () => {
        throw new Error('instance back should not run')
    })

    forward = vi.fn(async () => {
        throw new Error('instance forward should not run')
    })
}

describe('runClassicProtocolCommand', () => {
    let client: FakeClient

    beforeEach(() => {
        client = new FakeClient()
        vi.mocked(fetch).mockClear()
    })

    it('posts the classic back endpoint when isBidi is false', async () => {
        expect(client.isBidi).toBe(false)

        await runClassicProtocolCommand.call(client as unknown as BaseClient, 'back')

        expect(client.back).not.toHaveBeenCalled()
        expect(fetch).toHaveBeenCalledTimes(1)
        expect(fetch).toHaveBeenCalledWith(
            expect.objectContaining({ pathname: '/session/foobar-123/back' }),
            expect.objectContaining({ method: 'POST' })
        )
    })

    it('posts the classic forward endpoint when isBidi is false', async () => {
        expect(client.isBidi).toBe(false)

        await runClassicProtocolCommand.call(client as unknown as BaseClient, 'forward')

        expect(client.forward).not.toHaveBeenCalled()
        expect(fetch).toHaveBeenCalledTimes(1)
        expect(fetch).toHaveBeenCalledWith(
            expect.objectContaining({ pathname: '/session/foobar-123/forward' }),
            expect.objectContaining({ method: 'POST' })
        )
    })

    it('rejects an unknown classic command name', async () => {
        await expect(
            runClassicProtocolCommand.call(client as unknown as BaseClient, 'refresh' as 'back')
        ).rejects.toThrow(/Unknown classic protocol command "refresh"/)
        expect(fetch).not.toHaveBeenCalled()
    })
})
