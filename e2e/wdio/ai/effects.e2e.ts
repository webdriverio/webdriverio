import fs from 'node:fs'
import path from 'node:path'
import { createServer, type Server } from 'node:http'
import { once } from 'node:events'
import type { AddressInfo } from 'node:net'
import { browser, $, expect } from '@wdio/globals'
import { ActError } from '@wdio/ai-service'

import { cacheDir, effectsModel } from './model.js'

const button = (testId: string, label: string, api: string | undefined, output: string) => `<button data-testid="${testId}"${api ? ` onclick="fetch('${api}', { method: 'POST' }).then(() => { const o = document.getElementById('${output}'); o.textContent = String(Number(o.textContent) + 1) }); fetch('/telemetry', { method: 'POST' })"` : ''}>${label}</button>`
const output = (id: string, label: string) => `<output id="${id}" aria-label="${label}">0</output>`

const PAGES: Record<string, string> = {
    '/shop': button('add', 'Add to cart', '/api/cart', 'cart') + output('cart', 'Cart'),
    '/slow': button('add', 'Add to cart', '/api/cart?delay=800', 'cart') + output('cart', 'Cart'),
    '/renamed': button('wish', 'Add to cart', '/api/wishlist', 'wishlist') + output('wishlist', 'Wishlist') +
        button('add-new', 'Add to bag', '/api/cart', 'cart') + output('cart', 'Cart'),
    '/broken': button('add', 'Add to cart', undefined, 'cart') + output('cart', 'Cart')
}

const ADD: Record<string, unknown> = {
    instruction: 'Add the item to the cart',
    platform: 'web',
    recordedAt: '2026-10-01T12:00:00.000Z',
    steps: [{
        action: 'click',
        args: { target: '[data-testid="add"]' },
        code: 'await $(\'[data-testid="add"]\').click()',
        target: { selector: '[data-testid="add"]', role: 'button', name: 'Add to cart', candidates: ['[data-testid="add"]'] },
        effect: { requests: ['POST /api/cart → 2xx'], changed: ['status "Cart"'] }
    }]
}

describe('act() step effects', () => {
    let server: Server
    let origin: string

    before(async () => {
        fs.writeFileSync(path.join(cacheDir, 'effects.e2e.ts.json'), JSON.stringify({ version: 1, entries: { add: ADD } }))
        server = createServer((request, response) => {
            const url = new URL(request.url || '/', 'http://localhost')
            if (url.pathname.startsWith('/api/') || url.pathname === '/telemetry') {
                setTimeout(() => {
                    response.statusCode = url.pathname === '/telemetry' ? 204 : 201
                    response.end()
                }, Number(url.searchParams.get('delay') || 0))
                return
            }
            response.setHeader('Content-Type', 'text/html; charset=utf-8')
            response.end(`<!doctype html><title>Shop</title><main>${PAGES[url.pathname] || ''}</main>`)
        })
        server.listen(0, '127.0.0.1')
        await once(server, 'listening')
        origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    })

    after(async () => {
        server.closeAllConnections()
        await new Promise((resolve) => server.close(resolve))
    })

    it('records what a step did, without the ignored telemetry request', async () => {
        await browser.url(`${origin}/shop`)
        await browser.act('Add the item to the cart', { model: effectsModel, cache: 'off' })
        const sent = effectsModel.sentText()
        expect(sent).toContain('Effect: POST /api/cart → 2xx, a change in status "Cart"')
        expect(sent).not.toContain('/telemetry')
    })

    it('waits until a slow request finished before act returns', async () => {
        await browser.url(`${origin}/slow`)
        await browser.act('Add the item to the cart', { model: effectsModel, cache: 'off' })
        expect(await $('#cart').getText()).toBe('1')
    })

    it('replays a step that still has its effect', async () => {
        await browser.url(`${origin}/shop`)
        const result = await browser.act('Add the item to the cart', { id: 'add', cache: 'locked' })
        expect(result.source).toBe('cache')
        await expect($('#cart')).toHaveText('1')
    })

    it('rejects a heal onto a button with the same name that does something else', async () => {
        await browser.url(`${origin}/renamed`)
        const error = await browser.act('Add the item to the cart', { id: 'add', cache: 'locked' }).catch((err) => err)
        expect(error).toBeInstanceOf(ActError)
        expect(error.reason).toContain('no longer finds its element, and the step ran on role/button[name="Add to cart"], which does not cause POST /api/cart → 2xx')
        await expect($('#cart')).toHaveText('0')
        /**
         * the wrong button was clicked once, never again
         */
        await expect($('#wishlist')).toHaveText('1')
    })

    it('reports a step that ran but no longer does what it did', async () => {
        await browser.url(`${origin}/broken`)
        const error = await browser.act('Add the item to the cart', { id: 'add', cache: 'locked' }).catch((err) => err)
        expect(error).toBeInstanceOf(ActError)
        expect(error.reason).toContain('ran, but the step no longer causes POST /api/cart → 2xx, a change in status "Cart". The app may have changed behavior')
    })
})
