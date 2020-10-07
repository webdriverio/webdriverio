import DevTools from '../../packages/devtools/src/index'

import { ELEMENT_KEY } from '../../packages/devtools/src/constants'

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

test('running session with Chromium Edge', async () => {
    await browser.navigateTo('https://www.whatsmyua.info/')

    const elem = await browser.findElement('css selector', '#custom-ua-string')
    const userAgent = await browser.getElementProperty(elem[ELEMENT_KEY], 'value')

    console.log('Detected user agent:', userAgent)
    expect(userAgent).toContain('Edg/')
})

afterAll(async () => {
    await browser.deleteSession()
})
