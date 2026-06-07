import path from 'node:path'
import type { ChildProcess } from 'node:child_process'
import { WritableStreamBuffer } from 'stream-buffers'
import { describe, expect, it, vi } from 'vitest'

import logger from '@wdio/logger'
import type { Workers } from '@wdio/types'
import { IPC_MESSAGE_TYPES } from '@wdio/types'
import { WORKER_RPC_EVENT, createServerRpc, type ServerFunctions } from '@wdio/rpc'
import type * as WdioRpc from '@wdio/rpc'

import Worker from '../src/worker.js'

const workerConfig = {
    cid: '0-3',
    configFile: '/foobar',
    caps: {},
    specs: ['/some/spec'],
    execArgv: [],
    retries: 0
}

/**
 * the single parent-side RPC server proxy returned by `createServerRpc` is used
 * by `WorkerInstance` to forward browser events. Capture it so we can assert on
 * those forwarding calls.
 */
const { rpcProxy } = vi.hoisted(() => ({
    rpcProxy: {
        workerRequest: vi.fn(),
        consoleMessage: vi.fn(),
        browserTestResult: vi.fn()
    }
}))

/**
 * capture the server handlers passed to `createServerRpc` so we can invoke them
 * directly without spawning a real child process. The real transport helpers
 * (`createWorkerRpcTransport`, `isBirpcFrame`, `WORKER_RPC_EVENT`) are kept so
 * frame routing and listener cleanup behave like production.
 */
let capturedServerHandlers: Partial<ServerFunctions> | undefined
vi.mock('@wdio/rpc', async (importActual) => {
    const actual = await importActual<typeof WdioRpc>()
    return {
        ...actual,
        createServerRpc: vi.fn((transport: { on: (fn: (msg: unknown) => void) => void }, handlers: Partial<ServerFunctions>) => {
            capturedServerHandlers = handlers
            // simulate birpc registering its message handler through the transport
            transport.on(() => {})
            return rpcProxy
        })
    }
})

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

// Mock XvfbManager
const mockXvfbManager = {
    init: vi.fn().mockResolvedValue(true)
}

