import url from 'node:url'
import path from 'node:path'
import { browser, $, expect } from '@wdio/globals'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

/**
 * In a WebDriver BiDi session, getHTML() adds the shadow roots to the HTML the
 * browser serialized: https://github.com/webdriverio/webdriverio/issues/16223
 */
describe('getHTML in a WebDriver BiDi session', () => {
    before(async () => {
        await browser.url(url.pathToFileURL(path.resolve(__dirname, '__fixtures__', 'getHTML.html')).href)
    })

    it('returns table parts, a template, the head, SVG and entities as the browser serialized them', async () => {
        for (const selector of ['#cell', '#header', '#row', '#tbody', '#caption', '#col', '#table', '#template', 'head', '#foreign', '#entities']) {
            const elem = await $(selector)
            const outerHTML = await browser.execute((el) => el.outerHTML, elem)
            expect(await elem.getHTML({ prettify: false })).toBe(outerHTML)
        }
    })

    it('returns the children of table parts without the tag of the element', async () => {
        const elem = await $('#row')
        const innerHTML = await browser.execute((el) => el.innerHTML, elem)
        expect(await elem.getHTML({ prettify: false, includeSelectorTag: false })).toBe(innerHTML)
    })

    it('includes the shadow root of a host, also without the tag of the host', async () => {
        const withTag = await $('#host').getHTML({ prettify: false })
        expect(withTag).toMatch(/^<open-host id="host"><span>light<\/span><template shadowrootmode="open">[\s\S]*<b>in the shadow root<\/b><slot><\/slot>[\s\S]*<\/template><\/open-host>$/)

        const withoutTag = await $('#host').getHTML({ prettify: false, includeSelectorTag: false })
        expect(withoutTag).toMatch(/^<span>light<\/span><template shadowrootmode="open">[\s\S]*<b>in the shadow root<\/b><slot><\/slot>[\s\S]*<\/template>$/)
    })

    it('leaves no shadow root id in the page', async () => {
        await $('body').getHTML()
        expect(await browser.execute(() => document.documentElement.outerHTML)).not.toContain('data-wdio-shadow-id')
        expect(await $('#host').getHTML({ pierceShadowRoot: false, prettify: false })).toBe('<open-host id="host"><span>light</span></open-host>')
    })
})
