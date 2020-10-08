import DevTools from '../../packages/devtools/src/index'

let browser

beforeAll(async () => {
    browser = await DevTools.newSession({
        outputDir: __dirname,
        capabilities: {
            browserName: 'edge',
            'ms:edgeOptions': {
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
    await browser.deleteSession()
})
