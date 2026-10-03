import { createServer, type Server } from 'node:http'
import { once } from 'node:events'
import type { AddressInfo } from 'node:net'
import { browser, $, expect } from '@wdio/globals'
import { z } from 'zod'

import { extractModel } from './model.js'

const CART = `<!doctype html><title>Cart</title>
<table>
    <caption>Cart</caption>
    <tr><th>Name</th><th>Size</th><th>Qty</th></tr>
    <tr><td>Blue Shirt</td><td>M</td><td>1</td></tr>
    <tr><td>Red Socks</td><td>L</td><td>2</td></tr>
</table>`

/**
 * shows how many items the cart has, the SKUs are only in the API response
 */
const SUMMARY = `<!doctype html><title>Cart</title>
<p id="summary">Loading…</p>
<script>
    fetch('/api/cart').then((response) => response.json()).then((cart) => {
        document.getElementById('summary').textContent = cart.items.length + ' items in your cart'
    })
</script>`

describe('browser.extract()', () => {
    let server: Server
    let origin: string

    before(async () => {
        server = createServer((request, response) => {
            if (request.url === '/api/inbox') {
                response.setHeader('Content-Type', 'application/json')
                response.end(JSON.stringify({ messages: ['private'] }))
                return
            }
            if (request.url === '/inbox') {
                response.setHeader('Content-Type', 'text/html; charset=utf-8')
                response.end('<!doctype html><title>Inbox</title><p id="inbox">…</p><script>fetch(\'/api/inbox\').then((r) => r.json()).then(() => { document.getElementById(\'inbox\').textContent = \'loaded\' })</script>')
                return
            }
            if (request.url === '/api/cart') {
                response.setHeader('Content-Type', 'application/json')
                response.end(JSON.stringify({ items: [{ sku: 'SHIRT-BLUE-M', qty: 1 }, { sku: 'SOCKS-RED-L', qty: 2 }] }))
                return
            }
            response.setHeader('Content-Type', 'text/html; charset=utf-8')
            response.end(request.url === '/summary' ? SUMMARY : CART)
        })
        server.listen(0, '127.0.0.1')
        await once(server, 'listening')
        origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    })

    after(async () => {
        server.closeAllConnections()
        await new Promise((resolve) => server.close(resolve))
    })

    it('reads typed data from a real page', async () => {
        await browser.url(`${origin}/`)
        const cart = await browser.extract(
            'the line items in the cart',
            z.array(z.object({ name: z.string(), size: z.string(), qty: z.number() })),
            { model: extractModel }
        )
        expect(cart).toEqual([
            { name: 'Blue Shirt', size: 'M', qty: 1 },
            { name: 'Red Socks', size: 'L', qty: 2 }
        ])
        expect(extractModel.sentText()).toContain('Blue Shirt')
        expect(extractModel.boundTools).not.toContain('click')
    })

    it('reads a value the page only received from its API, from the collected response body', async () => {
        await browser.url(`${origin}/summary`)
        await expect($('#summary')).toHaveText('2 items in your cart')
        /**
         * another tab loads its own API, the extract on the shop page must
         * not see it
         */
        const inbox = await browser.newWindow(`${origin}/inbox`)
        if (!('contextId' in inbox)) {
            throw new Error('expected newWindow() to return a browsing context')
        }
        await expect(inbox.$('#inbox')).toHaveText('loaded')

        const skus = await browser.extract('the SKUs of the items in the cart', z.array(z.string()), { model: extractModel })
        expect(skus).toEqual(['SHIRT-BLUE-M', 'SOCKS-RED-L'])
        expect(extractModel.sentText()).toContain('/api/cart')
        expect(extractModel.sentText()).not.toContain('/api/inbox')

        await browser.browsingContextClose({ context: inbox.contextId })
    })
})
