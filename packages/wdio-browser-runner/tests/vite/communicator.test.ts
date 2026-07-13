import path from 'node:path'
import { describe, beforeEach, it, expect, vi } from 'vitest'
import { WS_MESSAGE_TYPES } from '@wdio/types'

import { ServerWorkerCommunicator } from '../../src/communicator.js'
import { SESSIONS, WDIO_EVENT_NAME } from '../../src/constants.js'
import libSourceMap from 'istanbul-lib-source-maps'
import libCoverage from 'istanbul-lib-coverage'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

interface WorkerMock {
    cid: string
    registerBrowserRunnerRpcHandlers: ReturnType<typeof vi.fn>
    sendWorkerRequest: ReturnType<typeof vi.fn>
    sendConsoleMessage: ReturnType<typeof vi.fn>
    sendBrowserTestResult: ReturnType<typeof vi.fn>
}

interface SetupResult {
    worker: WorkerMock
    handlers: Record<string, (...args: any[]) => any>
    dispose: ReturnType<typeof vi.fn>
}

/**
 * builds a `WorkerInstance` mock that captures the browser-runner handlers
 * registered via `registerBrowserRunnerRpcHandlers`, so we can invoke them
 * directly and assert on the worker forwarding methods.
 */
function setupWorker (cid = '0-0'): SetupResult {
    const handlers: Record<string, (...args: any[]) => any> = {}
    const dispose = vi.fn()
    const worker: WorkerMock = {
        cid,
        registerBrowserRunnerRpcHandlers: vi.fn((h: Record<string, (...args: any[]) => any>) => {
            Object.assign(handlers, h)
            return dispose
        }),
        sendWorkerRequest: vi.fn(),
        sendConsoleMessage: vi.fn(),
        sendBrowserTestResult: vi.fn()
    }
    return { worker, handlers, dispose }
}

