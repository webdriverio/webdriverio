import url from 'node:url'
import path from 'node:path'
import { browser, $, expect } from '@wdio/globals'
import { Key } from 'webdriverio'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

const FIXTURE = url.pathToFileURL(path.resolve(__dirname, '__fixtures__', 'actionClick.html')).href

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
    scrollY?: number
}

interface Fixture {
    clicks: Click[]
    reset (setup: Setup): void
}

/**
 * Clicks `elem` with options and gives the events the page received, with the
 * offset of the pointer from the center of the element that got them.
 */
async function clickWithOptions (elem: ReturnType<typeof $>, options: Parameters<WebdriverIO.Element['click']>[0], setup: Setup = {}) {
    await browser.execute((setup) => (window as unknown as Fixture).reset(setup), setup)
    const scrollY = await browser.execute(() => window.scrollY)
    await elem.click(options)
    const result = await browser.execute(() => ({ clicks: (window as unknown as Fixture).clicks, scrollY: window.scrollY }))
    return { clicks: result.clicks, scrolledY: result.scrollY - scrollY }
}

/**
 * `click()` with options sends pointer actions. Actions don't scroll the element
 * into view, and the pointer goes to the center of the element's box clipped by
 * the window only. WebdriverIO brings the element under the pointer first, see
 * https://github.com/webdriverio/webdriverio/issues/14840
 */
describe('click with options', () => {
    before(async () => {
        await browser.url(FIXTURE)
    })

    it('clicks an element that is already under the pointer without scrolling', async () => {
        const { clicks, scrolledY } = await clickWithOptions($('#visible'), {})
        expect(clicks).toEqual([{ type: 'click', target: 'visible', dx: 0, dy: 0, shiftKey: false }])
        expect(scrolledY).toBe(0)
    })

    it('clicks an element that a horizontal scroll container hides (#14840)', async () => {
        const { clicks } = await clickWithOptions($('#hclip'), {})
        expect(clicks).toEqual([{ type: 'click', target: 'hclip', dx: 0, dy: 0, shiftKey: false }])
    })

    it('keeps the offset and the button', async () => {
        const offset = await clickWithOptions($('#hclip'), { x: 30, y: 5 })
        expect(offset.clicks).toEqual([{ type: 'click', target: 'hclip', dx: 30, dy: 5, shiftKey: false }])

        const right = await clickWithOptions($('#hclip'), { button: 'right' })
        expect(right.clicks).toEqual([{ type: 'contextmenu', target: 'hclip', dx: 0, dy: 0, shiftKey: false }])
    })

    it('keeps a key that the test holds (Shift-click)', async () => {
        await browser.action('key').down(Key.Shift).perform(true)
        try {
            const { clicks } = await clickWithOptions($('#hclip'), { skipRelease: true })
            expect(clicks.map(({ target, shiftKey }) => ({ target, shiftKey }))).toEqual([{ target: 'hclip', shiftKey: true }])
        } finally {
            await browser.releaseActions()
        }
    })

    it('clicks a hidden element in a container with smooth scrolling', async () => {
        const { clicks } = await clickWithOptions($('#smooth-clip'), {})
        expect(clicks.map(({ target }) => target)).toEqual(['smooth-clip'])
    })

    it('clicks an element that a vertical scroll container hides', async () => {
        const { clicks } = await clickWithOptions($('#vclip'), {})
        expect(clicks.map(({ target }) => target)).toEqual(['vclip'])
    })

    it('clicks an element that an overflow: hidden container hides', async () => {
        const { clicks } = await clickWithOptions($('#hidden-clip'), {})
        expect(clicks.map(({ target }) => target)).toEqual(['hidden-clip'])
    })

    it('clicks a hidden element through a child that gets the event', async () => {
        const { clicks } = await clickWithOptions($('#with-child'), {})
        expect(clicks.map(({ target }) => target)).toEqual(['child'])
    })

    it('clicks a hidden element in a shadow root', async () => {
        const { clicks } = await clickWithOptions($('#host').shadow$('#shadow-clip'), {})
        expect(clicks.map(({ target }) => target)).toEqual(['shadow-clip'])
    })

    it('clicks an element below the window', async () => {
        const { clicks, scrolledY } = await clickWithOptions($('#far'), {})
        expect(clicks.map(({ target }) => target)).toEqual(['far'])
        expect(scrolledY).toBeGreaterThan(0)
    })

    it('does not click a fixed footer that covers the element after it is scrolled into view', async () => {
        const { clicks } = await clickWithOptions($('#far'), {}, { footer: true })
        expect(clicks.map(({ target }) => target)).toEqual(['far'])
    })

    it('does not click a fixed header that covers the element after it is scrolled into view', async () => {
        const { clicks } = await clickWithOptions($('#far'), {}, { header: true, scrollY: 100000 })
        expect(clicks.map(({ target }) => target)).toEqual(['far'])
    })
})
