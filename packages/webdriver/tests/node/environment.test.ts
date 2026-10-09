import { describe, it, expect, vi, afterEach } from 'vitest'

/**
 * `deleteSession` keeps the log file of a testrunner worker open when
 * `environment.value.variables.WDIO_WORKER_ID` is set (`src/command.ts`).
 * The Node.js environment has to fill it from the worker's process environment,
 * otherwise the worker reopens `WDIO_LOG_PATH`, which then points at the
 * launcher's `wdio.log`, and empties it.
 */
describe('Node.js environment variables', () => {
    const workerId = process.env.WDIO_WORKER_ID

    afterEach(() => {
        if (workerId === undefined) {
            delete process.env.WDIO_WORKER_ID
        } else {
            process.env.WDIO_WORKER_ID = workerId
        }
        vi.resetModules()
    })

    async function loadVariables () {
        vi.resetModules()
        await import('../../src/node.js')
        const { environment } = await import('../../src/environment.js')
        return environment.value.variables
    }

    it('reads WDIO_WORKER_ID from the worker process', async () => {
        process.env.WDIO_WORKER_ID = '0-3'
        expect((await loadVariables()).WDIO_WORKER_ID).toBe('0-3')
    })

    it('has no WDIO_WORKER_ID outside a worker', async () => {
        delete process.env.WDIO_WORKER_ID
        expect((await loadVariables()).WDIO_WORKER_ID).toBeUndefined()
    })
})
