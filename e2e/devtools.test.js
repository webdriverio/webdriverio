import DevTools from '../packages/devtools/build/index'

let browser

beforeAll(async () => {
    browser = await DevTools.newSession({
        outputDir: __dirname,
        capabilities: {
            browserName: 'chrome',
            'goog:chromeOptions': {
                headless: true
            }
        }
    })
})

it('should navigate to a page', async () => {
    await browser.navigateTo('http://guinea-pig.webdriver.io')
    expect(await browser.getTitle()).toBe('WebdriverJS Testpage')
})

afterAll(async () => {
    await browser.deleteSession()
})