describe('ServerWorkerCommunicator', () => {
    beforeEach(() => {
        SESSIONS.clear()
        vi.clearAllMocks()
    })

    it('registers browser-runner handlers on the worker without a second RPC server', () => {
        const { worker } = setupWorker()
        const server: any = { onBrowserEvent: vi.fn() }
        const communicator = new ServerWorkerCommunicator({} as any)
        communicator.register(server, worker as any)
        expect(server.onBrowserEvent).toBeCalledTimes(1)
        expect(worker.registerBrowserRunnerRpcHandlers).toBeCalledTimes(1)
    })

    it('should store session info on sessionMetadata', async () => {
        const { worker, handlers } = setupWorker('0-1')
        const server: any = { onBrowserEvent: vi.fn() }

        const communicator = new ServerWorkerCommunicator({ mochaOpts: { timeout: 1000 } } as any)
        communicator.register(server, worker as any)

        expect(SESSIONS.size).toBe(0)
        await handlers.sessionMetadata({
            capabilities: { platform: 'iOS' },
            sessionId: 'abc123',
            injectGlobals: true,
            isW3C: true,
            isMultiremote: false
        })

        expect(SESSIONS.size).toBe(1)
        expect(SESSIONS.get('0-1')?.sessionId).toBe('abc123')
    })

    it('should remove session and unregister handlers on sessionEnded', async () => {
        SESSIONS.set('0-2', { sessionId: 'xyz' } as any)
        const { worker, handlers, dispose } = setupWorker('0-2')

        const communicator = new ServerWorkerCommunicator({} as any)
        communicator.register({ onBrowserEvent: vi.fn() } as any, worker as any)

        await handlers.sessionEnded()

        expect(SESSIONS.has('0-2')).toBe(false)
        expect(dispose).toBeCalledTimes(1)
    })

    it('unregisters the handler only for the worker whose session ended', async () => {
        const { worker: workerA, handlers: handlersA, dispose: disposeA } = setupWorker('0-0')
        const { worker: workerB, handlers: handlersB, dispose: disposeB } = setupWorker('0-1')
        SESSIONS.set('0-0', { sessionId: 'a' } as any)
        SESSIONS.set('0-1', { sessionId: 'b' } as any)

        const communicator = new ServerWorkerCommunicator({} as any)
        communicator.register({ onBrowserEvent: vi.fn() } as any, workerA as any)
        communicator.register({ onBrowserEvent: vi.fn() } as any, workerB as any)

        await handlersA.sessionEnded()

        // worker A's sessionEnded must dispose only worker A, never worker B
        expect(disposeA).toHaveBeenCalledTimes(1)
        expect(disposeB).not.toHaveBeenCalled()
        expect(SESSIONS.has('0-0')).toBe(false)
        expect(SESSIONS.has('0-1')).toBe(true)

        await handlersB.sessionEnded()

        expect(disposeB).toHaveBeenCalledTimes(1)
        expect(SESSIONS.has('0-1')).toBe(false)
    })

    it('should transform and store coverage map on workerEvent', async () => {
        const fakeMap = {}
        const transformCoverage = vi.fn().mockResolvedValue(fakeMap)

        vi.spyOn(libCoverage, 'createCoverageMap').mockReturnValue({} as any)
        vi.spyOn(libSourceMap, 'createSourceMapStore').mockReturnValue({
            transformCoverage
        } as any)

        const { worker, handlers } = setupWorker('0-2')

        const communicator = new ServerWorkerCommunicator({} as any)
        communicator.register({ onBrowserEvent: vi.fn() } as any, worker as any)

        await handlers.workerEvent({
            args: { type: WS_MESSAGE_TYPES.coverageMap, value: {} }
        })

        expect(transformCoverage).toHaveBeenCalled()
        expect(communicator.coverageMaps).toHaveLength(1)
    })

    it('should return custom commands via onBrowserEvent for a session', async () => {
        const { worker, handlers } = setupWorker('0-3')
        const client = { send: vi.fn() }
        const server = { onBrowserEvent: vi.fn() }

        const communicator = new ServerWorkerCommunicator({} as any)
        communicator.register(server as any, worker as any)

        // Simulate the RPC message that stores the custom command
        await handlers.workerEvent({
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

    it('should forward request-style browser events to the worker via sendWorkerRequest', () => {
        const { worker } = setupWorker('0-0')
        const client = { send: vi.fn() }
        const server = { onBrowserEvent: vi.fn() }

        const communicator = new ServerWorkerCommunicator({} as any)
        communicator.register(server as any, worker as any)

        const onBrowserEvent = server.onBrowserEvent.mock.calls[0][0]
        const message = { type: WS_MESSAGE_TYPES.commandRequestMessage, value: { id: 99, cid: '0-0', commandName: 'click', args: [] } }
        onBrowserEvent(message, client)

        // a communicator-level id (0) is allocated, separate from the browser payload id (99)
        expect(worker.sendWorkerRequest).toHaveBeenCalledWith({ id: 0, message })
    })

    it('should forward fire-and-forget console and test-result events directly', () => {
        const { worker } = setupWorker('0-0')
        const client = { send: vi.fn() }
        const server = { onBrowserEvent: vi.fn() }

        const communicator = new ServerWorkerCommunicator({} as any)
        communicator.register(server as any, worker as any)

        const onBrowserEvent = server.onBrowserEvent.mock.calls[0][0]

        const consoleMsg = { type: WS_MESSAGE_TYPES.consoleMessage, value: { name: 'consoleEvent', type: 'log', args: ['hi'], cid: '0-0' } }
        onBrowserEvent(consoleMsg, client)
        expect(worker.sendConsoleMessage).toHaveBeenCalledWith(consoleMsg.value)

        const resultMsg = { type: WS_MESSAGE_TYPES.browserTestResult, value: { failures: 0, events: [] } }
        onBrowserEvent(resultMsg, client)
        expect(worker.sendBrowserTestResult).toHaveBeenCalledWith(resultMsg.value)

        // fire-and-forget events do not allocate a pending request
        expect(worker.sendWorkerRequest).not.toHaveBeenCalled()
    })

    it('should send message back to the correct WebSocket client on workerResponse', async () => {
        const { worker, handlers } = setupWorker('0-0')
        const client = { send: vi.fn() }
        const server = { onBrowserEvent: vi.fn() }

        const communicator = new ServerWorkerCommunicator({} as any)
        communicator.register(server as any, worker as any)

        // Simulate a request-style browser event that populates #pendingMessages
        const onBrowserEvent = server.onBrowserEvent.mock.calls[0][0]
        const requestMessage = { type: WS_MESSAGE_TYPES.commandRequestMessage, value: { id: 7, cid: '0-0', commandName: 'getTitle', args: [] } }
        onBrowserEvent(requestMessage, client)

        // The communicator id starts at 0 and is independent of the browser payload id (7)
        const responseMessage = { type: WS_MESSAGE_TYPES.commandResponseMessage, value: { id: 7, result: 'WebdriverIO' } }
        await handlers.workerResponse({
            args: {
                id: 0,
                message: responseMessage
            }
        })

        expect(client.send).toHaveBeenCalledWith(WDIO_EVENT_NAME, responseMessage)
    })
})
