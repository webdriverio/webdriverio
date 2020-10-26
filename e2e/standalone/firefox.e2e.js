import DevTools from '../../packages/devtools/src/index'

let browser

beforeAll(async () => {
    browser = await DevTools.newSession({
        outputDir: __dirname,
        capabilities: {
            browserName: 'firefox',
            'moz:firefoxOptions': {
                headless: true
            }
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
    await browser.deleteSession()
})