describe('handleMessage', () => {
    it('should emit payload with cid', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        worker.emit = vi.fn()

        worker['_handleMessage']({ foo: 'bar' } as unknown as Workers.WorkerMessage)
        expect(worker.emit).toBeCalledWith('message', {
            foo: 'bar',
            cid: '0-3'
        })
    })

    it('should un mark worker as busy if command is finished', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        worker.isBusy = true
        worker['_handleMessage']({ name: 'finishedCommand' } as unknown as Workers.WorkerMessage)
        expect(worker.isBusy).toBe(false)
    })

    it('should mark worker as ready if ready message was received', async () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        worker['_handleMessage']({ name: 'ready' } as unknown as Workers.WorkerMessage)
        expect(await worker.isReady).toBe(true)
    })

    it('stores sessionId and connection data to worker instance', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        worker.emit = vi.fn()
        const payload = {
            name: 'sessionStarted',
            content: {
                sessionId: 'abc123',
                bar: 'foo'
            }
        }
        worker['_handleMessage'](payload as unknown as Workers.WorkerMessage)
        expect(worker.sessionId).toEqual('abc123')
    })

    it('stores instances to worker instance in Multiremote mode', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        const payload = {
            name: 'sessionStarted',
            content: {
                instances: { foo: { sessionId: 'abc123' } },
                isMultiremote: true
            }
        }
        worker['_handleMessage'](payload as unknown as Workers.WorkerMessage)
        expect(worker.instances).toEqual({ foo: { sessionId: 'abc123' } })
        expect(worker.isMultiremote).toEqual(true)
    })

    it('normalizes typed reporterRealTime IPC messages into the legacy CLI shape', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        worker.emit = vi.fn()

        worker['_handleMessage']({
            type: IPC_MESSAGE_TYPES.reporterRealTime,
            value: {
                origin: 'reporter',
                name: 'dot',
                content: 'some output'
            }
        } as unknown as Workers.WorkerMessage)

        expect(worker.emit).toBeCalledWith('message', {
            origin: 'reporter',
            name: 'dot',
            content: 'some output',
            cid: '0-3'
        })
    })

    it('does not mutate the original typed IPC payload when normalizing', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        worker.emit = vi.fn()

        const payload = {
            type: IPC_MESSAGE_TYPES.reporterRealTime,
            value: {
                origin: 'reporter',
                name: 'dot',
                content: 'some output'
            }
        }
        worker['_handleMessage'](payload as unknown as Workers.WorkerMessage)

        expect(payload).toEqual({
            type: IPC_MESSAGE_TYPES.reporterRealTime,
            value: {
                origin: 'reporter',
                name: 'dot',
                content: 'some output'
            }
        })
    })

    it('normalizes typed errorMessage IPC messages (printFailureMessage) into the legacy CLI shape', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        worker.emit = vi.fn()

        worker['_handleMessage']({
            type: IPC_MESSAGE_TYPES.errorMessage,
            value: {
                origin: 'reporter',
                name: 'printFailureMessage',
                content: { error: { message: 'boom' } }
            }
        } as unknown as Workers.WorkerMessage)

        expect(worker.emit).toBeCalledWith('message', {
            origin: 'reporter',
            name: 'printFailureMessage',
            content: { error: { message: 'boom' } },
            cid: '0-3'
        })
    })

    it('normalizes typed errorMessage IPC messages (error) into the legacy CLI shape', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        worker.emit = vi.fn()

        worker['_handleMessage']({
            type: IPC_MESSAGE_TYPES.errorMessage,
            value: {
                origin: 'worker',
                name: 'error',
                content: { name: 'Error', message: 'boom', stack: 'stack' }
            }
        } as unknown as Workers.WorkerMessage)

        expect(worker.emit).toBeCalledWith('message', {
            origin: 'worker',
            name: 'error',
            content: { name: 'Error', message: 'boom', stack: 'stack' },
            cid: '0-3'
        })
    })

    it('passes legacy reporter messages through unchanged (plus cid)', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        worker.emit = vi.fn()

        worker['_handleMessage']({
            origin: 'reporter',
            name: 'dot',
            content: 'legacy output'
        } as unknown as Workers.WorkerMessage)

        expect(worker.emit).toBeCalledWith('message', {
            origin: 'reporter',
            name: 'dot',
            content: 'legacy output',
            cid: '0-3'
        })
    })

    it('routes birpc wire frames to the RPC event and never to the CLI message event', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        const messageListener = vi.fn()
        const rpcListener = vi.fn()
        worker.on('message', messageListener)
        worker.on(WORKER_RPC_EVENT, rpcListener)

        // a birpc request frame is identified by its `t` marker ('q' | 's')
        const birpcFrame = { m: 'sessionMetadata', a: [{}], i: '1', t: 'q' }
        worker['_handleMessage'](birpcFrame as unknown as Workers.WorkerMessage)

        // forwarded to the RPC layer
        expect(rpcListener).toBeCalledWith(birpcFrame)
        // but NOT emitted as a generic `message` event consumed by the CLI
        expect(messageListener).not.toBeCalled()
    })

    it('does not override existing session info when sessionStarted follows sessionMetadata', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        worker.sessionId = 'abc123'
        worker.capabilities = { platform: 'iOS' } as any

        const payload = {
            name: 'sessionStarted',
            content: {
                sessionId: 'abc999',
                capabilities: { platform: 'android' }
            }
        }

        worker['_handleMessage'](payload as unknown as Workers.WorkerMessage)

        expect(worker.sessionId).toBe('abc123')
        expect(worker.capabilities).toEqual({ platform: 'iOS' })
    })
})

