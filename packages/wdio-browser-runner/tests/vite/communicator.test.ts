import path from 'node:path'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { MESSAGE_TYPES } from '@wdio/types'

import { ServerWorkerCommunicator } from '../../src/communicator.js'
import { SESSIONS, WDIO_EVENT_NAME } from '../../src/constants.js'

afterEach(() => {
    SESSIONS.clear()
})

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const commandRequest = {
    type: MESSAGE_TYPES.commandRequestMessage,
    value: { id: 4, cid: '0-0', commandName: 'url', args: ['/'] }
}

describe('ServerWorkerCommunicator', () => {
    it('should register server and worker', () => {
        const server: any = { onBrowserEvent: vi.fn() }
        const worker: any = { on: vi.fn() }
        const communicator = new ServerWorkerCommunicator({} as any)
        communicator.register(server, worker)
        expect(server.onBrowserEvent).toBeCalledTimes(1)
        expect(worker.on).toBeCalledTimes(1)
    })

    it('tracks sessions, coverage and custom commands from the worker', async () => {
        const server: any = { onBrowserEvent: vi.fn() }
        const worker: any = { on: vi.fn(), postMessage: vi.fn() }
        const communicator = new ServerWorkerCommunicator({ mochaOpts: { timeout: 1 } } as any)
        communicator.register(server, worker)
        const onWorkerMessage = worker.on.mock.calls[0][1]

        expect(SESSIONS.size).toBe(0)
        await onWorkerMessage({
            name: 'sessionStarted',
            cid: '0-0',
            content: { capabilities: { browserName: 'chrome' }, sessionId: 'sid', injectGlobals: true }
        })
        expect(SESSIONS.size).toBe(1)
        expect(SESSIONS.get('0-0')).toMatchObject({ sessionId: 'sid', injectGlobals: true })

        expect(communicator.coverageMaps).toHaveLength(0)
        await onWorkerMessage({ name: 'workerEvent', args: { type: MESSAGE_TYPES.coverageMap, value: {} } })
        expect(communicator.coverageMaps).toHaveLength(1)

        await onWorkerMessage({
            name: 'workerEvent',
            args: { type: MESSAGE_TYPES.customCommand, value: { commandName: 'foo', cid: '0-0' } }
        })
        await onWorkerMessage({ name: 'sessionEnded', cid: '0-0' })
        expect(SESSIONS.size).toBe(0)

        const onBrowserEvent = server.onBrowserEvent.mock.calls[0][0]
        const client = { send: vi.fn() }
        onBrowserEvent({ type: MESSAGE_TYPES.initiateBrowserStateRequest, value: { cid: '0-0' } }, client)
        expect(client.send).toHaveBeenCalledWith(WDIO_EVENT_NAME, {
            type: MESSAGE_TYPES.initiateBrowserStateResponse,
            value: { customCommands: [] }
        })
    })

    it('routes browser channel messages by whether they expect a reply', async () => {
        const server: any = { onBrowserEvent: vi.fn() }
        const worker: any = { on: vi.fn(), postMessage: vi.fn() }
        const communicator = new ServerWorkerCommunicator({} as any)
        communicator.register(server, worker)
        const onWorkerMessage = worker.on.mock.calls[0][1]
        const onBrowserEvent = server.onBrowserEvent.mock.calls[0][0]
        const client = { send: vi.fn().mockReturnValue('sent') }

        onBrowserEvent({ type: 'foobar' }, client)
        onBrowserEvent({
            type: MESSAGE_TYPES.commandResponseMessage,
            value: { id: 1, result: 'from-browser' }
        }, client)
        onBrowserEvent({
            type: MESSAGE_TYPES.commandRequestMessage,
            value: { id: 1, commandName: 'url', args: [] }
        }, client)
        expect(worker.postMessage).not.toHaveBeenCalled()
        expect(client.send).not.toHaveBeenCalled()

        onBrowserEvent({
            type: MESSAGE_TYPES.initiateBrowserStateRequest,
            value: { cid: '0-0' }
        }, client)
        expect(worker.postMessage).not.toHaveBeenCalled()
        expect(client.send).toHaveBeenCalledWith(WDIO_EVENT_NAME, {
            type: MESSAGE_TYPES.initiateBrowserStateResponse,
            value: { customCommands: [] }
        })

        await onWorkerMessage({
            name: 'workerEvent',
            args: { type: MESSAGE_TYPES.customCommand, value: { commandName: 'myCommand', cid: '0-0' } }
        })
        onBrowserEvent({
            type: MESSAGE_TYPES.initiateBrowserStateRequest,
            value: { cid: '0-0' }
        }, client)
        expect(client.send).toHaveBeenLastCalledWith(WDIO_EVENT_NAME, {
            type: MESSAGE_TYPES.initiateBrowserStateResponse,
            value: { customCommands: ['myCommand'] }
        })

        onBrowserEvent({
            type: MESSAGE_TYPES.consoleMessage,
            value: { name: 'consoleEvent', type: 'log', args: ['hi'], cid: '0-0' }
        }, client)
        expect(worker.postMessage).toHaveBeenCalledTimes(1)
        const consoleCall = worker.postMessage.mock.calls[0]
        expect(consoleCall[0]).toBe('workerRequest')
        expect(consoleCall[1].message.type).toBe(MESSAGE_TYPES.consoleMessage)
        expect(consoleCall[2]).toBe(true)

        expect(await onWorkerMessage({
            name: 'workerResponse',
            args: {
                id: consoleCall[1].id,
                message: { type: MESSAGE_TYPES.commandResponseMessage, value: { id: 1, result: 'late' } }
            }
        })).toBeUndefined()
        expect(client.send).toHaveBeenCalledTimes(2)

        onBrowserEvent(commandRequest, client)
        const commandCall = worker.postMessage.mock.calls.at(-1)
        const response = {
            type: MESSAGE_TYPES.commandResponseMessage,
            value: { id: 4, result: 'ok' }
        }
        expect(await onWorkerMessage({
            name: 'workerResponse',
            args: { id: commandCall[1].id, message: response }
        })).toBe('sent')
        expect(client.send).toHaveBeenLastCalledWith(WDIO_EVENT_NAME, response)

        expect(await onWorkerMessage({
            name: 'workerResponse',
            args: { id: 999, message: response }
        })).toBeUndefined()

        onBrowserEvent(commandRequest, client)
        const invalidReplyCall = worker.postMessage.mock.calls.at(-1)
        const sendsBeforeInvalidReply = client.send.mock.calls.length
        expect(await onWorkerMessage({
            name: 'workerResponse',
            args: {
                id: invalidReplyCall[1].id,
                message: { type: MESSAGE_TYPES.consoleMessage, value: { name: 'consoleEvent', type: 'log', args: [], cid: '0-0' } }
            }
        })).toBeUndefined()
        expect(client.send).toHaveBeenCalledTimes(sendsBeforeInvalidReply)
    })
})
