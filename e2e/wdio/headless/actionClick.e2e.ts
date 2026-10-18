import fs from 'node:fs'
import url from 'node:url'
import path from 'node:path'
import { createServer, type Server } from 'node:http'
import { once } from 'node:events'
import type { AddressInfo } from 'node:net'
import { browser, $, expect } from '@wdio/globals'
import { Key } from 'webdriverio'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

const FIXTURE = fs.readFileSync(path.resolve(__dirname, '__fixtures__', 'actionClick.html'), 'utf8')

interface Click {
    type: string
    target: string
    dx: number
    dy: number
    shiftKey: boolean
}

interface Setup {
    header?: boolean
    footer?: boolean
    wide?: boolean
    scrollY?: number
}

interface Fixture {
    clicks: Click[]
    events: string[]
    reset (setup: Setup): Promise<void>
}

/**
 * Clicks `elem` (with `options`, or without options when it is `undefined`) and gives
 * the events the page received, with the offset of the pointer from the center of the
 * element that got them, and the order of the `scroll` and `click` events.
 */
async function clickAndRecord (elem: ReturnType<typeof $>, options: Parameters<WebdriverIO.Element['click']>[0], setup: Setup = {}) {
    await browser.execute((setup) => (window as unknown as Fixture).reset(setup), setup)
    const scrollY = await browser.execute(() => window.scrollY)
    await elem.click(options)
    // give a late scroll event the time to come
    const result = await browser.execute(() => new Promise<{ clicks: Click[], events: string[], scrollY: number }>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => {
            const fixture = window as unknown as Fixture
            resolve({ clicks: fixture.clicks, events: fixture.events, scrollY: window.scrollY })
        }))
    }))
    return { clicks: result.clicks, events: result.events, scrolledY: result.scrollY - scrollY }
}

/**
 * the page scrolled, and got all its scroll events before the click, as with a user
 */
function expectScrollEventsBeforeTheClick (events: string[]) {
    expect(events).toContain('scroll')
    expect(events.indexOf('click')).toBe(events.length - 1)
}

/**
 * `click()` with options sends pointer actions. Actions don't scroll the element
 * into view, and the pointer goes to the center of the element's box clipped by
 * the window only. WebdriverIO brings the element under the pointer first, see
 * https://github.com/webdriverio/webdriverio/issues/14840
 */
