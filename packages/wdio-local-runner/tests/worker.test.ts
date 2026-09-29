import path from 'node:path'
import type { ChildProcess } from 'node:child_process'
import { WritableStreamBuffer } from 'stream-buffers'
import { describe, expect, it, vi } from 'vitest'

const forkMock = vi.hoisted(() => vi.fn((
    _modulePath: string,
    _args?: readonly string[],
    _options?: { env?: NodeJS.ProcessEnv }
) => ({
    on: vi.fn(),
    stdout: null,
    stderr: null,
})))

vi.mock('node:child_process', async () => {
    const actual = await vi.importActual<Record<string, unknown>>('node:child_process')
    return {
        ...actual,
        fork: forkMock,
    }
})

import logger from '@wdio/logger'
import type { Workers } from '@wdio/types'

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

describe('handleMessage', () => {
    it('should emit payload with cid', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer())
        worker.emit = vi.fn()

        worker['_handleMessage']({ foo: 'bar' } as unknown as Workers.WorkerMessage)
        expect(worker.emit).toBeCalledWith('message', {
            foo: 'bar',
            cid: '0-3'
        })
    })

    it('should un mark worker as busy if command is finished', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer())
        worker.isBusy = true
        worker['_handleMessage']({ name: 'finishedCommand' } as unknown as Workers.WorkerMessage)
        expect(worker.isBusy).toBe(false)
    })

    it('should mark worker as ready if ready message was received', async () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer())
        worker['_handleMessage']({ name: 'ready' } as unknown as Workers.WorkerMessage)
        expect(await worker.isReady).toBe(true)
    })

    it('resolves the retry budget on testFrameworkInit so it survives a failed session start', () => {
        const worker = new Worker({} as any, { ...workerConfig, retries: -1 }, new WritableStreamBuffer(), new WritableStreamBuffer())
        worker.emit = vi.fn()
        worker['_handleMessage']({ name: 'testFrameworkInit', specFileRetries: 3 } as unknown as Workers.WorkerMessage)
        expect(worker.retries).toBe(2)
    })

    it('propagates the resolved retry budget with the exit event when the session never started', () => {
        const worker = new Worker({} as any, { ...workerConfig, retries: -1 }, new WritableStreamBuffer(), new WritableStreamBuffer())
        worker.emit = vi.fn()
        worker['_handleMessage']({ name: 'testFrameworkInit', specFileRetries: 3 } as unknown as Workers.WorkerMessage)
        worker['_handleExit'](1)
        expect(worker.emit).toBeCalledWith('exit', { cid: '0-3', exitCode: 1, specs: ['/some/spec'], retries: 2, signal: null })
    })

    it('does not touch an already resolved retry budget on testFrameworkInit', () => {
        const worker = new Worker({} as any, { ...workerConfig, retries: 1 }, new WritableStreamBuffer(), new WritableStreamBuffer())
        worker.emit = vi.fn()
        worker['_handleMessage']({ name: 'testFrameworkInit', specFileRetries: 3 } as unknown as Workers.WorkerMessage)
        expect(worker.retries).toBe(1)
    })

    it('stores sessionId and connection data to worker instance', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer())
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

    it('stores instances to worker instance in multi-remote mode', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer())
        const payload = {
            name: 'sessionStarted',
            content: {
                instances: { foo: { sessionId: 'abc123' } },
                isMultiRemote: true
            }
        }
        worker['_handleMessage'](payload as unknown as Workers.WorkerMessage)
        expect(worker.instances).toEqual({ foo: { sessionId: 'abc123' } })
        expect(worker.isMultiRemote).toEqual(true)
    })
})

describe('handleError', () => {
    it('should emit error', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer())
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
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer())
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
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer())
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
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer())
        worker.emit = vi.fn()
        worker['_handleExit'](null, 'SIGSEGV')

        const { exitCode } = vi.mocked(worker.emit).mock.calls[0][1] as { exitCode: number }
        expect(exitCode).not.toBe(0)
        expect(exitCode).toBeTruthy()
    })

    it('falls back to a generic failure code if neither exit code nor signal is known', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer())
        worker.emit = vi.fn()
        worker['_handleExit'](null, null)

        expect(worker.emit).toBeCalledWith('exit', expect.objectContaining({ exitCode: 1, signal: null }))
    })

    it('logs an error explaining the crash', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer())
        const log = logger('@wdio/local-runner')
        worker.emit = vi.fn()
        vi.mocked(log.error).mockClear()
        worker['_handleExit'](null, 'SIGSEGV')

        expect(log.error).toBeCalledTimes(1)
        expect(vi.mocked(log.error).mock.calls[0][0]).toContain('SIGSEGV')
        expect(vi.mocked(log.error).mock.calls[0][0]).toContain('/some/spec')
    })

    it('does not report an expected shutdown signal as a crash', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer())
        const log = logger('@wdio/local-runner')
        worker.emit = vi.fn()
        vi.mocked(log.error).mockClear()
        worker['_handleExit'](null, 'SIGTERM')

        expect(log.error).not.toBeCalled()
        expect(worker.emit).toBeCalledWith('exit', expect.objectContaining({ exitCode: 143, signal: 'SIGTERM' }))
    })

    it('does not report a deliberately killed worker as a crash', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer())
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
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer())
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
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer())
        const childProcess = { kill: vi.fn() }
        worker.childProcess = childProcess as unknown as ChildProcess

        worker.kill()

        expect(childProcess.kill).toHaveBeenCalledWith('SIGTERM')
    })

    it('should kill with SIGKILL when specified', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer())
        const childProcess = { kill: vi.fn() }
        worker.childProcess = childProcess as unknown as ChildProcess

        worker.kill('SIGKILL')

        expect(childProcess.kill).toHaveBeenCalledWith('SIGKILL')
        expect(worker.isKilled).toBe(true)
    })

    it('should handle missing child process gracefully', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer())
        worker.childProcess = undefined

        expect(() => worker.kill('SIGTERM')).not.toThrow()
        expect(worker.isKilled).toBe(false)
    })

    it('should handle kill errors gracefully', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer())
        const childProcess = { kill: vi.fn().mockImplementation(() => { throw new Error('Kill failed') }) }
        worker.childProcess = childProcess as unknown as ChildProcess

        expect(() => worker.kill('SIGTERM')).not.toThrow()
        expect(worker.isKilled).toBe(true)
        expect(worker.isBusy).toBe(false)
    })
})

