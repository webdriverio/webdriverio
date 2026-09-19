import path from 'node:path'
import type { ChildProcess } from 'node:child_process'
import { WritableStreamBuffer } from 'stream-buffers'
import { describe, expect, it, vi } from 'vitest'

import logger from '@wdio/logger'
import type { Workers } from '@wdio/types'
import { ProcessFactory } from '@wdio/xvfb'

import Worker from '../src/worker.js'

const workerConfig = {
    cid: '0-3',
    configFile: '/foobar',
    caps: {},
    specs: ['/some/spec'],
    execArgv: [],
    retries: 0
}

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

    it('resolves the retry budget on testFrameworkInit so it survives a failed session start', () => {
        const worker = new Worker({} as any, { ...workerConfig, retries: -1 }, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        worker.emit = vi.fn()
        worker['_handleMessage']({ name: 'testFrameworkInit', specFileRetries: 3 } as unknown as Workers.WorkerMessage)
        expect(worker.retries).toBe(2)
    })

    it('propagates the resolved retry budget with the exit event when the session never started', () => {
        const worker = new Worker({} as any, { ...workerConfig, retries: -1 }, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        worker.emit = vi.fn()
        worker['_handleMessage']({ name: 'testFrameworkInit', specFileRetries: 3 } as unknown as Workers.WorkerMessage)
        worker['_handleExit'](1)
        expect(worker.emit).toBeCalledWith('exit', { cid: '0-3', exitCode: 1, specs: ['/some/spec'], retries: 2, signal: null })
    })

    it('does not touch an already resolved retry budget on testFrameworkInit', () => {
        const worker = new Worker({} as any, { ...workerConfig, retries: 1 }, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        worker.emit = vi.fn()
        worker['_handleMessage']({ name: 'testFrameworkInit', specFileRetries: 3 } as unknown as Workers.WorkerMessage)
        expect(worker.retries).toBe(1)
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
            specs: ['/some/spec'],
            signal: null
        })
    })

    it('derives a non zero exit code from the signal if the worker was killed by one', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        const childProcess = { kill: vi.fn() }
        worker.childProcess = childProcess as unknown as ChildProcess
        worker.emit = vi.fn()
        worker['_handleExit'](null, 'SIGSEGV')

        expect(worker.emit).toBeCalledWith('exit', {
            cid: '0-3',
            exitCode: 139,
            retries: 0,
            specs: ['/some/spec'],
            signal: 'SIGSEGV'
        })
    })

    it('reports a crashed worker as failed so it is not swallowed by the launcher', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        worker.emit = vi.fn()
        worker['_handleExit'](null, 'SIGSEGV')

        const { exitCode } = vi.mocked(worker.emit).mock.calls[0][1] as { exitCode: number }
        expect(exitCode).not.toBe(0)
        expect(exitCode).toBeTruthy()
    })

    it('falls back to a generic failure code if neither exit code nor signal is known', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        worker.emit = vi.fn()
        worker['_handleExit'](null, null)

        expect(worker.emit).toBeCalledWith('exit', expect.objectContaining({ exitCode: 1, signal: null }))
    })

    it('logs an error explaining the crash', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        const log = logger('@wdio/local-runner')
        worker.emit = vi.fn()
        vi.mocked(log.error).mockClear()
        worker['_handleExit'](null, 'SIGSEGV')

        expect(log.error).toBeCalledTimes(1)
        expect(vi.mocked(log.error).mock.calls[0][0]).toContain('SIGSEGV')
        expect(vi.mocked(log.error).mock.calls[0][0]).toContain('/some/spec')
    })

    it('does not report an expected shutdown signal as a crash', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        const log = logger('@wdio/local-runner')
        worker.emit = vi.fn()
        vi.mocked(log.error).mockClear()
        worker['_handleExit'](null, 'SIGTERM')

        expect(log.error).not.toBeCalled()
        expect(worker.emit).toBeCalledWith('exit', expect.objectContaining({ exitCode: 143, signal: 'SIGTERM' }))
    })

    it('does not report a deliberately killed worker as a crash', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer(), mockXvfbManager as any)
        const log = logger('@wdio/local-runner')
        worker.childProcess = { kill: vi.fn() } as unknown as ChildProcess
        worker.emit = vi.fn()
        vi.mocked(log.error).mockClear()
        worker.kill('SIGKILL')
        worker['_handleExit'](null, 'SIGKILL')

        expect(log.error).not.toBeCalled()
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

describe('startProcess NODE_OPTIONS', () => {
    const runStartProcess = async (parentNodeOptions: string | undefined) => {
        const original = process.env.NODE_OPTIONS
        if (parentNodeOptions === undefined) {
            delete process.env.NODE_OPTIONS
        } else {
            process.env.NODE_OPTIONS = parentNodeOptions
        }

        const createWorkerProcess = vi
            .spyOn(ProcessFactory.prototype, 'createWorkerProcess')
            .mockResolvedValue({
                on: vi.fn(),
                stdout: null,
                stderr: null,
            } as unknown as ChildProcess)

        try {
            const worker = new Worker(
                {} as any,
                workerConfig,
                new WritableStreamBuffer(),
                new WritableStreamBuffer(),
                mockXvfbManager as any
            )
            await worker.startProcess()
            const options = createWorkerProcess.mock.calls[0]![2] as { env: Record<string, string> }
            return options.env.NODE_OPTIONS
        } finally {
            createWorkerProcess.mockRestore()
            if (original === undefined) {
                delete process.env.NODE_OPTIONS
            } else {
                process.env.NODE_OPTIONS = original
            }
        }
    }

    it('always enables source maps in the worker when the parent has no NODE_OPTIONS', async () => {
        const nodeOptions = await runStartProcess(undefined)
        // must not leak a literal "undefined" and must keep source maps
        expect(nodeOptions).toBe('--enable-source-maps')
    })

    it('preserves parent node flags and still enables source maps', async () => {
        const nodeOptions = await runStartProcess('--import tsx')
        const flags = nodeOptions.split(' ')
        expect(flags).toContain('--import')
        expect(flags).toContain('tsx')
        expect(flags).toContain('--enable-source-maps')
    })

    it('does not duplicate parent flags or --enable-source-maps', async () => {
        const nodeOptions = await runStartProcess('--enable-source-maps --import tsx')
        const occurrences = nodeOptions
            .split(' ')
            .filter((flag) => flag === '--enable-source-maps').length
        expect(occurrences).toBe(1)
        expect(nodeOptions).not.toContain('undefined')
    })
})
