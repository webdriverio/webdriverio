import { createServer, type Server } from 'node:http'
import { once } from 'node:events'
import type { AddressInfo } from 'node:net'
import { browser, expect } from '@wdio/globals'

declare global {
    namespace WebdriverIO {
        interface BrowsingContext {
            heading: () => Promise<string>
            describeContext: () => Promise<{ isFrame: boolean, sameBrowser: boolean }>
            lateCommand: () => Promise<string>
        }
    }
}

async function listen (pages: (origin: string) => Record<string, string>) {
    let origin = ''
    const server = createServer((request, response) => {
        response.setHeader('Content-Type', 'text/html; charset=utf-8')
        response.end(pages(origin)[request.url || '/'] || '')
    })
    server.listen(0, '127.0.0.1')
    await once(server, 'listening')
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    return { server, origin }
}

async function close (server: Server) {
    const closed = new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
    server.closeAllConnections()
    await closed
}

/**
 * `browser.addCommand(name, fn, { attachToBrowsingContext: true })` adds a
 * command to every tab, window and frame, including a cross-origin frame.
 */
describe('custom commands on browsing contexts', () => {
    let main: { server: Server, origin: string }
    let framed: { server: Server, origin: string }

    before(async function () {
        if (!browser.isBidi) {
            return this.skip()
        }

        /**
         * two servers on two ports are two origins, so the iframe is cross-origin
         */
        framed = await listen(() => ({
            '/framed': '<title>Framed</title><h1>Cross-origin frame</h1>'
        }))
        main = await listen(() => ({
            '/main': `<title>Main</title><h1>Main page</h1><iframe src="${framed.origin}/framed"></iframe>`
        }))

        browser.addCommand('heading', async function (this: WebdriverIO.BrowsingContext) {
            return this.$('h1').getText()
        }, { attachToBrowsingContext: true })
        browser.addCommand('describeContext', async function (this: WebdriverIO.BrowsingContext) {
            return { isFrame: this.isFrame, sameBrowser: this.browser.sessionId === browser.sessionId }
        }, { attachToBrowsingContext: true })
        browser.overwriteCommand('getTitle', async function (this: WebdriverIO.BrowsingContext, origGetTitle) {
            return `[${this.isFrame ? 'frame' : 'page'}] ${await origGetTitle()}`
        }, { attachToBrowsingContext: true })
    })

    after(async () => {
        await Promise.all([main, framed].filter(Boolean).map(({ server }) => close(server)))
    })

    it('runs a custom command on a page and on a cross-origin frame', async () => {
        const page = await browser.url(`${main.origin}/main`)
        if (!page) {
            throw new Error('expected browser.url() to return a browsing context')
        }
        expect(await page.heading()).toBe('Main page')
        expect(await page.describeContext()).toEqual({ isFrame: false, sameBrowser: true })

        const frame = await page.frame(`${framed.origin}/framed`)
        expect(await frame.heading()).toBe('Cross-origin frame')
        expect(await frame.describeContext()).toEqual({ isFrame: true, sameBrowser: true })
    })

    it('uses an overwritten built-in command on pages and frames', async () => {
        const page = await browser.url(`${main.origin}/main`)
        if (!page) {
            throw new Error('expected browser.url() to return a browsing context')
        }
        expect(await page.getTitle()).toBe('[page] Main')
        const frame = await page.frame(`${framed.origin}/framed`)
        expect(await frame.getTitle()).toBe('[frame] Framed')
    })

    it('adds a command to a context the test already holds', async () => {
        const [page] = await browser.browsingContexts()
        expect(page.lateCommand).toBeUndefined()

        browser.addCommand('lateCommand', async function (this: WebdriverIO.BrowsingContext) {
            return this.getUrl()
        }, { attachToBrowsingContext: true })

        expect(await page.lateCommand()).toBe(`${main.origin}/main`)
    })
})
