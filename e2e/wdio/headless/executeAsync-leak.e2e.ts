import { browser, expect } from '@wdio/globals'
import logger from '@wdio/logger'

const log = logger('test')

function getHeapUsage() {
    return process.memoryUsage().heapUsed / 1024 / 1024
}

describe('`executeAsync` memory leak check', () => {
    it('repeated identical `executeAsync` script should not lead to memory leak', async () => {
        await browser.url('https://example.com/')
        // @ts-ignore
        globalThis.gc()
        const initialHeapUsage = getHeapUsage()
        log.debug(`Initial heap usage ${initialHeapUsage.toFixed(2)} MiB`)
        let heapUsage = 0
        for (let i = 0; i < 50; i++) {
            await browser.executeAsync(
                `callback = arguments[arguments.length - 1];
                let foo = "${'A'.repeat(2_000_000)}";
                callback();
            `)
            heapUsage = getHeapUsage()
            log.debug(`[${i.toString().padStart(2, '0')}] Heap usage ${heapUsage.toFixed(2)} MiB`)
        }
        // @ts-ignore
        globalThis.gc()
        const finalHeapUsage = getHeapUsage()
        log.debug(`Final heap usage ${finalHeapUsage.toFixed(2)} MiB`)
        await expect(finalHeapUsage).not.toBeGreaterThan(2 * initialHeapUsage)
    })
})
