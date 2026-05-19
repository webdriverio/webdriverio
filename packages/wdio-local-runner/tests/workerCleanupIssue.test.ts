/**
 * Test for worker cleanup fix:
 * https://github.com/webdriverio/webdriverio/discussions/14686
 *
 * This test verifies that workers are properly force-killed when they don't
 * respond to graceful shutdown requests within the timeout.
 */
import path from 'node:path'
import type { ChildProcess } from 'node:child_process'
import type * as ChildProcessModule from 'node:child_process'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import type * as DisplayServerModule from '@wdio/display-server'
import LocalRunner from '../src/index.js'

const sleep = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms))

let childProcessMock: { on: any, send: any, kill: any, pid: number }

beforeEach(async () => {
    vi.clearAllMocks()
    // Reset the mock for each test
    childProcessMock = {
        on: vi.fn(),
        send: vi.fn(),
        kill: vi.fn(),
        pid: 12345,
    }
})

vi.mock(
    '@wdio/logger',
    () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger'))
)

vi.mock('node:child_process', async (importOriginal) => {
    const actual = await importOriginal<typeof ChildProcessModule>()
    return {
        ...actual,
        // fork() returns a fresh mock per worker so the cleanup test can spy
        // on `kill` and the IPC `send` for each child independently.
        fork: vi.fn().mockImplementation(() => ({
            on: vi.fn(),
            send: vi.fn(),
            kill: vi.fn(),
            pid: 12345,
            stdout: { pipe: vi.fn() },
            stderr: { pipe: vi.fn() },
        })),
    }
})

vi.mock('@wdio/display-server', async () => {
    const actual = await vi.importActual<typeof DisplayServerModule>('@wdio/display-server')
    return {
        ...actual,
        DisplayServerManager: vi.fn().mockImplementation(() => ({
            init: vi.fn().mockResolvedValue(true),
            shouldRun: vi.fn().mockReturnValue(true),
            injectDisplayFlags: vi.fn(),
            getDisplayServer: vi.fn().mockReturnValue(null),
        })),
        startDisplayDaemonFromConfig: vi.fn().mockResolvedValue(null),
        default: vi.fn()
    }
})

describe('Worker Cleanup', () => {

    /**
     * This test verifies the fix for issue #14686:
     * When a worker stays busy (e.g., due to a timeout with pending async operations),
     * the shutdown mechanism should force-kill the worker after timeout.
     */
    it('should force-kill busy workers on shutdown after timeout', async () => {
        const runner = new LocalRunner(
            {} as never,
            {
                outputDir: '/foo/bar',
                runnerEnv: { FORCE_COLOR: 1 },
                autoXvfb: true,
                xvfbAutoInstall: undefined,
                xvfbAutoInstallMode: undefined,
                xvfbAutoInstallCommand: undefined
            } as any
        )

        // Start a worker
        const worker = await runner.run({
            cid: '0-stuck',
            command: 'run',
            configFile: '/path/to/wdio.conf.js',
            args: {},
            caps: {},
            specs: ['/foo/bar.test.js'],
            execArgv: [],
            retries: 0,
        })

        // Simulate worker becoming ready
        worker['_handleMessage']({ name: 'ready' } as any)
        await sleep()

        // Worker is now busy
        expect(worker.isBusy).toBe(true)

        // Store reference to childProcess mock before shutdown (since kill() deletes it)
        const killMock = worker.childProcess!.kill as ReturnType<typeof vi.fn>

        // Simulate a "stuck" worker that never becomes un-busy
        // NOTE: We do NOT set worker.isBusy = false

        // Reset the kill mock to track calls during shutdown
        killMock.mockClear()

        // Shutdown the runner - this should wait for timeout then force kill
        const before = Date.now()
        await runner.shutdown()
        const after = Date.now()

        // Verify shutdown waited for the timeout (approximately 5 seconds)
        expect(after - before).toBeGreaterThanOrEqual(4500)

        // Verify stuck worker is force-killed with SIGKILL after timeout
        expect(killMock).toHaveBeenCalledWith('SIGKILL')

        // Verify worker state is properly cleaned
        expect(worker.isKilled).toBe(true)
        expect(worker.isBusy).toBe(false)
        expect(worker.childProcess).toBeUndefined()
    })
})
