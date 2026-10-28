import http from 'node:http'
import { once } from 'node:events'
import type { AddressInfo } from 'node:net'
import { test, expect } from 'vitest'

import { startStandaloneChrome } from './helpers.js'

/**
 * A mock answers each paused request in a network event listener. When the session
 * ends while some answers are in flight, their WebDriver BiDi commands are rejected:
 * the script must not end with an unhandled rejection (exit code 1 in Node)
 */
test('a mock does not leave an unhandled rejection when the session ends', async () => {
    const server = http.createServer((request, response) => {
        if (request.url?.startsWith('/slow/')) {
            setTimeout(() => response.end('ok'), 300)
            return
        }
        response.setHeader('Content-Type', 'text/html')
        response.end('<p>page</p>')
    })
    server.listen(0, '127.0.0.1')
    await once(server, 'listening')

    const unhandled: unknown[] = []
    const onUnhandled = (reason: unknown) => { unhandled.push(reason) }
    process.on('unhandledRejection', onUnhandled)

    let browser: Awaited<ReturnType<typeof startStandaloneChrome>> | undefined
    let sessionEnded = false
    try {
        browser = await startStandaloneChrome()
        await browser.url(`http://127.0.0.1:${(server.address() as AddressInfo).port}/`)
        await browser.mock('**/slow/**')
        /**
         * a burst of requests right before `deleteSession`, and more while it runs: the
         * mock still answers some of them when the connection closes
         */
        await browser.execute(() => {
            let i = 0
            for (; i < 100; i++) {
                fetch(`/slow/${i}`).catch(() => {})
            }
            setInterval(() => { fetch(`/slow/${i++}`).catch(() => {}) }, 1)
        })
        await browser.deleteSession()
        sessionEnded = true

        /**
         * the answers that were in flight are rejected when the connection closes
         */
        await new Promise((resolve) => setTimeout(resolve, 1000))
        expect(unhandled.map((reason) => (reason as Error)?.message ?? String(reason))).toEqual([])
    } finally {
        process.off('unhandledRejection', onUnhandled)
        if (browser && !sessionEnded) {
            await browser.deleteSession().catch(() => {})
        }
        server.close()
    }
})
