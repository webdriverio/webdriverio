import { createServer, type Server } from 'node:http'
import { once } from 'node:events'
import type { AddressInfo } from 'node:net'
import { browser, expect } from '@wdio/globals'

const PAGE = '<title>parent</title><span class="t">other</span><div id="p"><span class="t">mine</span></div>'

type Page = { calls: number, onSecondCall: (id: string) => HTMLElement | undefined }

/**
 * the parent is found only by the second lookup: the check of `waitForExist`. The lookup after
 * it misses, as when the page replaces the parent between the two (#16395)
 */
function onSecondCall (id: string) {
    const page = window as unknown as Page
    page.calls = (page.calls || 0) + 1
    return page.calls === 2 ? document.getElementById(id) ?? undefined : undefined
}

const PARENTS: Record<string, () => ReturnType<WebdriverIO.Browser['$']>> = {
    'custom$': () => browser.custom$('onSecondCall', 'p'),
    'a function selector': () => browser.$(function () { return (window as unknown as Page).onSecondCall('p') })
}

const NOT_FOUND = (command: string) => new RegExp(`Can't call ${command.replace(/\$/g, '\\$')} on element .* because element wasn't found`, 's')

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
        await browser.execute(`window.calls = 0; window.onSecondCall = ${onSecondCall.toString()}`)
    })

    after(async () => {
        const closed = new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
        server.closeAllConnections()
        await closed
    })

    for (const [name, parent] of Object.entries(PARENTS)) {
        it(`${name}: a child query rejects and does not run from the document`, async () => {
            await expect(parent().$('.t').getText()).rejects.toThrow(NOT_FOUND('$'))
        })

        it(`${name}: a non-strict child query rejects and does not give a child outside the parent`, async () => {
            await expect(parent().$('.t', { strict: false }).getText()).rejects.toThrow(NOT_FOUND('$'))
        })

        it(`${name}: a child list rejects and does not give the matches of the document`, async () => {
            await expect(parent().$$('.t').getElements()).rejects.toThrow(NOT_FOUND('$$'))
        })
    }
})
