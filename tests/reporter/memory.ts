import { writeHeapSnapshot } from 'node:v8'
import { browser, expect } from '@wdio/globals'
import logger from '@wdio/logger'

const log = logger('test')
const executeCalls = 10
const scriptSize = 2_000_000 // ~2 MiB

function getHeapUsageMiB() {
    return process.memoryUsage().heapUsed / 1024 / 1024
}

function heapSnapshot() {
    if (process.env.WRITE_HEAP_SNAPSHOTS === 'true') {
        return writeHeapSnapshot(undefined, { exposeInternals: true, exposeNumericValues: true })
    }
    return ''
}

describe('`execute` memory leak check', () => {
    it('repeated large `execute` scripts should not lead to memory leak', async () => {
        // @ts-expect-error mock feature
        const nockReset = await browser.executeMemLeakScenario(executeCalls)
        // @ts-expect-error gc is exposed
        globalThis.gc()
        const initialHeapUsage = getHeapUsageMiB()
        log.debug(`Initial heap usage ${initialHeapUsage.toFixed(2)} MiB (${heapSnapshot()})`)
        let heapUsage = 0
        for (let i = 0; i < executeCalls; i++) {
            // use `scriptSize + i` to make each script unique
            await browser.execute(`{ let foo = "${'a'.repeat(scriptSize + i)}"; }`)
            heapUsage = getHeapUsageMiB()
            log.debug(`[${i.toString().padStart(2, '0')}] Heap usage ${heapUsage.toFixed(2)} MiB`)
        }
        nockReset()
        globalThis.gc?.()
        const finalHeapUsage = getHeapUsageMiB()
        log.debug(`Final heap usage ${finalHeapUsage.toFixed(2)} MiB (${heapSnapshot()})`)
        // 5% for variability / v8 internals + script size once due to nock interceptor leaking the last request+response (despite nockReset)
        await expect(finalHeapUsage).toBeLessThanOrEqual(1.05 * initialHeapUsage + scriptSize / 1024 / 1024)
    })
})
