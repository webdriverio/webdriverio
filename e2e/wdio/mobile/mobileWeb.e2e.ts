import { createServer } from 'node:http'
import { once } from 'node:events'
import type { AddressInfo } from 'node:net'
import { browser, expect } from '@wdio/globals'

const pages: Record<string, string> = {
    '/': `<p id="p">text</p>
        <button id="b" style="width: 100%; height: 100px" onclick="this.textContent = 'tapped'">tap</button>
        <input id="i">`,
    /**
     * the button is below the viewport: a click must come after the `scroll` events
     */
    '/far': `<script>
            window.scrolls = 0
            window.addEventListener('scroll', () => { window.scrolls++ })
        </script>
        <div style="height: 3000px"></div>
        <button id="far" style="width: 100%; height: 100px" onclick="window.scrollsAtClick = window.scrolls">far</button>
        <div style="height: 3000px"></div>`
}

/**
 * The browser of a mobile device (iOS Safari or Android Chrome) with Appium.
 * Local only, see `wdio.ios.conf.ts` and `wdio.android.conf.ts`.
 */
describe('mobile web', () => {
    const server = createServer((req, res) => res
        .writeHead(200, { 'content-type': 'text/html' })
        .end(`<meta name="viewport" content="width=device-width">${pages[req.url ?? '/'] ?? ''}`))
    let origin: string

    before(async () => {
        server.listen(0, '127.0.0.1')
        await once(server, 'listening')
        /**
         * an Android emulator reaches the host at 10.0.2.2, an iOS Simulator at 127.0.0.1
         */
        origin = `http://${browser.isAndroid ? '10.0.2.2' : '127.0.0.1'}:${(server.address() as AddressInfo).port}`
    })

    beforeEach(async () => {
        await browser.url(`${origin}/`)
    })

    after(() => {
        server.close()
    })

    /**
     * Appium XCUITest 12 starts with a script timeout of 0 ms (W3C: 30 s), so an
     * async script failed at once (https://github.com/webdriverio/webdriverio/issues/16137)
     */
    describe('script timeout', () => {
        it('runs an async function that waits', async () => {
            expect(await browser.execute(async () => {
                await new Promise((resolve) => setTimeout(resolve, 500))
                return 1
            })).toBe(1)
        })

        it('checks that an element is stable', async () => {
            expect(await $('#p').isStable()).toBe(true)
        })

        it('runs an async script of the protocol', async () => {
            expect(await browser.executeAsyncScript('const done = arguments[arguments.length - 1]; setTimeout(() => done(2), 500)', [])).toBe(2)
        })

        it('stops an async script after the timeout of browser.setTimeout()', async () => {
            await browser.setTimeout({ script: 1000 })
            try {
                await expect(browser.execute(async () => {
                    await new Promise((resolve) => setTimeout(resolve, 3000))
                    return 1
                })).rejects.toThrow(/script/i)
            } finally {
                await browser.setTimeout({ script: 30_000 })
            }
        })
    })

    it('taps an element', async () => {
        const button = await $('#b')
        await button.tap()
        await expect(button).toHaveText('tapped')
    })

    /**
     * Appium on iOS scrolls and clicks in one step, so the page got its `scroll`
     * events after the click (https://github.com/webdriverio/webdriverio/issues/16062)
     */
    it('clicks an element below the viewport after the scroll events of the page', async () => {
        await browser.url(`${origin}/far`)
        await $('#far').click()
        expect(await browser.execute(() => (window as unknown as { scrollsAtClick?: number }).scrollsAtClick)).toBeGreaterThan(0)
    })

    /**
     * not on iOS: WebDriverAgent accepts the key actions but types nothing into the
     * page (Appium XCUITest 12.16.0 and 12.18.3, iOS 27.0 Simulator)
     */
    it('types into an input', async function () {
        if (browser.isIOS) {
            this.skip()
        }
        await $('#i').click()
        await browser.keys(['a', 'b'])
        await expect($('#i')).toHaveValue('ab')
    })

    /**
     * Appium has no `wheel` action
     */
    describe('scroll', () => {
        it('scrolls an element into view', async () => {
            await browser.url(`${origin}/far`)
            await $('#far').scrollIntoView()
            await expect($('#far')).toBeDisplayed({ withinViewport: true })
        })

        it('scrolls the page', async () => {
            await browser.url(`${origin}/far`)
            await browser.scroll(0, 500)
            /**
             * iOS Safari: in about 1 run of 5, `scrollY` was still 0 directly after the scroll
             */
            await browser.waitUntil(async () => await browser.execute(() => window.scrollY) > 0, {
                timeout: 5000,
                timeoutMsg: 'the page did not scroll'
            })
        })
    })
})
