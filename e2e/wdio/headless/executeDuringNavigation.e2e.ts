import { createServer, type Server } from 'node:http'
import { browser, expect } from '@wdio/globals'

/**
 * Chrome holds a WebDriver BiDi command during a navigation that the page started, then fails it with
 * "Cannot find context with specified id" (https://crbug.com/582923446). The command must run on the new page,
 * as with WebDriver Classic in Chrome.
 */
describe('commands during a navigation that the page started', () => {
    let server: Server
    let origin: string

    before(async () => {
        server = createServer((req, res) => {
            const url = new URL(req.url ?? '/', 'http://localhost')
            const hops = Number(url.searchParams.get('hops') ?? 0)
            res.setHeader('content-type', 'text/html')
            res.setHeader('cache-control', 'no-store')
            // each page of the chain starts the navigation to the next one
            const body = url.pathname === '/chain' && hops > 0
                ? `<script>location.href = '/chain?hops=${hops - 1}'</script>`
                : url.pathname
            setTimeout(() => res.end(`<html><body>${body}</body></html>`), url.pathname === '/start' ? 0 : 300)
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

    const navigate = async (to: string) => {
        await browser.url(`${origin}/start`)
        await browser.execute((url) => {
            window.location.href = url
        }, to)
    }

    // the path is set when the new document exists, also while it is still loading
    it('runs the next script on the new page', async () => {
        await navigate('/slow')
        await expect(await browser.execute(() => location.pathname)).toBe('/slow')
    })

    it('runs the next script on a page of a chain of script redirects', async () => {
        await navigate('/chain?hops=3')
        await expect(await browser.execute(() => location.pathname)).toBe('/chain')
        // the rest of the chain must not meet the navigation of the next test
        await browser.waitUntil(async () => (await browser.getUrl()).endsWith('hops=0'))
    })

    it('runs a WebDriver BiDi command on the new page', async () => {
        const context = await browser.getWindowHandle()
        await navigate('/slow')
        const result = await browser.scriptEvaluate({
            expression: 'location.pathname',
            awaitPromise: false,
            target: { context }
        })
        await expect(result.type === 'success' && result.result).toEqual({ type: 'string', value: '/slow' })
    })
})
