import path from 'node:path'
import type { ChildProcess } from 'node:child_process'
import { WritableStreamBuffer } from 'stream-buffers'
import { describe, expect, it, vi } from 'vitest'

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
})
