import { createServer, type Server } from 'node:http'
import { once } from 'node:events'
import type { AddressInfo } from 'node:net'
import { browser, expect } from '@wdio/globals'

const PAGE = '<title>parent</title><span class="t">other</span><div id="p"><span class="t">mine</span></div>'

type Page = { calls: number, found: number, onSecondCall: (id: string) => HTMLElement | undefined }

/**
 * the parent is found only by the second lookup: the check of `waitForExist`. The lookup after
 * it misses, as when the page replaces the parent between the two (#16395)
 */
function onSecondCall (id: string) {
    const page = window as unknown as Page
    page.calls = (page.calls || 0) + 1
    if (page.calls !== 2) {
        return undefined
    }
    page.found = (page.found || 0) + 1
    return document.getElementById(id) ?? undefined
}

const PARENTS: Record<string, () => ReturnType<WebdriverIO.Browser['$']>> = {
    'custom$': () => browser.custom$('onSecondCall', 'p'),
    'a function selector': () => browser.$(function () { return (window as unknown as Page).onSecondCall('p') })
}

const NOT_FOUND = (command: string) => new RegExp(`Can't call ${command.replace(/\$/g, '\\$')} on element .* because element wasn't found`, 's')

/**
 * the query rejects after the wait found the parent, not with the timeout of a parent that never came
 */
async function rejectsAfterTheWait (query: () => Promise<unknown>, command: string) {
    const start = Date.now()
    await expect(query()).rejects.toThrow(NOT_FOUND(command))
    expect(Date.now() - start).toBeLessThan(browser.options.waitforTimeout as number)
    expect(await browser.execute(() => (window as unknown as Page).found)).toBe(1)
}

describe('a parent that is gone again after the implicit wait', () => {
    let server: Server

    before(async () => {
        server = createServer((_request, response) => {
            response.setHeader('Content-Type', 'text/html; charset=utf-8')
            response.end(PAGE)
        })
        server.listen(0, '127.0.0.1')
        await once(server, 'listening')
        await browser.url(`http://127.0.0.1:${(server.address() as AddressInfo).port}/`)
        // no match is `undefined` at runtime; the strategy type has no empty value
        await browser.addLocatorStrategy('onSecondCall', onSecondCall as (id: string) => HTMLElement)
    })

    beforeEach(async () => {
        await browser.execute(`window.calls = 0; window.found = 0; window.onSecondCall = ${onSecondCall.toString()}`)
    })

    after(async () => {
        const closed = new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
        server.closeAllConnections()
        await closed
    })

    for (const [name, parent] of Object.entries(PARENTS)) {
        it(`${name}: a child query rejects and does not run from the document`, async () => {
            await rejectsAfterTheWait(() => parent().$('.t').getText(), '$')
        })

        it(`${name}: a non-strict child query rejects and does not give a child outside the parent`, async () => {
            await rejectsAfterTheWait(() => parent().$('.t', { strict: false }).getText(), '$')
        })

        it(`${name}: a child list rejects and does not give the matches of the document`, async () => {
            await rejectsAfterTheWait(() => parent().$$('.t').getElements(), '$$')
        })
    }
})
