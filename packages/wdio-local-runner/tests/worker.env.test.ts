import path from 'node:path'
import type * as ChildProcessModule from 'node:child_process'
import { WritableStreamBuffer } from 'stream-buffers'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import Worker from '../src/worker.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const { forkMock } = vi.hoisted(() => ({
    forkMock: vi.fn().mockReturnValue({
        on: vi.fn(),
        stdout: { pipe: vi.fn() },
        stderr: { pipe: vi.fn() }
    }),
}))

vi.mock('node:child_process', async (importOriginal) => {
    const actual = await importOriginal<typeof ChildProcessModule>()
    return {
        ...actual,
        fork: forkMock,
    }
})

describe('Worker Env Generation', () => {
    afterEach(() => vi.unstubAllEnvs())
    beforeEach(() => {
        forkMock.mockClear()
    })

    it('should use default log name if no specs', async () => {
        const worker = new Worker({
            outputDir: '/foo/bar'
        } as any, {
            cid: '0-5',
            caps: {},
            specs: [],
            execArgv: [],
            retries: 0
        } as any, new WritableStreamBuffer(), new WritableStreamBuffer())

        await worker.startProcess()

        expect(forkMock).toHaveBeenCalled()
        const env = forkMock.mock.calls[0][2].env
        expect(env.WDIO_LOG_PATH).toBe(path.join('/foo/bar', 'wdio-0-5.log'))
    })

    it('should use spec name in log name if specs present', async () => {
        const worker = new Worker({
            outputDir: '/foo/bar'
        } as any, {
            cid: '0-5',
            caps: {},
            specs: ['/path/to/my.test.e2e.ts'],
            execArgv: [],
            retries: 0
        } as any, new WritableStreamBuffer(), new WritableStreamBuffer())

        await worker.startProcess()

        expect(forkMock).toHaveBeenCalled()
        const env = forkMock.mock.calls[0][2].env
        expect(env.WDIO_LOG_PATH).toBe(path.join('/foo/bar', 'my.test.e2e-0-5.log'))
    })

    it('should use default log name if spec is empty string', async () => {
        const worker = new Worker({
            outputDir: '/foo/bar'
        } as any, {
            cid: '0-5',
            caps: {},
            specs: [''],
            execArgv: [],
            retries: 0
        } as any, new WritableStreamBuffer(), new WritableStreamBuffer())

        await worker.startProcess()

        expect(forkMock).toHaveBeenCalled()
        const env = forkMock.mock.calls[0][2].env
        expect(env.WDIO_LOG_PATH).toBe(path.join('/foo/bar', 'wdio-0-5.log'))
    })

    it.each([1, 2])('uses spawn attempt %i for logs without changing the worker id', async (attempt) => {
        vi.stubEnv('WDIO_WORKER_LOG_ID', 'inherited-stale-id')
        vi.stubEnv('WDIO_WORKER_ID', 'inherited-stale-cid')
        const worker = new Worker({
            outputDir: '/foo/bar',
            runnerEnv: { WDIO_WORKER_LOG_ID: 'configured-stale-id', WDIO_WORKER_ID: 'configured-stale-cid' }
        } as any, {
            cid: '0-5', caps: {}, specs: ['/path/to/my.test.e2e.ts'], execArgv: [], retries: -1
        }, new WritableStreamBuffer(), new WritableStreamBuffer())
        worker.logFileAttempt = attempt
        await worker.startProcess()
        const env = forkMock.mock.calls[0][2].env
        expect(env.WDIO_WORKER_ID).toBe('0-5')
        expect(env.WDIO_WORKER_LOG_ID).toBe(`0-5-${attempt}`)
        expect(env.WDIO_LOG_PATH).toBe(path.join('/foo/bar', `my.test.e2e-0-5-${attempt}.log`))
    })
})
