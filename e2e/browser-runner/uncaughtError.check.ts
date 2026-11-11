import { expect } from '@wdio/globals'

/**
 * Run by `checkUncaughtError.mjs`, not by the component test globs: test 2
 * fails on purpose. Mocha must report the uncaught error on test 2 only, and
 * still run tests 1 and 3 (#14216).
 */
describe('uncaught error during a test', () => {
    it('passes before the uncaught error', async () => {
        await expect(document.title).toBe('WebdriverIO Browser Test')
    })

    it('fails with the uncaught error', async () => {
        setTimeout(() => {
            throw new Error('uncaught error in test 2')
        }, 10)
        await new Promise((resolve) => setTimeout(resolve, 300))
    })

    it('still runs after the uncaught error', async () => {
        // the runner checks the browser errors every 500 ms
        await new Promise((resolve) => setTimeout(resolve, 1500))
        await expect(document.title).toBe('WebdriverIO Browser Test')
    })
})
