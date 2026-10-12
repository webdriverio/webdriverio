import { createServer, type Server } from 'node:http'
import { once } from 'node:events'
import type { AddressInfo } from 'node:net'
import { browser, expect } from '@wdio/globals'

import { row, type Item } from './missingListItemOutcome.js'

const WAIT = 200

/**
 * An `overwriteCommand('$$')` with an async function returns a promise, not the element
 * list. The index of that promise has its own wait in `@wdio/utils`, which throws. A spec
 * file of its own, because the overwrite stays for the whole session.
 */
describe('an index that the list never reaches, with an async overwrite of $$', () => {
    let server: Server
    let waitforTimeout: number | undefined

    before(async () => {
        server = createServer((_, response) => {
            response.setHeader('Content-Type', 'text/html; charset=utf-8')
            response.end('<title>Overwrite</title><ul id="list"><li>a</li><li>b</li><li>c</li></ul>')
        })
        server.listen(0, '127.0.0.1')
        await once(server, 'listening')
        waitforTimeout = browser.options.waitforTimeout
        browser.options.waitforTimeout = WAIT
        await browser.url(`http://127.0.0.1:${(server.address() as AddressInfo).port}/`)
        browser.overwriteCommand('$$', async (original$$, selector) => original$$(selector))
    })

    after(async () => {
        browser.options.waitforTimeout = waitforTimeout
        const closed = new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
        server.closeAllConnections()
        await closed
    })

    it('reads an item in range', async () => {
        expect(await browser.$$('#list li')[1].getText()).toBe('b')
    })

    /**
     * current behavior, a follow-up changes it to the "not found" item of a plain `$$`
     */
    it('$$(selector)[5] throws "Index out of bounds" for every check', async () => {
        expect(await row(() => [browser.$$('#list li')[5] as unknown as Item], {
            'isExisting': (item: Item) => item.isExisting(),
            'isDisplayed': (item: Item) => item.isDisplayed(),
            'waitForDisplayed reverse': (item: Item) => item.waitForDisplayed({ reverse: true, timeout: WAIT }),
            'not.toExist': (item: Item) => expect(item).not.toExist({ wait: WAIT }),
            'not.toBeDisplayed': (item: Item) => expect(item).not.toBeDisplayed({ wait: WAIT }),
            'click': (item: Item) => item.click(),
        })).toEqual({
            'isExisting': 'Index out of bounds',
            'isDisplayed': 'Index out of bounds',
            'waitForDisplayed reverse': 'Index out of bounds',
            'not.toExist': 'Index out of bounds',
            'not.toBeDisplayed': 'Index out of bounds',
            'click': 'Index out of bounds',
        })
    })
})
