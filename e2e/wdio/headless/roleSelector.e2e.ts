import { createServer, type Server } from 'node:http'
import { once } from 'node:events'
import type { AddressInfo } from 'node:net'
import { browser, $, $$, expect } from '@wdio/globals'

async function listen (pages: Record<string, string>) {
    const server = createServer((request, response) => {
        response.setHeader('Content-Type', 'text/html; charset=utf-8')
        response.end(pages[request.url || '/'] || '')
    })
    server.listen(0, '127.0.0.1')
    await once(server, 'listening')
    return { server, origin: `http://127.0.0.1:${(server.address() as AddressInfo).port}` }
}

async function close (server: Server) {
    const closed = new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
    server.closeAllConnections()
    await closed
}

const PAGE = `
<title>Role selector</title>
<main>
    <h2 id="summary">Order summary</h2>
    <button id="native">Checkout</button>
    <div id="explicit" role="button" tabindex="0">Continue shopping</div>
    <a id="link" href="/help">Help</a>
    <button id="aria-label" aria-label="Close dialog">×</button>
    <span id="billing">Billing address</span><section id="labelled" aria-labelledby="billing"></section>
    <label for="email">Email</label><input id="email" type="email">
    <img id="logo" alt="Company logo" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7">
    <button id="hidden" hidden>Hidden action</button>
    <table>
        <caption>Cart</caption>
        <tr id="row-1"><td>Shirt</td><td><button>Remove</button></td></tr>
        <tr id="row-2"><td>Socks</td><td><button>Remove</button></td></tr>
        <tr id="row-3"><td>Hat</td><td><button>Remove</button></td></tr>
    </table>
    <div id="host"></div>
</main>
<script>
    document.getElementById('host').attachShadow({ mode: 'open' }).innerHTML = '<button id="in-shadow">Pay with card</button>'
</script>
`

describe('role/ selector', () => {
    let site: { server: Server, origin: string }
    let framed: { server: Server, origin: string }

    before(async () => {
        framed = await listen({ '/framed': '<title>Payment</title><button id="pay">Pay now</button>' })
        site = await listen({
            '/': PAGE,
            '/frame': `<title>Frame</title><iframe title="Payment" src="${framed.origin}/framed"></iframe>`
        })
        await browser.url(`${site.origin}/`)
    })

    after(async () => {
        await Promise.all([site, framed].filter(Boolean).map(({ server }) => close(server)))
    })

    it('finds native and explicit roles by role and name', async () => {
        await expect($('role/button[name="Checkout"]')).toHaveAttribute('id', 'native')
        await expect($('role/button[name="Continue shopping"]')).toHaveAttribute('id', 'explicit')
        await expect($('role/link[name="Help"]')).toHaveAttribute('id', 'link')
        await expect($('role/heading[name="Order summary"]')).toHaveAttribute('id', 'summary')
    })

    it('computes the accessible name from aria-label, aria-labelledby, labels and alt', async () => {
        await expect($('role/button[name="Close dialog"]')).toHaveAttribute('id', 'aria-label')
        await expect($('role/region[name="Billing address"]')).toHaveAttribute('id', 'labelled')
        await expect($('role/textbox[name="Email"]')).toHaveAttribute('id', 'email')
        await expect($('role/img[name="Company logo"]')).toHaveAttribute('id', 'logo')
        await expect($('role/image[name="Company logo"]')).toHaveAttribute('id', 'logo')
    })

    it('does not match a different role with the same name, or a hidden element', async () => {
        await expect($('role/link[name="Checkout"]')).not.toBeExisting()
        await expect($('role/button[name="Hidden action"]')).not.toBeExisting()
    })

    it('throws in strict mode when several elements match, and scopes to a parent', async () => {
        await expect($$('role/button[name="Remove"]')).toBeElementsArrayOfSize(3)
        await expect($('role/button[name="Remove"]').getText()).rejects.toThrow(/resolved to 3 elements, expected 1/)
        const row = $('#row-2')
        await expect(row.$('role/button[name="Remove"]')).toBeExisting()
        await expect(row.$('role/button[name="Remove"]')).toHaveText('Remove')
    })

    it('lists every element of a role', async () => {
        await expect($$('role/row')).toBeElementsArrayOfSize(3)
    })

    it('finds an element inside an open shadow root', async () => {
        await expect($('role/button[name="Pay with card"]')).toHaveAttribute('id', 'in-shadow')
    })

    it('finds an element inside a cross-origin frame', async function () {
        if (!browser.isBidi) {
            return this.skip()
        }
        const page = await browser.url(`${site.origin}/frame`)
        if (!page) {
            throw new Error('expected browser.url() to return a browsing context')
        }
        const frame = await page.frame(`${framed.origin}/framed`)
        await expect(frame.$('role/button[name="Pay now"]')).toHaveAttribute('id', 'pay')
        await browser.url(`${site.origin}/`)
    })
})
