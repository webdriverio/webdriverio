import { createServer, type Server } from 'node:http'
import { once } from 'node:events'
import type { AddressInfo } from 'node:net'
import { browser, $, expect } from '@wdio/globals'

import { scopeModel } from './model.js'

const CHECKOUT = `<!doctype html><title>Checkout</title>
<form id="billing"><h2>Billing</h2><label>Email <input type="email" id="billing-email"></label></form>
<form id="shipping"><h2>Shipping</h2><label>Email <input type="email" id="shipping-email"></label></form>`

describe('element.act()', () => {
    let server: Server
    let origin: string

    before(async () => {
        server = createServer((_request, response) => {
            response.setHeader('Content-Type', 'text/html; charset=utf-8')
            response.end(CHECKOUT)
        })
        server.listen(0, '127.0.0.1')
        await once(server, 'listening')
        origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    })

    after(async () => {
        server.closeAllConnections()
        await new Promise((resolve) => server.close(resolve))
    })

    it('acts inside the element it was called on', async () => {
        await browser.url(`${origin}/`)
        await $('#billing').act('Fill in {{email}}', { values: { email: 'billing@example.com' }, model: scopeModel })

        await expect($('#billing-email')).toHaveValue('billing@example.com')
        await expect($('#shipping-email')).toHaveValue('')
        expect(scopeModel.sentText()).not.toContain('Shipping')
    })
})
