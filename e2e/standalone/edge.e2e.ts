import { beforeAll, describe, it, afterAll, expect } from 'vitest'
import DevTools, { type Client } from '../../packages/devtools/src/index.js'

let browser: Client

beforeAll(async () => {
    browser = await DevTools.newSession({
        outputDir: __dirname,
        capabilities: {
            browserName: 'edge',
            'wdio:devtoolsOptions': {
                dumpio: true,
                headless: true
            }
        }
    })
})

describe('Chromium Edge', () => {
    it('can browser pages', async () => {
        await browser.navigateTo('http://json.org/')
        expect(await browser.getTitle()).toBe('JSON')
    })

    it('has proper UA', async () => {
        const userAgent = await browser.executeScript('return navigator.userAgent', [])
        console.log('Detected user agent:', userAgent)
        expect(userAgent).toContain('Edg/')
    })
})

afterAll(async () => {
    if (!browser) {
        return
    }
    await browser.deleteSession()
})
