import { createRequire } from 'node:module'
import type { AddressInfo } from 'node:net'

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { wrapCommand } from '@wdio/utils'
import { BidiHandler } from 'webdriver'
import type { WebSocketServer as WebSocketServerType } from 'ws'

vi.mock('../../../src/session/context.js', () => ({
    getContextManager () {
        return {
            getCurrentContext: async () => 'ctx-1'
        }
    }
}))

const { execute } = await import('../../../src/commands/browser/execute.js')

/**
 * `ws` is a dependency of `webdriver`, the package that opens the connection
 */
const { WebSocketServer } = createRequire(import.meta.resolve('webdriver'))('ws') as { WebSocketServer: typeof WebSocketServerType }

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * The whole path a user hits: `execute()` → the command wrapper with its
 * `beforeCommand`/`afterCommand` hooks → `BidiHandler` → a WebSocket that
 * answers like a browser after `answerAfter` ms.
 */
describe('execute BiDi script timeout through the command wrapper', () => {
    let server: WebSocketServerType
    let handler: BidiHandler
    let answerAfter = 0

    beforeAll(async () => {
        server = new WebSocketServer({ port: 0, host: '127.0.0.1' })
        await new Promise((resolve) => server.once('listening', resolve))
        server.on('connection', (socket) => socket.on('message', async (raw) => {
            const { id } = JSON.parse(raw.toString())
            await sleep(answerAfter)
            socket.send(JSON.stringify({
                type: 'success',
                id,
                result: { type: 'success', realm: 'realm-1', result: { type: 'string', value: 'done' } }
            }))
        }))
        handler = new BidiHandler(`ws://127.0.0.1:${(server.address() as AddressInfo).port}`)
        await handler.connect()
    })

    afterAll(async () => {
        handler.close()
        await new Promise((resolve) => server.close(resolve))
    })

    function browserWithHooks (hookTime: number) {
        const browser = {
            isBidi: true,
            isMultiRemote: false,
            sessionId: 'session-1',
            capabilities: { timeouts: { script: 300 } },
            options: {
                beforeCommand: [() => sleep(hookTime)],
                afterCommand: [() => sleep(hookTime)]
            },
            scriptCallFunction: wrapCommand('scriptCallFunction', function (params: unknown) {
                return handler.scriptCallFunction(params as Parameters<BidiHandler['scriptCallFunction']>[0])
            })
        }
        return browser as unknown as WebdriverIO.Browser
    }

    it('does not count slow command hooks in the script timeout', async () => {
        answerAfter = 20
        await expect(execute.call(browserWithHooks(500), () => 'done')).resolves.toBe('done')
    })

    it('fails with a script timeout when the browser answers too late', async () => {
        answerAfter = 600
        const start = Date.now()
        await expect(execute.call(browserWithHooks(0), () => 'done')).rejects.toMatchObject({ name: 'script timeout' })
        expect(Date.now() - start).toBeLessThan(550)
    })
})
