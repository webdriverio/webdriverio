import { createServer, type Server } from 'node:http'
import { once } from 'node:events'
import type { AddressInfo } from 'node:net'
import { browser } from '@wdio/globals'

describe('network mocking', () => {
    before(function () {
        /**
         * Network mocking is a WebDriver BiDi feature. This suite also runs in
         * the browser matrix, where Safari still uses WebDriver Classic.
         */
        if (!browser.isBidi) {
            this.skip()
        }
    })

    afterEach(async () => {
        if (browser.isBidi) {
            await browser.mockRestoreAll()
        }
    })

    it('marks a request as mocked even without overwrites', async () => {
        const baseUrl = 'https://guinea-pig.webdriver.io/'
        const mock = await browser.mock('https://cdn.jsdelivr.net/npm/hammerjs@1.1.3/hammer.min.js', {
            method: 'get',
            statusCode: 200,
        })
        await browser.url(baseUrl)
        await browser.waitUntil(() => mock.calls.length === 1, {
            timeoutMsg: 'Expected mock to be made',
            timeout: 2000
        })
    })

    it('should mock with wildcard (*) pattern', async () => {
        const baseUrl = 'https://guinea-pig.webdriver.io/'
        const mock = await browser.mock('https://cdn.jsdelivr.net/npm/jquery@3.6.0/*', {
            method: 'get',
            statusCode: 200,
        })
        await browser.url(baseUrl)
        await browser.execute(() => {
            const script = document.createElement('script')
            script.src = 'https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js'
            document.body.appendChild(script)
        })
        await browser.waitUntil(() => mock.calls.length >= 1, {
            timeoutMsg: 'Expected wildcard mock to be called',
            timeout: 5000
        })
    })

    it('should mock with double wildcard (**) pattern', async () => {
        const mock = await browser.mock('https://cdn.jsdelivr.net/npm/vue@2.6.14/**', {
            method: 'get',
            statusCode: 200,
        })
        await browser.url('https://guinea-pig.webdriver.io/')
        await browser.execute(() => {
            const script = document.createElement('script')
            script.src = 'https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.min.js'
            document.body.appendChild(script)
        })
        await browser.waitUntil(() => mock.calls.length >= 1, {
            timeoutMsg: 'Expected double wildcard mock to be called',
            timeout: 5000
        })
    })

    it('should mock with wildcard in middle of path', async () => {
        const mock = await browser.mock('https://cdn.jsdelivr.net/npm/react@17.0.2/*/react.production.min.js', {
            method: 'get',
            statusCode: 200,
        })
        await browser.url('https://guinea-pig.webdriver.io/')
        await browser.execute(() => {
            const script = document.createElement('script')
            script.src = 'https://cdn.jsdelivr.net/npm/react@17.0.2/umd/react.production.min.js'
            document.body.appendChild(script)
        })
        await browser.waitUntil(() => mock.calls.length >= 1, {
            timeoutMsg: 'Expected middle wildcard mock to be called',
            timeout: 5000
        })
    })

    it('should mock with hostname wildcard', async () => {
        const mock = await browser.mock('https://*.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js', {
            method: 'get',
            statusCode: 200,
        })
        await browser.url('https://guinea-pig.webdriver.io/')
        await browser.execute(() => {
            const script = document.createElement('script')
            script.src = 'https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js'
            document.body.appendChild(script)
        })
        await browser.waitUntil(() => mock.calls.length >= 1, {
            timeoutMsg: 'Expected hostname wildcard mock to be called',
            timeout: 5000
        })
    })

    it('should mock with file extension wildcard', async () => {
        const mock = await browser.mock('https://cdn.jsdelivr.net/npm/moment@2.29.1/moment.min.*', {
            method: 'get',
            statusCode: 200,
        })
        await browser.url('https://guinea-pig.webdriver.io/')
        await browser.execute(() => {
            const script = document.createElement('script')
            script.src = 'https://cdn.jsdelivr.net/npm/moment@2.29.1/moment.min.js'
            document.body.appendChild(script)
        })
        await browser.waitUntil(() => mock.calls.length >= 1, {
            timeoutMsg: 'Expected extension wildcard mock to be called',
            timeout: 5000
        })
    })

    it('should mock with a dynamic function payload', async () => {
        const mock = await browser.mock('https://guinea-pig.webdriver.io/dynamic-mock.json')
        mock.respond((request) => ({
            mocked: true,
            url: request.request.url
        }), {
            headers: { 'content-type': 'application/json' }
        })

        await browser.url('https://guinea-pig.webdriver.io/')
        const result = await browser.execute(async () => {
            const res = await fetch('/dynamic-mock.json')
            return res.json()
        })

        expect(result).toEqual({
            mocked: true,
            url: 'https://guinea-pig.webdriver.io/dynamic-mock.json'
        })
        expect(mock.calls.length).toBeGreaterThanOrEqual(1)
    })

    it('should be able to see the response body', async () => {
        /**
         * Bypass the HTTP cache: earlier tests load this page, so the browser
         * can revalidate it and get 304 Not Modified. Firefox can then leave
         * `network.getData` for the body unanswered
         * (https://bugzilla.mozilla.org/show_bug.cgi?id=2077785, fixed in
         * Firefox 160; kept for older Firefox).
         */
        await browser.networkSetCacheBehavior({ cacheBehavior: 'bypass' })
        try {
            await browser.url('about:blank')
            const mock = await browser.mock('https://guinea-pig.webdriver.io/')

            await browser.url('https://guinea-pig.webdriver.io/')

            await mock.waitForResponse()
            expect(mock.calls[0].body).toContain('<title>WebdriverJS Testpage</title>')
        } finally {
            await browser.networkSetCacheBehavior({ cacheBehavior: 'default' })
        }
    })

    it('should mock with complex mixed wildcards', async () => {
        // Matches https://cdn.jsdelivr.net/.../bootstrap.min.js
        const mock = await browser.mock('https://*.jsdelivr.net/**/bootstrap.min.js', {
            method: 'get',
            statusCode: 200,
        })
        await browser.url('https://guinea-pig.webdriver.io/')
        await browser.execute(() => {
            const script = document.createElement('script')
            script.src = 'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.min.js'
            document.body.appendChild(script)
        })
        await browser.waitUntil(() => mock.calls.length >= 1, {
            timeoutMsg: 'Expected complex wildcard mock to be called',
            timeout: 5000
        })
    })

    /**
     * Chrome 158 drops the headers of a response that is let through with a bare
     * `network.provideResponse`, and leaves one with an unknown status paused (#16498).
     */
    describe('lets a response through unchanged', () => {
        let server: Server
        let origin: string

        before(async () => {
            server = createServer((request, response) => {
                if (request.url === '/') {
                    response.setHeader('Content-Type', 'text/html')
                    return response.end('<!doctype html><title>Page</title>')
                }
                const status = request.url === '/unknown-status' ? 299 : 201
                // HTTP/2 has no status text: an empty one is the same for the browser
                const statusText = request.url === '/no-status-text' ? '' : 'Custom Text'
                response.writeHead(status, statusText, { 'Content-Type': 'application/json', 'X-Real': 'yes' })
                response.end('{"real":true}')
            })
            server.listen(0, '127.0.0.1')
            await once(server, 'listening')
            origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
        })

        after(() => {
            server?.close()
            server?.closeAllConnections()
        })

        const fetchInPage = (url: string) => browser.execute(async (url) => {
            const controller = new AbortController()
            setTimeout(() => controller.abort(), 5000)
            const response = await fetch(url, { cache: 'no-store', signal: controller.signal })
            return {
                status: response.status,
                statusText: response.statusText,
                contentType: response.headers.get('content-type'),
                real: response.headers.get('x-real'),
                body: await response.text()
            }
        }, url)

        for (const [path, status, statusText] of [
            ['/created', 201, 'Custom Text'],
            ['/unknown-status', 299, 'Custom Text'],
            ['/no-status-text', 201, '']
        ] as const) {
            it(`from a mock without respond() (${path})`, async () => {
                await browser.url(origin)
                const mock = await browser.mock(`${origin}${path}`)

                expect(await fetchInPage(`${origin}${path}`)).toEqual({
                    status,
                    statusText,
                    contentType: 'application/json',
                    real: 'yes',
                    body: '{"real":true}'
                })
                expect(mock.calls).toHaveLength(1)
            })
        }

        it('from a mock whose respondOnce() is used', async () => {
            await browser.url(origin)
            const mock = await browser.mock(`${origin}/created`)
            mock.respondOnce({ mocked: true }, { statusCode: 401 })

            expect(await fetchInPage(`${origin}/created`)).toMatchObject({ status: 401, body: '{"mocked":true}' })
            expect(await fetchInPage(`${origin}/created`)).toMatchObject({ status: 201, real: 'yes', body: '{"real":true}' })
        })
    })
})
