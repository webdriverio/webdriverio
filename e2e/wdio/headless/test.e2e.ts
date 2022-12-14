
import type { Capabilities } from '../../../packages/wdio-types'

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

    it('should be able to use async-iterators', async () => {
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
})
