import type { Capabilities } from '../../../packages/wdio-types'

const SCROLL_MARGIN_TRESHOLD = 25

describe('main suite 1', () => {
    it('foobar test', async () => {
        const browserName = (browser.capabilities as Capabilities.Capabilities).browserName
        await browser.url('http://guinea-pig.webdriver.io/')
        await expect((await $('#useragent').getText()).toLowerCase()).toContain(browserName)
    })

    it('should allow to check for PWA', async () => {
        await browser.url('https://webdriver.io')
        await browser.pause(100)
        expect((await browser.checkPWA([
            'isInstallable',
            'splashScreen',
            'themedOmnibox',
            'contentWith',
            'viewport',
            'appleTouchIcon',
            'maskableIcon'
        ])).passed).toBe(true)
    })

    it('should also detect non PWAs', async () => {
        await browser.url('https://json.org')
        expect((await browser.checkPWA()).passed).toBe(false)
    })

    it('can query shadow elements', async () => {
        await browser.url('https://the-internet.herokuapp.com/shadowdom')
        await $('h1').waitForDisplayed()
        await expect($('>>>ul[slot="my-text"] li:last-child')).toHaveText('In a list!')
    })

    it.skip('should be able to use async-iterators', async () => {
        await browser.url('https://webdriver.io')
        const contributeLink = await browser.$$('a.navbar__item.navbar__link').find<WebdriverIO.Element>(
            async (link) => await link.getText() === 'Contribute')
        await contributeLink.click()
        await expect(browser).toHaveTitle('Contribute | WebdriverIO')
    })

    /**
     * fails due to "Unable to identify the main resource"
     * https://github.com/webdriverio/webdriverio/issues/8541
     */
    it.skip('should allow to do performance tests', async () => {
        await browser.enablePerformanceAudits()
        await browser.url('http://json.org')
        const metrics = await browser.getMetrics()
        expect(typeof metrics.serverResponseTime).toBe('number')
        expect(typeof metrics.domContentLoaded).toBe('number')
        expect(typeof metrics.firstVisualChange).toBe('number')
        expect(typeof metrics.firstPaint).toBe('number')
        expect(typeof metrics.firstContentfulPaint).toBe('number')
        expect(typeof metrics.firstMeaningfulPaint).toBe('number')
        expect(typeof metrics.largestContentfulPaint).toBe('number')
        expect(typeof metrics.lastVisualChange).toBe('number')
        expect(typeof metrics.interactive).toBe('number')
        expect(typeof metrics.load).toBe('number')
        expect(typeof metrics.speedIndex).toBe('number')
        expect(typeof metrics.totalBlockingTime).toBe('number')
        expect(typeof metrics.maxPotentialFID).toBe('number')
        expect(typeof metrics.cumulativeLayoutShift).toBe('number')
        const score = await browser.getPerformanceScore()
        expect(typeof score).toBe('number')
    })

    it('should be able to scroll up and down', async () => {
        await browser.url('https://webdriver.io/')
        const currentScrollPosition = await browser.execute(() => [
            window.scrollX, window.scrollY
        ])
        expect(currentScrollPosition).toEqual([0, 0])
        await $('footer').scrollIntoView()
        await browser.pause(500)
        const [x, y] = await browser.execute(() => [
            window.scrollX, window.scrollY
        ])
        expect(y).toBeGreaterThan(100)

        // should scroll relative to current position
        browser.scroll(0, 0)
        await browser.pause(500)
        const sameScrollPosition = await browser.execute(() => [
            window.scrollX, window.scrollY
        ])
        expect(sameScrollPosition).toEqual([x, y])

        browser.scroll(0, -y)
        const oldScrollPosition = await browser.execute(() => [
            window.scrollX, window.scrollY
        ])
        expect(oldScrollPosition).toEqual([x, y])
    })

    /**
     * ToDo(Christian): Fix this test
     */
    it.skip('should be able to handle successive scrollIntoView', async () => {
        await browser.url('http://guinea-pig.webdriver.io')
        await browser.setWindowSize(500, 500)
        const searchInput = await $('.searchinput')

        const scrollAndCheck = async (params?: ScrollIntoViewOptions | boolean) => {
            await searchInput.scrollIntoView(params)
            await browser.pause(500)
            const [wdioX, wdioY] = await browser.execute(() => [
                window.scrollX, window.scrollY
            ])

            await browser.execute((elem, _params) => elem.scrollIntoView(_params), searchInput, params)
            await browser.pause(500)
            const [windowX, windowY] = await browser.execute(() => [
                window.scrollX, window.scrollY
            ])

            const failureMessage = `scrollIntoView failed, expected ${[wdioX, wdioY]} to equal ${[windowX, windowY]} ±10px`
            expect(Math.abs(wdioX - windowX)).toBeLessThan(SCROLL_MARGIN_TRESHOLD, failureMessage)
            expect(Math.abs(wdioY - windowY)).toBeLessThan(SCROLL_MARGIN_TRESHOLD, failureMessage)
        }

        await scrollAndCheck({ block: 'nearest', inline: 'nearest' })
        await scrollAndCheck()
        await scrollAndCheck({ block: 'center', inline: 'center' })
        await scrollAndCheck({ block: 'start', inline: 'start' })
        await scrollAndCheck({ block: 'end', inline: 'end' })
        await scrollAndCheck(true)
        await scrollAndCheck({ block: 'nearest', inline: 'nearest' })
    })

    it('can reload a session', async () => {
        const sessionId = browser.sessionId
        await browser.reloadSession()
        expect(browser.sessionId).not.toBe(sessionId)
    })
})
