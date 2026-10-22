import { browser } from '@wdio/globals'

import { page } from './parallelEvents.js'

/**
 * The `afterEach` of T21 fails while T22 runs, and T22 fails after it: the report must
 * count the failed hook, which no failed test shows
 */
describe('html reporter parallel hooks', () => {
    afterEach(function () {
        if (this.currentTest?.title.startsWith('T21')) {
            throw new Error('afterEach fails for T21')
        }
    })
    it('T21 passes, its afterEach fails', async () => {
        await page('800000')
        await browser.pause(100)
    })
    it('T22 fails later', async () => {
        await page('000080')
        await browser.pause(800)
        throw new Error('T22 fails')
    })
})
