import http from 'node:http'
import { once } from 'node:events'
import type { AddressInfo } from 'node:net'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { startStandaloneChrome } from './helpers.js'

/**
 * `ck.test` and `a.ck.test` resolve to the local server, so a domain cookie and a
 * host-only cookie can be told apart without network access
 */
const HOSTS = ['ck.test', 'a.ck.test']
const BROWSERS = {
    chrome: {
        browserName: 'chrome',
        'goog:chromeOptions': { args: ['headless', 'disable-gpu', `host-resolver-rules=${HOSTS.map((host) => `MAP ${host} 127.0.0.1`).join(', ')}`] }
    },
    firefox: {
        browserName: 'firefox',
        'moz:firefoxOptions': { args: ['-headless'], prefs: { 'network.dns.localDomains': HOSTS.join(',') } }
    }
} as const
const MODES = {
    classic: { 'wdio:enforceWebDriverClassic': true },
    bidi: { webSocketUrl: true },
    'bidi + wdio:experimentalBiDiCommands': { webSocketUrl: true, 'wdio:experimentalBiDiCommands': true }
} as const

let server: http.Server
let port: number
const page = (host: string) => `http://${host}:${port}/`

beforeAll(async () => {
    server = http.createServer((_, res) => {
        res.setHeader('content-type', 'text/html')
        res.end('<title>cookies</title>')
    }).listen(0, '127.0.0.1')
    await once(server, 'listening')
    port = (server.address() as AddressInfo).port
})

afterAll(() => {
    server?.close()
})

describe.each(Object.entries(BROWSERS))('cookies in %s', (_, capabilities) => {
    describe.each(Object.entries(MODES))('%s', (mode, protocol) => {
        let browser: WebdriverIO.Browser

        beforeAll(async () => {
            // the helper retries a driver that is still shutting down; the capabilities replace its Chrome defaults
            browser = await startStandaloneChrome({ logLevel: 'warn', capabilities: { ...capabilities, ...protocol } as WebdriverIO.Capabilities })
        })

        afterAll(async () => {
            await browser?.deleteSession()
        })

        // WebDriver Classic only accepts "Strict" / "Lax" / "None", WebDriver BiDi only lowercase values
        it('sets sameSite in both spellings', async () => {
            await browser.url(page('ck.test'))
            await browser.setCookies([
                { name: 'pascal', value: '1', sameSite: 'Strict' },
                { name: 'lower', value: '1', sameSite: 'lax' }
            ])
            const sameSite = Object.fromEntries((await browser.getCookies()).map((cookie) => [cookie.name, cookie.sameSite]))
            expect(String(sameSite.pascal).toLowerCase()).toBe('strict')
            expect(String(sameSite.lower).toLowerCase()).toBe('lax')
            if (mode !== 'bidi') {
                expect(sameSite).toMatchObject(mode === 'classic' ? { pascal: 'Strict', lower: 'Lax' } : { pascal: 'strict', lower: 'lax' })
            }
            await browser.deleteCookies(['pascal', 'lower'])
        })

        // the cookie filter relies on the browsers: a domain cookie has a leading dot, a host-only cookie none
        it.runIf(mode === 'bidi + wdio:experimentalBiDiCommands')('keeps the cookies that the page sees', async () => {
            await browser.url(page('a.ck.test'))
            await browser.setCookies({ name: 'sub-only', value: '1' })
            await browser.url(page('ck.test'))
            await browser.setCookies([
                { name: 'host-only', value: '1' },
                { name: 'domain', value: '1', domain: '.ck.test' }
            ])
            expect((await browser.storageGetCookies({})).cookies.map((cookie) => `${cookie.name} ${cookie.domain}`).sort())
                .toEqual(['domain .ck.test', 'host-only ck.test', 'sub-only a.ck.test'])

            await browser.url(page('a.ck.test'))
            const names = async () => (await browser.getCookies()).map((cookie) => cookie.name).sort()
            const documentCookie = async () => (await browser.execute(() => document.cookie)).split('; ').map((cookie) => cookie.split('=')[0]).sort()
            expect(await names()).toEqual(['domain', 'sub-only'])
            expect(await documentCookie()).toEqual(['domain', 'sub-only'])

            await browser.url(page('ck.test'))
            await browser.deleteCookies()
            expect((await browser.getCookies(undefined, null)).map((cookie) => cookie.name)).toEqual(['sub-only'])
            await browser.url(page('a.ck.test'))
            await browser.deleteCookies()
        })
    })
})