describe('birpc server handlers', () => {
    it('testFrameworkInitMessage forwards a legacy CLI event', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        const listener = vi.fn()
        worker.on('message', listener)

        const data = { cid: '0-3', caps: {}, specs: ['/some/spec'], hasTests: true }
        capturedServerHandlers!.testFrameworkInitMessage!(data as any)

        expect(listener).toBeCalledWith({
            name: 'testFrameworkInit',
            content: data,
            cid: '0-3'
        })
    })

    it('snapshotResults forwards the snapshot event with cid', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        const listener = vi.fn()
        worker.on('message', listener)

        const data = {
            origin: 'worker',
            name: 'snapshot',
            content: ['snapshot-result']
        }
        capturedServerHandlers!.snapshotResults!(data as any)

        expect(listener).toBeCalledWith({
            origin: 'worker',
            name: 'snapshot',
            content: ['snapshot-result'],
            cid: '0-3'
        })
    })

    it('errorMessage forwards a worker error event with cid', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        const listener = vi.fn()
        worker.on('message', listener)

        const data = {
            origin: 'worker',
            name: 'error',
            content: { name: 'Error', message: 'boom', stack: 'stack' }
        }
        capturedServerHandlers!.errorMessage!(data as any)

        expect(listener).toBeCalledWith({
            ...data,
            cid: '0-3'
        })
    })

    it('does not mutate the incoming birpc data', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        worker.on('message', vi.fn())

        const data = {
            origin: 'worker',
            name: 'error',
            content: { name: 'Error', message: 'boom', stack: 'stack' }
        }
        capturedServerHandlers!.errorMessage!(data as any)

        expect(data).toEqual({
            origin: 'worker',
            name: 'error',
            content: { name: 'Error', message: 'boom', stack: 'stack' }
        })
    })
})

describe('single parent-side RPC server', () => {
    it('creates exactly one RPC server per worker', () => {
        vi.mocked(createServerRpc).mockClear()
        new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        expect(createServerRpc).toHaveBeenCalledTimes(1)
    })

    it('registerBrowserRunnerRpcHandlers registers and unregisters handlers', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        const workerEvent = vi.fn()
        const dispose = worker.registerBrowserRunnerRpcHandlers({ workerEvent })

        const event = { name: 'foo', origin: 'browser', args: { type: 'noop' } }
        capturedServerHandlers!.workerEvent!(event as any)
        expect(workerEvent).toBeCalledWith(event)

        dispose()
        workerEvent.mockClear()
        capturedServerHandlers!.workerEvent!(event as any)
        expect(workerEvent).not.toBeCalled()
    })

    it('workerResponse delegates to the registered browser-runner handler', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        const workerResponse = vi.fn()
        worker.registerBrowserRunnerRpcHandlers({ workerResponse })

        const response = { args: { id: 1, message: { type: 'cmd', value: {} } } }
        capturedServerHandlers!.workerResponse!(response as any)
        expect(workerResponse).toBeCalledWith(response)
    })

    it('sessionMetadata calls both local state update and browser-runner handler', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        const sessionMetadata = vi.fn()
        worker.registerBrowserRunnerRpcHandlers({ sessionMetadata })

        const data = { sessionId: 'abc', capabilities: {}, specFileRetries: 0 }
        capturedServerHandlers!.sessionMetadata!(data as any)
        expect(sessionMetadata).toBeCalledWith(data)
        expect(worker.sessionId).toBe('abc')
    })

    it('browser-runner-specific events are ignored when no handlers are registered', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        const listener = vi.fn()
        worker.on('message', listener)

        expect(() => capturedServerHandlers!.workerEvent!({ name: 'x', origin: 'browser', args: {} } as any)).not.toThrow()
        expect(() => capturedServerHandlers!.workerResponse!({ args: { id: 1, message: {} } } as any)).not.toThrow()
        expect(listener).not.toBeCalled()
    })

    it('forwards browser events to the worker via the RPC proxy', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        rpcProxy.workerRequest.mockClear()
        rpcProxy.consoleMessage.mockClear()
        rpcProxy.browserTestResult.mockClear()

        const request = { id: 5, message: { type: 'cmd', value: {} } }
        worker.sendWorkerRequest(request as any)
        expect(rpcProxy.workerRequest).toBeCalledWith(request)

        worker.sendConsoleMessage({ type: 'log', args: [] } as any)
        expect(rpcProxy.consoleMessage).toBeCalledWith({ type: 'log', args: [] })

        worker.sendBrowserTestResult({ foo: 'bar' } as any)
        expect(rpcProxy.browserTestResult).toBeCalledWith({ foo: 'bar' })
    })
})

describe('handleError', () => {
    it('should emit error', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        worker.emit = vi.fn()
        worker['_handleError']({ foo: 'bar' } as unknown as Error)
        expect(worker.emit).toBeCalledWith('error', {
            cid: '0-3',
            foo: 'bar'
        })
    })
})

