import { createServer, type Server } from 'node:http'
import { once } from 'node:events'
import type { AddressInfo } from 'node:net'
import { browser, $, expect } from '@wdio/globals'

const NEXT_PAGE_DELAY = 1500

const holdsTheCommand = () => !/firefox|safari/i.test(String(browser.capabilities.browserName))

const VISIBLE = '<title>next</title><div id="spinner" onclick="window.clicks = (window.clicks || 0) + 1">next</div>'
const HIDDEN = '<title>next</title><div id="spinner" style="display: none">next</div>'
const ABSENT = '<title>next</title><p>no spinner</p>'
const NEXT_PAGES: Record<string, string> = { '/visible': VISIBLE, '/hidden': HIDDEN, '/absent': ABSENT }

const previousPage = (next: string) => `
    <title>previous</title>
    <div id="spinner">previous</div>
    <form id="form" action="${next}"></form>
`

const NAVIGATIONS: Record<string, (next: string) => Promise<unknown>> = {
    'location.href': (next) => browser.execute((url) => { location.href = url }, next),
    'a form submit': () => browser.execute(() => (document.getElementById('form') as HTMLFormElement).submit()),
    'a redirect': (next) => browser.execute((url) => { location.href = `/redirect?to=${encodeURIComponent(url)}` }, next),
}

/**
 * A navigation that the page started does not block the next command. Chrome holds a command on an
 * element of the previous page until the next document commits, then rejects it. Firefox and
 * Safari run it on the previous page, which is still there, so only Chromium browsers have an exact result.
 * @see https://github.com/webdriverio/webdriverio/issues/16374
 */
describe('an element of the previous page while the next page loads', () => {
    let server: Server
    let origin: string

    before(async () => {
        server = createServer((request, response) => {
            const url = new URL(request.url || '/', 'http://localhost')
            response.setHeader('Content-Type', 'text/html; charset=utf-8')
            response.setHeader('Cache-Control', 'no-store')
            if (url.pathname === '/redirect') {
                response.statusCode = 302
                response.setHeader('Location', url.searchParams.get('to') || '/visible')
                return response.end()
            }
            const nextPage = NEXT_PAGES[url.pathname]
            if (nextPage) {
                setTimeout(() => response.end(nextPage), NEXT_PAGE_DELAY)
                return
            }
            response.end(previousPage(url.searchParams.get('next') || '/visible'))
        })
        server.listen(0, '127.0.0.1')
        await once(server, 'listening')
        origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    })

    after(async () => {
        const closed = new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
        server.closeAllConnections()
        await closed
    })

    const open = async (next: string) => {
        await browser.url(`${origin}/?next=${next}`)
        await expect($('#spinner')).toBeDisplayed()
        return `${origin}${next}`
    }

    for (const [name, navigate] of Object.entries(NAVIGATIONS)) {
        it(`finds the element again after ${name}`, async () => {
            const next = await open('/hidden')
            const spinner = await $('#spinner')
            await navigate(next)

            const displayed = await spinner.isDisplayed()
            expect(displayed).toEqual(holdsTheCommand() ? false : expect.any(Boolean))
            await spinner.waitForDisplayed({ reverse: true, timeout: NEXT_PAGE_DELAY * 4 })
        })
    }

    it('a reverse wait that is never true still fails with its timeout', async () => {
        const next = await open('/visible')
        const spinner = await $('#spinner')
        await browser.execute((url) => { location.href = url }, next)

        const error = await spinner.waitForDisplayed({ reverse: true, timeout: NEXT_PAGE_DELAY / 3, interval: 50 })
            .then(() => undefined, (err: Error) => err)
        expect(error?.message).toContain('still displayed')
    })

    it('an element that the next page does not have is not displayed', async () => {
        const next = await open('/absent')
        const spinner = await $('#spinner')
        await browser.execute((url) => { location.href = url }, next)

        const displayed = await spinner.isDisplayed()
        expect(displayed).toEqual(holdsTheCommand() ? false : expect.any(Boolean))
        await spinner.waitForExist({ reverse: true, timeout: NEXT_PAGE_DELAY * 4 })
    })

    it('a click found again runs once, on the next page', async function () {
        if (!holdsTheCommand()) {
            return this.skip()
        }
        const next = await open('/visible')
        const spinner = await $('#spinner')
        await browser.execute((url) => { location.href = url }, next)

        await spinner.click()
        const clicks = await browser.execute(() => (window as unknown as { clicks?: number }).clicks)
        expect(clicks).toBe(1)
    })
})
