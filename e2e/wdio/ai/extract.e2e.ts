import { createServer, type Server } from 'node:http'
import { once } from 'node:events'
import type { AddressInfo } from 'node:net'
import { browser, expect } from '@wdio/globals'
import { z } from 'zod'

import { extractModel } from './model.js'

const CART = `<!doctype html><title>Cart</title>
<table>
    <caption>Cart</caption>
    <tr><th>Name</th><th>Size</th><th>Qty</th></tr>
    <tr><td>Blue Shirt</td><td>M</td><td>1</td></tr>
    <tr><td>Red Socks</td><td>L</td><td>2</td></tr>
</table>`

describe('browser.extract()', () => {
    let server: Server
    let origin: string

    before(async () => {
        server = createServer((_request, response) => {
            response.setHeader('Content-Type', 'text/html; charset=utf-8')
            response.end(CART)
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
})