describe('handleExit', () => {
    it('should handle it', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        const childProcess = { kill: vi.fn() }
        worker.childProcess = childProcess as unknown as ChildProcess
        worker.isBusy = true
        worker.emit = vi.fn()
        worker['_handleExit'](42)

        expect(worker.childProcess).toBe(undefined)
        expect(worker.isBusy).toBe(false)
        expect(worker.emit).toBeCalledWith('exit', {
            cid: '0-3',
            exitCode: 42,
            retries: 0,
            specs: ['/some/spec']
        })
    })

    it('disposes the RPC listener on exit', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        expect(worker.listenerCount(WORKER_RPC_EVENT)).toBe(1)
        worker['_handleExit'](0)
        expect(worker.listenerCount(WORKER_RPC_EVENT)).toBe(0)
    })
})

describe('kill', () => {
    it('should kill child process with given signal and clean up', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        const childProcess = { kill: vi.fn() }
        worker.childProcess = childProcess as unknown as ChildProcess
        worker.isBusy = true

        worker.kill('SIGTERM')

        expect(childProcess.kill).toHaveBeenCalledWith('SIGTERM')
        expect(worker.childProcess).toBe(undefined)
        expect(worker.isKilled).toBe(true)
        expect(worker.isBusy).toBe(false)
        expect(worker.listenerCount(WORKER_RPC_EVENT)).toBe(0)
    })

    it('should use SIGTERM as default signal', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        const childProcess = { kill: vi.fn() }
        worker.childProcess = childProcess as unknown as ChildProcess

        worker.kill()

        expect(childProcess.kill).toHaveBeenCalledWith('SIGTERM')
    })

    it('should kill with SIGKILL when specified', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        const childProcess = { kill: vi.fn() }
        worker.childProcess = childProcess as unknown as ChildProcess

        worker.kill('SIGKILL')

        expect(childProcess.kill).toHaveBeenCalledWith('SIGKILL')
        expect(worker.isKilled).toBe(true)
    })

    it('should handle missing child process gracefully', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        worker.childProcess = undefined

        expect(() => worker.kill('SIGTERM')).not.toThrow()
        expect(worker.isKilled).toBe(false)
    })

    it('should handle kill errors gracefully', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        const childProcess = { kill: vi.fn().mockImplementation(() => { throw new Error('Kill failed') }) }
        worker.childProcess = childProcess as unknown as ChildProcess

        expect(() => worker.kill('SIGTERM')).not.toThrow()
        expect(worker.isKilled).toBe(true)
        expect(worker.isBusy).toBe(false)
    })
})

describe('postMessage', () => {
    it('should log if the cid is busy and exit', async () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        const log = logger('webdriver')
        vi.spyOn(log, 'info').mockImplementation((string) => string)

        worker.isBusy = true
        await worker.postMessage('test-message', {})

        expect(log.info)
            .toHaveBeenCalledWith('worker with cid 0-3 already busy and can\'t take new commands')
    })

    it('should create a process if it does not have one', async () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        worker.isReady = Promise.resolve(true)
        worker.childProcess = undefined
        vi.spyOn(worker, 'startProcess').mockImplementation(
            async () => ({ send: vi.fn() }) as unknown as ChildProcess)
        await worker.postMessage('test-message', {})

        expect(worker.startProcess).toHaveBeenCalled()
        expect(worker.isBusy).toBeTruthy()

        vi.mocked(worker.startProcess).mockRestore()
    })

    it('should wait sending the command until worker is ready', async () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        worker.childProcess = { send: vi.fn() } as any
        await worker.postMessage('test-message', {})
        expect(worker.childProcess!.send).toBeCalledTimes(0)
        worker.isReadyResolver(true)
        await worker.isReady
        expect(worker.childProcess!.send).toBeCalledTimes(1)
    })

    it('should not throw unhandled rejection when worker is killed before isReady resolves', async () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        worker.childProcess = { send: vi.fn(), kill: vi.fn() } as any

        // postMessage queues send behind isReady (not yet resolved)
        const postMsgPromise = worker.postMessage('test-message', {})

        // kill() deletes childProcess before isReady resolves
        worker.kill()

        // resolve isReady — the .then() callback now fires with no childProcess
        worker.isReadyResolver(true)

        // postMessage itself should resolve without throwing
        await expect(postMsgPromise).resolves.toBeUndefined()

        // and no unhandled rejection — the send is safely skipped
        await worker.isReady
    })
})
