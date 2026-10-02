import { createServer, type Server } from 'node:http'
import { once } from 'node:events'
import type { AddressInfo } from 'node:net'
import { browser, $, expect } from '@wdio/globals'
import { ActError } from '@wdio/ai-service'

import { model } from './model.js'

const SHOP = `<!doctype html><title>Shop</title>
<main>
    <h1>Shop</h1>
    <label for="email">Email</label><input id="email" type="email">
    <p>Items: <span id="count">0</span></p>
    <button onclick="const c = document.getElementById('count'); c.textContent = String(Number(c.textContent) + 1)">Add to cart</button>
</main>`

describe('browser.act()', () => {
    let server: Server
    let origin: string

    before(async () => {
        server = createServer((_request, response) => {
            response.setHeader('Content-Type', 'text/html; charset=utf-8')
            response.end(SHOP)
        })
        server.listen(0, '127.0.0.1')
        await once(server, 'listening')
        origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    })

    after(async () => {
        server.closeAllConnections()
        await new Promise((resolve) => server.close(resolve))
    })

    beforeEach(async () => {
        await browser.url(`${origin}/`)
    })

    it('performs the steps the model chose in a real browser', async () => {
        const result = await browser.act('Add the item to the cart')
        expect(result.source).toBe('model')
        expect(result.summary).toBe('Added the item to the cart')
        expect(result.steps).toEqual([{ action: 'click', code: 'await $(\'role/button[name="Add to cart"]\').click()' }])
        await expect($('#count')).toHaveText('1')
    })

    it('fills a value without sending it to the model', async () => {
        const result = await browser.act('Fill in {{email}}', { values: { email: 'alice@example.com' } })
        await expect($('#email')).toHaveValue('alice@example.com')
        expect(result.steps[0].code).toBe('await $(\'role/textbox[name="Email"]\').setValue(\'{{email}}\')')
        expect(model.sentText()).not.toContain('alice@example.com')
    })

    it('fails with the reason the model gave', async () => {
        const error = await browser.act('Check out').catch((err) => err)
        expect(error).toBeInstanceOf(ActError)
        expect(error.reason).toBe('There is no checkout button on this page')
    })
})
