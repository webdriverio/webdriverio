import { browser, expect } from '@wdio/globals'

import { log, logScreenshot, page, snap } from './parallelEvents.js'

const tag = (title?: string) => title?.match(/^(T\d+)/)?.[1] ?? '?'

/**
 * The tests run at the same time, each in its own window. The pauses make each test
 * send events while other tests run.
 */
describe('html reporter parallel', () => {
    let late: Promise<void> | undefined
    beforeEach(function () {
        log(`HB:${tag(this.currentTest?.title)}`)
    })
    afterEach(async function () {
        log(`HA:${tag(this.currentTest?.title)}`)
        // the late log of T6 comes after its test:end, but before the run ends
        if (tag(this.currentTest?.title) === 'T6') {
            await late
        }
    })

    it('T1 logs after the other tests start', async () => {
        log('T1:start')
        await page('ff0000')
        await browser.pause(900)
        await logScreenshot('T1')
        log('T1:end')
    })
    it('T2 fails', async () => {
        log('T2:start')
        await page('0000ff')
        await browser.pause(300)
        await snap('T2')
        log('T2:end')
        await expect(browser).toHaveTitle('not the title', { wait: 200 })
    })
    it('T3 ends first', async () => {
        log('T3:start')
        await page('00ff00')
        await snap('T3')
        log('T3:end')
    })
    describe('nested', () => {
        it('T4 is nested', async () => {
            log('T4:start')
            await page('ffff00')
            await browser.pause(700)
            await logScreenshot('T4')
            log('T4:end')
        })
    })
    it('T5 takes screenshots at the same time', async () => {
        log('T5:start')
        await page('c0c0c0')
        await Promise.all([1, 2, 3, 4, 5].map(() => snap('T5')))
        log('T5:end')
    })
    it('T6 logs after its end', async () => {
        log('T6:start')
        await page('0080ff')
        late = new Promise((resolve) => setTimeout(() => {
            log('T6:late')
            resolve()
        }, 300))
        log('T6:end')
    })
    it('T7 opens a window', async () => {
        log('T7:start')
        await page('ffa500')
        await browser.newWindow(`${process.env.HTML_COLOR_ORIGIN}/80ff00`)
        await browser.pause(300)
        await snap('T7')
        log('T7:end')
    })
})