describe('postMessage', () => {
    it('should log if the cid is busy and exit', async () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer())
        const log = logger('webdriver')
        vi.spyOn(log, 'info').mockImplementation((string) => string)

        worker.isBusy = true
        await worker.postMessage('test-message', {})

        expect(log.info)
            .toHaveBeenCalledWith('worker with cid 0-3 already busy and can\'t take new commands')
    })

    it('should create a process if it does not have one', async () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer())
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
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer())
        worker.childProcess = { send: vi.fn() } as any
        await worker.postMessage('test-message', {})
        expect(worker.childProcess!.send).toBeCalledTimes(0)
        worker.isReadyResolver(true)
        await worker.isReady
        expect(worker.childProcess!.send).toBeCalledTimes(1)
    })

    it('should not throw unhandled rejection when worker is killed before isReady resolves', async () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer())
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
    const runStartProcess = async (
        parentNodeOptions: string | undefined,
        config: Record<string, unknown> = {},
        sourceMaps?: string
    ) => {
        const originalNodeOptions = process.env.NODE_OPTIONS
        const originalSourceMaps = process.env.WDIO_SOURCE_MAPS
        if (sourceMaps === undefined) {
            delete process.env.WDIO_SOURCE_MAPS
        } else {
            process.env.WDIO_SOURCE_MAPS = sourceMaps
        }
        if (parentNodeOptions === undefined) {
            delete process.env.NODE_OPTIONS
        } else {
            process.env.NODE_OPTIONS = parentNodeOptions
        }

        forkMock.mockClear()
        try {
            const worker = new Worker(
                config as any,
                workerConfig,
                new WritableStreamBuffer(),
                new WritableStreamBuffer()
            )
            await worker.startProcess()
            return forkMock.mock.calls[0][2]?.env?.NODE_OPTIONS
        } finally {
            if (originalNodeOptions === undefined) {
                delete process.env.NODE_OPTIONS
            } else {
                process.env.NODE_OPTIONS = originalNodeOptions
            }
            if (originalSourceMaps === undefined) {
                delete process.env.WDIO_SOURCE_MAPS
            } else {
                process.env.WDIO_SOURCE_MAPS = originalSourceMaps
            }
        }
    }

    it('does not leak a literal "undefined" when the parent has no NODE_OPTIONS', async () => {
        const nodeOptions = await runStartProcess(undefined)
        expect(nodeOptions).toBeUndefined()
    })

    it('preserves parent node flags without duplicating them', async () => {
        const nodeOptions = await runStartProcess('--import tsx')
        expect(nodeOptions).toBe('--import tsx')
    })

    it('appends source maps for verbose workers without dropping parent flags', async () => {
        const nodeOptions = await runStartProcess('--import tsx', { logLevel: 'debug' })
        expect(nodeOptions).toBe('--import tsx --enable-source-maps')
    })

    it('does not duplicate --enable-source-maps when the parent already set it', async () => {
        const nodeOptions = await runStartProcess('--enable-source-maps --import tsx', { logLevel: 'trace' })
        expect(nodeOptions).toBe('--enable-source-maps --import tsx')
    })

    it('preserves worker NODE_OPTIONS set via config.runnerEnv', async () => {
        const nodeOptions = await runStartProcess(undefined, {
            logLevel: 'debug',
            runnerEnv: { NODE_OPTIONS: '--import tsx' }
        })
        expect(nodeOptions).toBe('--import tsx --enable-source-maps')
    })

    it('keeps repeated option/value pairs intact', async () => {
        const nodeOptions = await runStartProcess('--require a.js --require b.js', { logLevel: 'debug' })
        expect(nodeOptions).toBe('--require a.js --require b.js --enable-source-maps')
    })

    it('keeps launcher flags when runnerEnv replaces NODE_OPTIONS', async () => {
        const nodeOptions = await runStartProcess('--import tsx', {
            logLevel: 'debug',
            runnerEnv: { NODE_OPTIONS: '--max-old-space-size=4096' }
        })
        expect(nodeOptions).toBe('--import tsx --max-old-space-size=4096 --enable-source-maps')
    })

    it('appends source maps when WDIO_SOURCE_MAPS opts in', async () => {
        const nodeOptions = await runStartProcess('--import tsx', {}, '1')
        expect(nodeOptions).toBe('--import tsx --enable-source-maps')
    })
})
