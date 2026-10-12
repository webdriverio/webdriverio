import { createServer, type Server } from 'node:http'
import { once } from 'node:events'
import type { AddressInfo } from 'node:net'
import { browser, $, $$, expect } from '@wdio/globals'

const PAGE = `
<title>Missing list item</title>
<ul id="list"><li>a</li><li>b</li><li>c</li></ul>
<ul id="late"></ul>
<div id="host"></div>
<script>
    document.getElementById('host').attachShadow({ mode: 'open' }).innerHTML = '<p>in shadow</p>'
    window.renderLate = () => setTimeout(() => {
        document.getElementById('late').innerHTML = '<li>a</li><li>b</li><li>c</li>'
    }, 300)
</script>
`

const WAIT = 1000
const errorOf = (promise: Promise<unknown>) => promise.then(() => undefined, (e: Error) => e)

/**
 * An index that the list of `$$` never reaches gives a "not found" element after
 * `waitforTimeout`, like `$('.missing')`: check commands and negative matchers work, and
 * a command that needs the element throws "Index out of bounds" (#12576).
 */
describe('an index that the list of $$ never reaches', () => {
    let server: Server
    let waitforTimeout: number | undefined

    before(async () => {
        server = createServer((_, response) => {
            response.setHeader('Content-Type', 'text/html; charset=utf-8')
            response.end(PAGE)
        })
        server.listen(0, '127.0.0.1')
        await once(server, 'listening')
        waitforTimeout = browser.options.waitforTimeout
        browser.options.waitforTimeout = WAIT
    })

    beforeEach(async () => {
        await browser.url(`http://127.0.0.1:${(server.address() as AddressInfo).port}/`)
    })

    after(async () => {
        browser.options.waitforTimeout = waitforTimeout
        const closed = new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
        server.closeAllConnections()
        await closed
    })

    it('gives a not found element instead of an error', async () => {
        const item = await $$('#list li')[5]
        expect(item.elementId).toBeUndefined()
        expect(item.index).toBe(5)
        expect(item.error?.message).toBe('Index out of bounds! $$(#list li) returned only 3 elements.')
    })

    it('gives false for isDisplayed and isExisting', async () => {
        expect(await $$('#list li')[5].isDisplayed()).toBe(false)
        expect(await $$('#list li')[5].isExisting()).toBe(false)
    })

    it('resolves a reverse wait', async () => {
        expect(await $$('#list li')[5].waitForDisplayed({ reverse: true })).toBe(true)
    })

    it('passes the negative matchers of the issue', async () => {
        await expect($$('#list li')[5]).not.toBeDisplayed()
        await expect($$('#list li')[5]).not.toExist()
    })

    it('throws "Index out of bounds" for a command that needs the element, after one wait', async () => {
        const started = Date.now()
        const error = await errorOf($$('#list li')[5].click())
        const elapsed = Date.now() - started

        expect(error?.message).toContain('Index out of bounds! $$(#list li) returned only 3 elements.')
        /**
         * the index waits once; the implicit wait of the command does not wait again
         */
        expect(elapsed).toBeGreaterThanOrEqual(WAIT)
        expect(elapsed).toBeLessThan(2 * WAIT)
    })

    it('gives the same not found element for shadow$$', async () => {
        expect(await $('#host').shadow$$('p')[2].isDisplayed()).toBe(false)
        const error = await errorOf($('#host').shadow$$('p')[2].getText())
        expect(error?.message).toContain('Index out of bounds!')
    })

    it('gives the same not found element for the list of a held browsing context', async function () {
        if (!browser.isBidi) {
            return this.skip()
        }
        const context = await browser.url(`http://127.0.0.1:${(server.address() as AddressInfo).port}/`)
        expect(await context.$$('#list li')[5].isDisplayed()).toBe(false)
        const error = await errorOf(context.$$('#list li')[5].click())
        expect(error?.message).toContain('Index out of bounds! $$(#list li) returned only 3 elements.')
    })

    it('still waits for a list that loads later', async () => {
        await browser.execute(() => (window as unknown as { renderLate (): void }).renderLate())
        expect(await $$('#late li')[2].getText()).toBe('c')
    })

    it('still waits for a matcher on an item that appears later', async () => {
        await browser.execute(() => (window as unknown as { renderLate (): void }).renderLate())
        await expect($$('#late li')[2]).toBeDisplayed()
    })
})
