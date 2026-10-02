import { createServer, type Server } from 'node:http'
import { once } from 'node:events'
import type { AddressInfo } from 'node:net'
import { browser, expect } from '@wdio/globals'

import { framesModel } from './model.js'

async function listen (pages: () => Record<string, string>) {
    const server = createServer((request, response) => {
        response.setHeader('Content-Type', 'text/html; charset=utf-8')
        response.end(pages()[new URL(request.url || '/', 'http://localhost').pathname] || '')
    })
    server.listen(0, '127.0.0.1')
    await once(server, 'listening')
    return { server, origin: `http://127.0.0.1:${(server.address() as AddressInfo).port}` }
}

describe('act() across frames and windows', () => {
    let shop: { server: Server, origin: string }
    let payments: { server: Server, origin: string }

    before(async () => {
        payments = await listen(() => ({
            '/pay': '<title>Pay</title><button onclick="document.getElementById(\'status\').textContent = \'Paid\'">Pay now</button><p id="status">Open</p>'
        }))
        shop = await listen(() => ({
            '/checkout': `<title>Checkout</title><h1>Checkout</h1><iframe title="Payment" src="${payments.origin}/pay"></iframe>`,
            '/support': '<title>Support</title><button onclick="window.open(\'/help\')">Open help</button>',
            '/help': '<title>Help</title><button onclick="document.getElementById(\'status\').textContent = \'Confirmed\'">Confirm</button><p id="status">Open</p>'
        }))
    })

    after(async () => {
        for (const { server } of [shop, payments].filter(Boolean)) {
            server.closeAllConnections()
            await new Promise((resolve) => server.close(resolve))
        }
    })

    async function paymentFrame () {
        const page = await browser.url(`${shop.origin}/checkout`)
        if (!page) {
            throw new Error('expected browser.url() to return a browsing context')
        }
        return page.frame(`${payments.origin}/pay`)
    }

    it('acts inside a held cross-origin frame', async () => {
        const frame = await paymentFrame()
        const result = await frame.act('Pay now', { model: framesModel, cache: 'off' })
        expect(result.summary).toBe('Paid')
        expect(await frame.$('#status').getText()).toBe('Paid')
        expect(await browser.getTitle()).toBe('Checkout')
    })

    it('enters a cross-origin frame by itself and the steps replay without the model', async () => {
        await paymentFrame()
        const recorded = await browser.act('Pay with the payment form', { id: 'pay', cache: 'write', model: framesModel })
        expect(recorded.steps.map((step) => step.action)).toEqual(['frame', 'click', 'frame'])
        expect(await (await paymentFrame()).$('#status').getText()).toBe('Open')

        const calls = framesModel.calls.length
        await paymentFrame()
        const replayed = await browser.act('Pay with the payment form', { id: 'pay', cache: 'locked', model: framesModel })
        expect(replayed.source).toBe('cache')
        expect(framesModel.calls).toHaveLength(calls)
        const [page] = await browser.browsingContexts()
        expect(await (await page.frame(`${payments.origin}/pay`)).$('#status').getText()).toBe('Paid')
    })

    it('switches to a window an action opened', async () => {
        await browser.url(`${shop.origin}/support`)
        const result = await browser.act('Open the help and confirm it', { model: framesModel, cache: 'off' })
        expect(result.summary).toBe('Confirmed in the help window')
        expect(framesModel.sentText()).toContain('a new window with /help')
        const help = (await browser.browsingContexts()).find((context) => context.url.endsWith('/help'))
        expect(await help!.$('#status').getText()).toBe('Confirmed')
    })
})
