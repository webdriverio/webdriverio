import { browser, $ } from '@wdio/globals'

import { COLORS } from './colorServer.js'

/**
 * The tests run at the same time, each in its own window, and each paints its own 2 colors
 */
const paint = async ([from, to]: readonly [string, string], wait: number) => {
    await browser.url(`${process.env.VIDEO_COLOR_ORIGIN}/${from}?to=${to}`)
    await browser.pause(wait)
    await $('#btn').click()
    await browser.pause(300)
}

describe('parallel videos', () => {
    it('red test', () => paint(COLORS['red test'], 600))
    it('blue test', () => paint(COLORS['blue test'], 100))
    describe('nested', () => {
        it('green test', () => paint(COLORS['green test'], 400))
    })
    it('yellow test', async () => {
        const [from, to] = COLORS['yellow test']
        await browser.url(`${process.env.VIDEO_COLOR_ORIGIN}/${from}?to=${to}`)
        // a tab of the test: its frames belong to the test
        const tab = await browser.newWindow(`${process.env.VIDEO_COLOR_ORIGIN}/${to}?to=${from}`, { type: 'tab' }) as WebdriverIO.BrowsingContext
        await tab.$('#btn').click()
        await tab.closeWindow()
        await $('#btn').click()
    })
})
