import { createServer, type Server } from 'node:http'
import { browser, expect } from '@wdio/globals'

/**
 * WebDriver Classic drivers wait for a navigation that the page started before the next script. Chrome holds a
 * WebDriver BiDi script call until the new page commits, and then rejects it because the realm of the old page is gone.
 */
describe('execute during a navigation that the page started', () => {
    let server: Server
    let origin: string

    before(async () => {
        server = createServer((req, res) => {
            res.setHeader('content-type', 'text/html')
            setTimeout(() => res.end(`<html><body>${req.url}</body></html>`), req.url === '/slow' ? 300 : 0)
        })
        await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
        const address = server.address()
        if (address === null || typeof address === 'string') {
            throw new Error('The test server has no port')
        }
        origin = `http://127.0.0.1:${address.port}`
    })

    after(() => {
        server.close()
    })

    it('runs the next script on the new page', async () => {
        await browser.url(`${origin}/start`)

        await browser.execute(() => {
            window.location.href = '/slow'
        })

        await expect(await browser.execute(() => document.body.textContent)).toBe('/slow')
    })
})