describe('click with options', () => {
    let server: Server

    /**
     * served over HTTP: Safari doesn't open a `file://` page
     */
    before(async () => {
        server = createServer((_, response) => {
            response.setHeader('Content-Type', 'text/html; charset=utf-8')
            response.end(FIXTURE)
        })
        server.listen(0, '127.0.0.1')
        await once(server, 'listening')
        await browser.url(`http://127.0.0.1:${(server.address() as AddressInfo).port}/`)
    })

    after(async () => {
        const closed = new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
        server.closeAllConnections()
        await closed
    })

    it('clicks an element that is already under the pointer without scrolling', async () => {
        const { clicks, scrolledY } = await clickAndRecord($('#visible'), {})
        expect(clicks).toEqual([{ type: 'click', target: 'visible', dx: 0, dy: 0, shiftKey: false }])
        expect(scrolledY).toBe(0)
    })

    it('clicks an element that a horizontal scroll container hides (#14840)', async () => {
        const { clicks } = await clickAndRecord($('#hclip'), {})
        expect(clicks).toEqual([{ type: 'click', target: 'hclip', dx: 0, dy: 0, shiftKey: false }])
    })

    it('keeps the offset and the button', async () => {
        const offset = await clickAndRecord($('#hclip'), { x: 30, y: 5 })
        expect(offset.clicks).toEqual([{ type: 'click', target: 'hclip', dx: 30, dy: 5, shiftKey: false }])

        const right = await clickAndRecord($('#hclip'), { button: 'right' })
        expect(right.clicks).toEqual([{ type: 'contextmenu', target: 'hclip', dx: 0, dy: 0, shiftKey: false }])
    })

    it('keeps the offset from the center of an element that the window clips', async () => {
        const top = await browser.execute(() => document.getElementById('partial')!.getBoundingClientRect().top + window.scrollY)
        const { clicks } = await clickAndRecord($('#partial'), { y: 40 }, { scrollY: top + 40 })
        expect(clicks.map(({ target }) => target)).toEqual(['partial'])
        /**
         * the element is scrolled to the center, which can be half a pixel: Firefox 156
         * rounds it and clicks 1 px off. Counted from the clipped center, the click was
         * 40 px off.
         */
        expect(Math.abs(clicks[0].dy - 40)).toBeLessThanOrEqual(1)
    })

    it('keeps a key that the test holds (Shift-click)', async () => {
        await browser.action('key').down(Key.Shift).perform(true)
        try {
            const { clicks } = await clickAndRecord($('#hclip'), { skipRelease: true })
            expect(clicks.map(({ target, shiftKey }) => ({ target, shiftKey }))).toEqual([{ target: 'hclip', shiftKey: true }])
        } finally {
            await browser.releaseActions()
        }
    })

    it('clicks a hidden element in a container with smooth scrolling', async () => {
        const { clicks } = await clickAndRecord($('#smooth-clip'), {})
        expect(clicks.map(({ target }) => target)).toEqual(['smooth-clip'])
    })

    it('clicks an element that a vertical scroll container hides', async () => {
        const { clicks } = await clickAndRecord($('#vclip'), {})
        expect(clicks.map(({ target }) => target)).toEqual(['vclip'])
    })

    it('clicks an element that an overflow: hidden container hides', async () => {
        const { clicks } = await clickAndRecord($('#hidden-clip'), {})
        expect(clicks.map(({ target }) => target)).toEqual(['hidden-clip'])
    })

    it('clicks a hidden element through a child that gets the event', async () => {
        const { clicks } = await clickAndRecord($('#with-child'), {})
        expect(clicks.map(({ target }) => target)).toEqual(['child'])
    })

    it('clicks a hidden element in a shadow root', async () => {
        const { clicks } = await clickAndRecord($('#host').shadow$('#shadow-clip'), {})
        expect(clicks.map(({ target }) => target)).toEqual(['shadow-clip'])
    })

    it('clicks an element below the window', async () => {
        const { clicks, scrolledY } = await clickAndRecord($('#far'), {})
        expect(clicks.map(({ target }) => target)).toEqual(['far'])
        expect(scrolledY).toBeGreaterThan(0)
    })

    it('clicks an element that a container hides in both directions', async () => {
        const { clicks } = await clickAndRecord($('#both'), {})
        expect(clicks.map(({ target }) => target)).toEqual(['both'])
    })

    it('clicks an element in a scroll container whose sticky header covers its center', async () => {
        const { clicks } = await clickAndRecord($('#under-sticky'), {})
        expect(clicks.map(({ target }) => target)).toEqual(['under-sticky'])
    })

    it('clicks an element in a scroll container below the window', async () => {
        const { clicks, scrolledY } = await clickAndRecord($('#below'), {})
        expect(clicks.map(({ target }) => target)).toEqual(['below'])
        expect(scrolledY).toBeGreaterThan(0)
    })

    /**
     * Scrolled just into view, the element is at the bottom edge of the window, where
     * Safari shows its overlay scrollbar after the scroll: the scrollbar took the click.
     * Whether the scrollbar shows depends on the scrolls before (in this spec, the click
     * failed only without the tests above), so the test also checks that the element is
     * away from the edges.
     */
    it('clicks an element below and right of the window, away from the window edges', async () => {
        const { clicks } = await clickAndRecord($('#wide'), {}, { wide: true })
        expect(clicks.map(({ target }) => target)).toEqual(['wide'])

        const space = await browser.execute(() => {
            const rect = document.getElementById('wide')!.getBoundingClientRect()
            return Math.min(window.innerWidth - rect.right, window.innerHeight - rect.bottom)
        })
        expect(space).toBeGreaterThanOrEqual(30)
    })

    it('gives the page its scroll events before the click', async () => {
        const container = await clickAndRecord($('#hclip'), {})
        expect(container.clicks.map(({ target }) => target)).toEqual(['hclip'])
        expectScrollEventsBeforeTheClick(container.events)

        const page = await clickAndRecord($('#below'), {})
        expect(page.clicks.map(({ target }) => target)).toEqual(['below'])
        expectScrollEventsBeforeTheClick(page.events)
    })

    it('does not click a fixed footer that covers the element after it is scrolled into view', async () => {
        const { clicks } = await clickAndRecord($('#far'), {}, { footer: true })
        expect(clicks.map(({ target }) => target)).toEqual(['far'])
    })

    it('does not click a fixed header that covers the element after it is scrolled into view', async () => {
        const { clicks } = await clickAndRecord($('#far'), {}, { header: true, scrollY: 100000 })
        expect(clicks.map(({ target }) => target)).toEqual(['far'])
    })
})

/**
 * `click()` without options sends the WebDriver Element Click command: the driver
 * scrolls the element into view and clicks it. geckodriver does both in one step, so
 * the page got its scroll events after the click. In Firefox, WebdriverIO brings the
 * element into view first.
 */
describe('click without options', () => {
    let server: Server

    before(async () => {
        server = createServer((_, response) => {
            response.setHeader('Content-Type', 'text/html; charset=utf-8')
            response.end(FIXTURE)
        })
        server.listen(0, '127.0.0.1')
        await once(server, 'listening')
        await browser.url(`http://127.0.0.1:${(server.address() as AddressInfo).port}/`)
    })

    after(async () => {
        const closed = new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
        server.closeAllConnections()
        await closed
    })

    /**
     * Only Firefox gets the extra request. ChromeDriver gave the click before the scroll
     * events about once in 300 clicks, safaridriver never, so they keep the plain command
     * and the test checks only the clicked element there.
     */
    it('gives the page its scroll events before the click in Firefox', async () => {
        for (const [selector, target] of [['#hclip', 'hclip'], ['#below', 'below']]) {
            const { clicks, events } = await clickAndRecord($(selector), undefined)
            expect(clicks.map(({ target }) => target)).toEqual([target])
            if (browser.isFirefox) {
                expectScrollEventsBeforeTheClick(events)
            }
        }
    })

    /**
     * safaridriver scrolls the element to the center, under the header, and says "click
     * intercepted": WebdriverIO brings it under the pointer and clicks again
     */
    it('clicks an element in a scroll container whose sticky header covers its center', async () => {
        const { clicks } = await clickAndRecord($('#under-sticky'), undefined)
        expect(clicks.map(({ target }) => target)).toEqual(['under-sticky'])
    })

    it('clicks an element below the window and a fixed footer', async () => {
        const { clicks } = await clickAndRecord($('#far'), undefined, { footer: true })
        expect(clicks.map(({ target }) => target)).toEqual(['far'])
    })
})
