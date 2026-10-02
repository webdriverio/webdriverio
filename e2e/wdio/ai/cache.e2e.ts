import fs from 'node:fs'
import path from 'node:path'
import { createServer, type Server } from 'node:http'
import { once } from 'node:events'
import type { AddressInfo } from 'node:net'
import { browser, $, expect } from '@wdio/globals'
import { ActError } from '@wdio/ai-service'

import { cacheDir, cacheModel } from './model.js'

const page = (label: string) => `<!doctype html><title>Shop</title>
<main>
    <p>Items: <span id="count">0</span></p>
    <button onclick="const c = document.getElementById('count'); c.textContent = String(Number(c.textContent) + 1)">${label}</button>
</main>`

const CLICK = 'await $(\'role/button[name="Add to cart"]\').click()'

/**
 * a cache file as a previous run would have written it
 */
const RECORDED = {
    version: 1,
    entries: {
        'add-to-cart': {
            instruction: 'Add the item to the cart',
            platform: 'web',
            model: 'anthropic:claude-sonnet-5-5',
            recordedAt: '2026-10-01T12:00:00.000Z',
            steps: [{
                action: 'click',
                args: { target: 'role/button[name="Add to cart"]' },
                code: CLICK,
                target: { selector: 'role/button[name="Add to cart"]', role: 'button', name: 'Add to cart', candidates: ['role/button[name="Add to cart"]', 'aria/Add to cart'] }
            }]
        },
        'renamed-test-id': {
            instruction: 'Add the item to the cart',
            platform: 'web',
            recordedAt: '2026-10-01T12:00:00.000Z',
            steps: [{
                action: 'click',
                args: { target: '[data-testid="add-old"]' },
                code: 'await $(\'[data-testid="add-old"]\').click()',
                target: { selector: '[data-testid="add-old"]', role: 'button', name: 'Add to cart', candidates: ['[data-testid="add-old"]'] }
            }]
        }
    }
}

describe('browser.act() cache', () => {
    let server: Server
    let origin: string

    before(async () => {
        fs.writeFileSync(path.join(cacheDir, 'cache.e2e.ts.json'), JSON.stringify(RECORDED))
        server = createServer((request, response) => {
            response.setHeader('Content-Type', 'text/html; charset=utf-8')
            response.end(request.url === '/renamed' ? page('Add to bag') : page('Add to cart'))
        })
        server.listen(0, '127.0.0.1')
        await once(server, 'listening')
        origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    })

    after(async () => {
        server.closeAllConnections()
        await new Promise((resolve) => server.close(resolve))
    })

    it('replays recorded steps in locked mode without a model', async () => {
        await browser.url(`${origin}/`)
        const result = await browser.act('Add the item to the cart', { id: 'add-to-cart', cache: 'locked', model: cacheModel })
        expect(result).toEqual({ source: 'cache', steps: [{ action: 'click', code: CLICK }] })
        await expect($('#count')).toHaveText('1')
        expect(cacheModel.calls).toHaveLength(0)
    })

    it('fails in locked mode when the page changed', async () => {
        await browser.url(`${origin}/renamed`)
        const error = await browser.act('Add the item to the cart', { id: 'add-to-cart', cache: 'locked', model: cacheModel }).catch((err) => err)
        expect(error).toBeInstanceOf(ActError)
        expect(error.reason).toContain('failed and the cache is locked')
        expect(cacheModel.calls).toHaveLength(0)
    })

    it('records once, then replays without the model', async () => {
        await browser.url(`${origin}/`)
        const recorded = await browser.act('Add the item', { id: 'record-me', cache: 'write', model: cacheModel })
        expect(recorded.source).toBe('model')
        const calls = cacheModel.calls.length

        const replayed = await browser.act('Add the item', { id: 'record-me', cache: 'write', model: cacheModel })
        expect(replayed).toEqual({ source: 'cache', steps: [{ action: 'click', code: CLICK }] })
        expect(cacheModel.calls).toHaveLength(calls)
        await expect($('#count')).toHaveText('2')
    })

    it('heals a step whose test id changed through role and name, without a model', async () => {
        await browser.url(`${origin}/`)
        const records: { artifacts?: string[] }[] = []
        const listener = (record: { artifacts?: string[] }) => records.push(record)
        process.on('ai:act', listener)
        const result = await browser.act('Add the item to the cart', { id: 'renamed-test-id', cache: 'locked', model: cacheModel })
            .finally(() => process.off('ai:act', listener))
        expect(result).toEqual({
            source: 'cache',
            healed: 'cache',
            steps: [{ action: 'click', code: CLICK }]
        })
        await expect($('#count')).toHaveText('1')

        /**
         * a screenshot when the cached step failed and one after the heal,
         * the video of Firefox is checked in `healVideo.e2e.ts`
         */
        const artifacts = records[0].artifacts!.filter((file) => file.endsWith('.png'))
        expect(artifacts.map((file) => path.basename(file))).toEqual(['failed.png', 'step-1.png'])
        expect(path.dirname(artifacts[0]).startsWith(path.join(cacheDir, 'workspaces', 'heals'))).toBe(true)
        for (const file of artifacts) {
            expect(fs.readFileSync(file).subarray(1, 4).toString()).toBe('PNG')
        }
    })
})
