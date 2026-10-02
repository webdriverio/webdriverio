import fs from 'node:fs'
import path from 'node:path'
import { createServer, type Server } from 'node:http'
import { once } from 'node:events'
import type { AddressInfo } from 'node:net'
import { browser, $, expect } from '@wdio/globals'

import { cacheDir, cacheModel } from './model.js'

const PAGE = `<!doctype html><title>Shop</title>
<main>
    <p>Items: <span id="count">0</span></p>
    <button data-testid="add-new" onclick="const c = document.getElementById('count'); c.textContent = String(Number(c.textContent) + 1)">Add to cart</button>
</main>`

describe('heal evidence in Firefox', () => {
    let server: Server
    let origin: string

    before(async function () {
        /**
         * a browser that does not implement `browsingContext.startScreencast`
         * has nothing to verify here
         */
        const context = await browser.getWindowHandle()
        const probe = await browser.browsingContextStartScreencast({ context }).catch(() => undefined)
        if (!probe) {
            this.skip()
        }
        await browser.browsingContextStopScreencast({ screencast: probe!.screencast })

        fs.writeFileSync(path.join(cacheDir, 'healVideo.e2e.ts.json'), JSON.stringify({
            version: 1,
            entries: {
                add: {
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
        }))
        server = createServer((_request, response) => {
            response.setHeader('Content-Type', 'text/html; charset=utf-8')
            response.end(PAGE)
        })
        server.listen(0, '127.0.0.1')
        await once(server, 'listening')
        origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    })

    after(async () => {
        server?.closeAllConnections()
        await new Promise((resolve) => server ? server.close(resolve) : resolve(undefined))
    })

    it('records a video of a heal next to its screenshots', async () => {
        await browser.url(`${origin}/`)
        const records: { artifacts?: string[] }[] = []
        const listener = (record: { artifacts?: string[] }) => records.push(record)
        process.on('ai:act', listener)
        const result = await browser.act('Add the item to the cart', { id: 'add', cache: 'locked', model: cacheModel })
            .finally(() => process.off('ai:act', listener))
        expect(result.healed).toBe('cache')
        await expect($('#count')).toHaveText('1')

        const artifacts = records[0].artifacts!
        expect(artifacts.map((file) => path.extname(file))).toEqual(['.png', '.png', '.webm'])
        const video = artifacts[2]
        expect(path.dirname(video)).toBe(path.dirname(artifacts[0]))
        expect(fs.statSync(video).size).toBeGreaterThan(0)
        /**
         * WebM files start with the EBML magic number
         */
        expect(fs.readFileSync(video).subarray(0, 4).toString('hex')).toBe('1a45dfa3')
    })
})
