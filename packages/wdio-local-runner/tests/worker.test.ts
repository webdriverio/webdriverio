import type { ChildProcess } from 'child_process'
import { WritableStreamBuffer } from 'stream-buffers'

import logger from '@wdio/logger'

import Worker from '../src/worker'
import type { WorkerMessage } from '../src/types'

const expect = global.expect as unknown as jest.Expect

const workerConfig = {
    cid: '0-3',
    configFile: '/foobar',
    caps: {},
    specs: ['/some/spec'],
    execArgv: [],
    retries: 0
}

describe('handleMessage', () => {
    it('should emit payload with cid', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer())
        worker.emit = jest.fn()

        worker['_handleMessage']({ foo: 'bar' } as unknown as WorkerMessage)
        expect(worker.emit).toBeCalledWith('message', {
            foo: 'bar',
            cid: '0-3'
        })
    })

    it('should un mark worker as busy if command is finished', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer())
        worker.isBusy = true
        worker['_handleMessage']({ name: 'finisedCommand' } as unknown as WorkerMessage)
        expect(worker.isBusy).toBe(false)
    })

    it('stores sessionId and connection data to worker instance', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer())
        worker.emit = jest.fn()
        const payload = {
            name: 'sessionStarted',
            content: {
                sessionId: 'abc123',
                bar: 'foo'
            }
        }
        worker['_handleMessage'](payload as unknown as WorkerMessage)
        expect(worker.sessionId).toEqual('abc123')
        expect(payload.content.sessionId).toBe(undefined)
        expect(worker.emit).not.toBeCalled()
    })

    it('stores instances to worker instance in Multiremote mode', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer())
        const payload = {
            name: 'sessionStarted',
            content: {
                instances: { foo: { sessionId: 'abc123' } },
                isMultiremote: true
            }
        }
        worker['_handleMessage'](payload as unknown as WorkerMessage)
        expect(worker.instances).toEqual({ foo: { sessionId: 'abc123' } })
        expect(worker.isMultiremote).toEqual(true)
    })

    it('handle debug command called within worker process', async () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer())
        worker.emit = jest.fn()
        worker.childProcess = { send: jest.fn() } as unknown as ChildProcess
        worker['_handleMessage']({
            origin: 'debugger',
            name: 'start',
            content: {},
            params: {}
        })
        await new Promise((resolve) => setTimeout(resolve, 200))

        const expectedMessage = {
            origin: 'debugger',
            name: 'stop'
        }
        expect(worker.emit).toBeCalledWith('message', expectedMessage)
        expect(worker.childProcess.send).toBeCalledWith(expectedMessage)
    })
})

describe('handleError', () => {
    it('should emit error', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer())
        worker.emit = jest.fn()
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
        const childProcess = { kill: jest.fn() }
        worker.childProcess = childProcess as unknown as ChildProcess
        worker.isBusy = true
        worker.emit = jest.fn()
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

describe('postMessage', () => {
    it('should log if the cid is busy and exit', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer())
        const log = logger('webdriver')
        jest.spyOn(log, 'info').mockImplementation((string) => string)

        worker.isBusy = true
        worker.postMessage('test-message', {})

        expect(log.info)
            .toHaveBeenCalledWith('worker with cid 0-3 already busy and can\'t take new commands')
    })

    it('should create a process if it does not have one', () => {
        const worker = new Worker({} as any, workerConfig, new WritableStreamBuffer(), new WritableStreamBuffer())
        worker.childProcess = undefined
        jest.spyOn(worker, 'startProcess').mockImplementation(
            () => ({ send: jest.fn() }) as unknown as ChildProcess)
        worker.postMessage('test-message', {})

        expect(worker.startProcess).toHaveBeenCalled()
        expect(worker.isBusy).toBeTruthy()

        ;(worker.startProcess as jest.Mock).mockRestore()
    })
})
