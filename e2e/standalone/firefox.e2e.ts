import { beforeAll, describe, it, afterAll, expect } from 'vitest'
import DevTools, { Client } from '../../packages/devtools/src/index'

let browser: Client

beforeAll(async () => {
    browser = await DevTools.newSession({
        capabilities: {
            browserName: 'firefox',
            'wdio:devtoolsOptions': {
                dumpio: true,
                headless: true
            },
            ...(process.env.FIREFOX_BINARY
                ? { 'moz:firefoxOptions': { binary: process.env.FIREFOX_BINARY } }
                : {}
            )
        }
    })
})

describe('Firefox', () => {
    it('can browser pages', async () => {
        await browser.navigateTo('http://json.org/')
        expect(await browser.getTitle()).toBe('JSON')
    })

    it('has proper UA', async () => {
        const userAgent = await browser.executeScript('return navigator.userAgent', [])
        console.log('Detected user agent:', userAgent)
        expect(userAgent).toContain('Firefox')
    })
})

afterAll(async () => {
    if (!browser) {
        return
    }
    await browser.deleteSession()
})
