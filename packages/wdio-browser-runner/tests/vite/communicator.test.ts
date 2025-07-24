import path from 'node:path'
import { describe, it, expect, vi } from 'vitest'
import { WS_MESSAGE_TYPES } from '@wdio/types'

import { ServerWorkerCommunicator } from '../../src/communicator.js'
import { SESSIONS, WDIO_EVENT_NAME } from '../../src/constants.js'
import { createServerRpc } from '@wdio/rpc'
import libSourceMap from 'istanbul-lib-source-maps'
import libCoverage from 'istanbul-lib-coverage'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const mocksOfServerRpc = vi.hoisted(() => {
    return {
        createServerRpc: vi.fn(),
    }
})

vi.mock('@wdio/rpc', () => {
    return {
        createServerRpc: mocksOfServerRpc.createServerRpc,
    }
})

describe('ServerWorkerCommunicator', () => {
    it('should register server and worker', () => {
        const server: any = { onBrowserEvent: vi.fn() }
        const worker: any = { on: vi.fn() }
        const communicator = new ServerWorkerCommunicator({} as any)
        communicator.register(server, worker)
        expect(server.onBrowserEvent).toBeCalledTimes(1)
        expect(createServerRpc).toBeCalledTimes(1)
    })

    it('should store session info on sessionStarted', async () => {
        const server: any = { onBrowserEvent: vi.fn() }
        const worker: any = {}

        const rpcHandlers: any = {}
        vi.mocked(createServerRpc).mockImplementation((handlers) => Object.assign(rpcHandlers, handlers))

        const communicator = new ServerWorkerCommunicator({ mochaOpts: { timeout: 1000 } } as any)
        communicator.register(server, worker)

        expect(SESSIONS.size).toBe(0)
        await rpcHandlers.sessionStarted({
            cid: '0-1',
            content: {
                capabilities: { platform: 'iOS' },
                sessionId: 'abc123',
                injectGlobals: true
            }
        })

        expect(SESSIONS.size).toBe(1)
        expect(SESSIONS.get('0-1')?.sessionId).toBe('abc123')
    })

    it('should remove session on sessionEnded', async () => {
        SESSIONS.set('0-2', { sessionId: 'xyz' } as any)

        const rpcHandlers: any = {}
        vi.mocked(createServerRpc).mockImplementation((handlers) => Object.assign(rpcHandlers, handlers))

        const communicator = new ServerWorkerCommunicator({} as any)
        communicator.register({ onBrowserEvent: vi.fn() } as any, {} as any)

        await rpcHandlers.sessionEnded({ cid: '0-2' })
        expect(SESSIONS.has('0-2')).toBe(false)
    })

    it('should transform and store coverage map on workerEvent', async () => {
        const fakeMap = {}
        const transformCoverage = vi.fn().mockResolvedValue(fakeMap)

        vi.spyOn(libCoverage, 'createCoverageMap').mockReturnValue({} as any)
        vi.spyOn(libSourceMap, 'createSourceMapStore').mockReturnValue({
            transformCoverage
        } as any)

        const rpcHandlers: any = {}
        vi.mocked(createServerRpc).mockImplementation((handlers) => Object.assign(rpcHandlers, handlers))

        const communicator = new ServerWorkerCommunicator({} as any)
        communicator.register({ onBrowserEvent: vi.fn() } as any, {} as any)

        await rpcHandlers.workerEvent({
            args: { type: WS_MESSAGE_TYPES.coverageMap, value: {} }
        })

        expect(transformCoverage).toHaveBeenCalled()
        expect(communicator.coverageMaps).toHaveLength(1)
    })

    it('should return custom commands via onBrowserEvent for a session', async () => {
        const client = { send: vi.fn() }
        const server = {
            onBrowserEvent: vi.fn()
        }
        const worker = { postMessage: vi.fn() }

        const rpcHandlers: any = {}
        vi.mocked(createServerRpc).mockImplementation((handlers) => Object.assign(rpcHandlers, handlers))

        const communicator = new ServerWorkerCommunicator({} as any)
        communicator.register(server as any, worker as any)

        // Simulate the RPC message that stores the custom command
        await rpcHandlers.workerEvent({
            args: {
                type: WS_MESSAGE_TYPES.customCommand,
                value: {
                    cid: '0-3',
                    commandName: 'click'
                }
            }
        })

        // Simulate browser event triggering internal lookup and response
        const onBrowserEvent = server.onBrowserEvent.mock.calls[0][0]
        const eventMessage = {
            type: WS_MESSAGE_TYPES.initiateBrowserStateRequest,
            value: {
                cid: '0-3'
            }
        }

        onBrowserEvent(eventMessage, client)

        expect(client.send).toHaveBeenCalledWith(WDIO_EVENT_NAME, {
            type: WS_MESSAGE_TYPES.initiateBrowserStateResponse,
            value: {
                customCommands: ['click']
            }
        })
    })

    it('should send message back to the correct WebSocket client on workerResponse', async () => {
        const client = { send: vi.fn() }
        const server = {
            onBrowserEvent: vi.fn()
        }
        const worker = { postMessage: vi.fn() }
        const rpcHandlers: any = {}

        vi.mocked(createServerRpc).mockImplementation((handlers) => Object.assign(rpcHandlers, handlers))

        const communicator = new ServerWorkerCommunicator({} as any)
        communicator.register(server as any, worker as any)

        // Simulate a browser event that triggers #onBrowserEvent
        const onBrowserEvent = server.onBrowserEvent.mock.calls[0][0]

        const testMessage = {
            type: 'foobar'
        }

        // This call triggers the internal population of #pendingMessages
        onBrowserEvent(testMessage, client)

        // The last ID added inside communicator
        const lastMsgId = 0 // (starts at 0 in #msgId)

        await rpcHandlers.workerResponse({
            args: {
                id: lastMsgId,
                message: { type: 'test-type' }
            }
        })

        expect(client.send).toHaveBeenCalledWith(WDIO_EVENT_NAME, { type: 'test-type' })
    })
})
