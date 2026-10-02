import fs from 'node:fs'
import path from 'node:path'
import { createServer, type Server } from 'node:http'
import { once } from 'node:events'
import type { AddressInfo } from 'node:net'
import { browser, $, expect } from '@wdio/globals'
import { ActError } from '@wdio/ai-service'

import { cacheDir, scopeModel } from './model.js'

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

    it('refuses a target the model picked outside the element', async () => {
        await browser.url(`${origin}/`)
        const error = await $('#billing').act('Fill in the shipping email', { model: scopeModel }).catch((err) => err)
        expect(error).toBeInstanceOf(ActError)
        expect(scopeModel.sentText()).toContain('Error: #shipping-email is outside the element this call is limited to.')
        await expect($('#shipping-email')).toHaveValue('')
    })

    it('does not replay a cached step on an element outside the element', async () => {
        fs.writeFileSync(path.join(cacheDir, 'scope.e2e.ts.json'), JSON.stringify({
            version: 1,
            entries: {
                'billing-email': {
                    instruction: 'Fill in the email',
                    platform: 'web',
                    recordedAt: '2026-10-01T12:00:00.000Z',
                    steps: [{
                        action: 'fill',
                        args: { target: '#shipping-email', text: 'billing@example.com' },
                        code: 'await $(\'#shipping-email\').setValue(\'billing@example.com\')',
                        target: { selector: '#shipping-email', candidates: ['#shipping-email'] }
                    }]
                }
            }
        }))
        await browser.url(`${origin}/`)
        const error = await $('#billing').act('Fill in the email', { id: 'billing-email', cache: 'locked', model: scopeModel }).catch((err) => err)
        expect(error).toBeInstanceOf(ActError)
        expect(error.reason).toContain('#shipping-email is outside the element this act() call is limited to')
        await expect($('#shipping-email')).toHaveValue('')
    })
})
