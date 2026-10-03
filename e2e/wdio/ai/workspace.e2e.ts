import { createServer, type Server } from 'node:http'
import { once } from 'node:events'
import type { AddressInfo } from 'node:net'
import { browser, $, expect } from '@wdio/globals'

import { workspaceModel } from './model.js'

const SHOP = `<!doctype html><title>Shop</title>
<main>
    <p>Items: <span id="count">0</span></p>
    <button data-sku="shirt-blue-m" onclick="const c = document.getElementById('count'); c.textContent = String(Number(c.textContent) + 1)">Add to cart</button>
</main>
<script>console.warn('stock is low for shirt-blue-m')</script>`

describe('browser.act() workspace', () => {
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

    it('reads console output and page source from the workspace', async () => {
        await browser.url(`${origin}/`)
        const result = await browser.act('Add the item to the cart', { model: workspaceModel })
        expect(result.summary).toBe('Added the item after checking the stock warning')
        await expect($('#count')).toHaveText('1')

        const sent = workspaceModel.sentText()
        expect(sent).toContain('stock is low for shirt-blue-m')
        expect(sent).toMatch(/Saved the page HTML \(\d+ characters\) to \/page\.html/)
        expect(sent).toContain('/page.html')
        expect(sent).toContain('data-sku="shirt-blue-m"')
    })
})
