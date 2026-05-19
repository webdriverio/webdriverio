import path from 'node:path'
import type * as ChildProcessModule from 'node:child_process'
import { WritableStreamBuffer } from 'stream-buffers'
import { describe, expect, it, vi, beforeEach } from 'vitest'
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
})
