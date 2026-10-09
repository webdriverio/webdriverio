import http from 'node:http'
import type { AddressInfo } from 'node:net'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { Browser, BrowserPlatform, canDownload } from '@puppeteer/browsers'

/**
 * `@puppeteer/browsers` 3 uses a proxy only when the optional peer `proxy-agent`
 * is installed, otherwise it ignores `HTTP_PROXY` / `HTTPS_PROXY`. `@wdio/utils`
 * must install it, see https://webdriver.io/docs/proxy
 */
describe('browser downloads', () => {
    const env = { ...process.env }
    let proxy: http.Server
    let proxied: string[]

    beforeEach(async () => {
        proxied = []
        proxy = http.createServer((req, res) => {
            proxied.push(`${req.method} ${req.url}`)
            res.writeHead(200).end()
        })
        await new Promise<void>((resolve) => proxy.listen(0, '127.0.0.1', resolve))
        process.env.HTTP_PROXY = `http://127.0.0.1:${(proxy.address() as AddressInfo).port}`
        delete process.env.http_proxy
        delete process.env.NO_PROXY
        delete process.env.no_proxy
    })

    afterEach(async () => {
        process.env = { ...env }
        await new Promise((resolve) => proxy.close(resolve))
    })

    it('go through the proxy in HTTP_PROXY', async () => {
        const available = await canDownload({
            browser: Browser.CHROMEDRIVER,
            platform: BrowserPlatform.LINUX,
            buildId: '130.0.6723.58',
            cacheDir: '/tmp',
            /**
             * `.invalid` never resolves, so only the proxy can answer
             */
            baseUrl: 'http://wdio-proxy-check.invalid'
        })

        expect(proxied).toEqual(['HEAD http://wdio-proxy-check.invalid/130.0.6723.58/linux64/chromedriver-linux64.zip'])
        expect(available).toBe(true)
    })
})
